from fastapi import APIRouter, Header, HTTPException, status, Query
from typing import Optional
from datetime import datetime

from app.database import supabase, supabase_admin
from app.services.tmdb import TMDBClient, transform_movie_for_api
from app.schemas.movies import MovieResponse, RatingRequest, RatingResponse, WatchlistRequest
from app.routes.auth import _extract_bearer_token

router = APIRouter(prefix="/movies", tags=["movies"])


def _get_user_id_from_token(authorization: str | None) -> str:
    token = _extract_bearer_token(authorization)

    try:
        auth_user = supabase.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )

    user = getattr(auth_user, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    return user.id


def _parse_datetime(value: str | None) -> datetime:
    if not value:
        return datetime.min
    try:
        if value.endswith("Z"):
            value = value.replace("Z", "+00:00")
        return datetime.fromisoformat(value)
    except Exception:
        return datetime.min


def _fetch_movie_map(tmdb_ids: list[int]) -> dict[int, dict]:
    movie_map: dict[int, dict] = {}
    for tmdb_id in tmdb_ids:
        try:
            details = TMDBClient.get_movie_details(movie_id=tmdb_id)
            movie_map[tmdb_id] = transform_movie_for_api(details)
        except Exception:
            continue
    return movie_map


@router.get("", response_model=dict)
def get_popular_movies(page: int = Query(1, ge=1)):
    """Fetch popular movies from TMDB.
    
    Args:
        page: Page number for pagination
        
    Returns:
        Movies list with pagination info
    """
    try:
        tmdb_data = TMDBClient.get_popular_movies(page=page)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to fetch from TMDB: {exc}",
        )

    movies = [transform_movie_for_api(m) for m in tmdb_data.get("results", [])]

    return {
        "movies": movies,
        "page": tmdb_data.get("page"),
        "total_pages": tmdb_data.get("total_pages"),
        "total_results": tmdb_data.get("total_results"),
    }


@router.get("/search", response_model=dict)
def search_movies(q: str = Query(..., min_length=1), page: int = Query(1, ge=1)):
    """Search for movies by title.
    
    Args:
        q: Search query
        page: Page number for pagination
        
    Returns:
        Search results with pagination info
    """
    try:
        tmdb_data = TMDBClient.search_movies(query=q, page=page)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to search TMDB: {exc}",
        )

    movies = [transform_movie_for_api(m) for m in tmdb_data.get("results", [])]

    return {
        "movies": movies,
        "page": tmdb_data.get("page"),
        "total_pages": tmdb_data.get("total_pages"),
        "total_results": tmdb_data.get("total_results"),
    }


@router.post("/ratings", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
def create_rating(
    payload: RatingRequest,
    authorization: str | None = Header(default=None),
):
    """Create or update a rating for a movie.
    
    Args:
        payload: Rating data (tmdb_id, rating, review)
        authorization: Bearer token for user authentication
        
    Returns:
        Created/updated rating
    """
    token = _extract_bearer_token(authorization)

    try:
        auth_user = supabase.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )

    user = getattr(auth_user, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    user_id = user.id

    # Check if rating already exists
    try:
        existing = supabase.table("ratings").select("id").eq("user_id", user_id).eq(
            "tmdb_id", payload.tmdb_id
        ).execute()

        if existing.data:
            # Update existing
            rating_id = existing.data[0]["id"]
            result = supabase.table("ratings").update(
                {
                    "rating": payload.rating,
                    "review": payload.review,
                }
            ).eq("id", rating_id).execute()
        else:
            # Create new
            result = supabase.table("ratings").insert(
                {
                    "user_id": user_id,
                    "tmdb_id": payload.tmdb_id,
                    "rating": payload.rating,
                    "review": payload.review,
                }
            ).execute()

    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save rating: {exc}",
        )

    rating_data = result.data[0]

    return RatingResponse(
        id=rating_data["id"],
        user_id=rating_data["user_id"],
        tmdb_id=rating_data["tmdb_id"],
        rating=rating_data["rating"],
        review=rating_data.get("review"),
        created_at=rating_data.get("created_at", ""),
    )


@router.get("/ratings/me", response_model=dict)
def get_my_ratings(authorization: str | None = Header(default=None)):
    """Get current user's ratings.
    
    Returns:
        List of user's ratings
    """
    token = _extract_bearer_token(authorization)

    try:
        auth_user = supabase.auth.get_user(token)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {exc}",
        )

    user = getattr(auth_user, "user", None)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    try:
        result = supabase.table("ratings").select("*").eq("user_id", user.id).execute()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch ratings: {exc}",
        )

    ratings = [
        RatingResponse(
            id=r["id"],
            user_id=r["user_id"],
            tmdb_id=r["tmdb_id"],
            rating=r["rating"],
            review=r.get("review"),
            created_at=r.get("created_at", ""),
        )
        for r in result.data
    ]

    return {"ratings": ratings}


@router.get("/profile/summary", response_model=dict)
def get_profile_summary(authorization: str | None = Header(default=None)):
    user_id = _get_user_id_from_token(authorization)
    client = supabase_admin or supabase

    try:
        ratings_result = (
            client.table("ratings").select("*").eq("user_id", user_id).execute()
        )
        watchlist_result = (
            client.table("watchlist").select("*").eq("user_id", user_id).execute()
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile summary: {exc}",
        )

    ratings = ratings_result.data or []
    watchlist = watchlist_result.data or []

    ratings_recent = sorted(
        ratings,
        key=lambda rating: _parse_datetime(rating.get("created_at")),
        reverse=True,
    )
    ratings_top = sorted(
        ratings,
        key=lambda rating: (
            rating.get("rating") or 0,
            _parse_datetime(rating.get("created_at")),
        ),
        reverse=True,
    )

    recent_items = ratings_recent[:10]
    top_items = ratings_top[:10]

    tmdb_ids = list(
        {
            item.get("tmdb_id")
            for item in (recent_items + top_items)
            if item.get("tmdb_id")
        }
    )
    movie_map = _fetch_movie_map(tmdb_ids)

    def map_rating_item(item: dict) -> dict:
        tmdb_id = item.get("tmdb_id")
        return {
            "tmdb_id": tmdb_id,
            "rating": item.get("rating"),
            "created_at": item.get("created_at", ""),
            "movie": movie_map.get(tmdb_id),
        }

    ratings_count = len(ratings)
    average_rating = (
        round(sum(r.get("rating") or 0 for r in ratings) / ratings_count, 2)
        if ratings_count
        else 0.0
    )

    status_labels = {
        "to_watch": "To watch",
        "watching": "Watching",
        "completed": "Completed",
        "on_hold": "On hold",
        "dropped": "Dropped",
    }
    status_counts: dict[str, int] = {key: 0 for key in status_labels}
    for entry in watchlist:
        status_value = entry.get("status") or "to_watch"
        if status_value not in status_counts:
            status_counts[status_value] = 0
        status_counts[status_value] += 1

    watchlist_summary = [
        {
            "status": status,
            "label": status_labels.get(status, status.replace("_", " ").title()),
            "count": count,
        }
        for status, count in status_counts.items()
    ]

    return {
        "recent": [map_rating_item(item) for item in recent_items],
        "top_rated": [map_rating_item(item) for item in top_items],
        "stats": {
            "ratings_count": ratings_count,
            "average_rating": average_rating,
            "watchlist_count": len(watchlist),
        },
        "watchlist_summary": watchlist_summary,
    }
