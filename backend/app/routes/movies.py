from fastapi import APIRouter, Header, HTTPException, status, Query
from typing import Optional

from app.database import supabase
from app.services.tmdb import TMDBClient, transform_movie_for_api
from app.schemas.movies import MovieResponse, RatingRequest, RatingResponse, WatchlistRequest
from app.routes.auth import _extract_bearer_token

router = APIRouter(prefix="/movies", tags=["movies"])


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
