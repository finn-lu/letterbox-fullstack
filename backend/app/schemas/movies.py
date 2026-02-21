from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MovieResponse(BaseModel):
    """Response model for a movie."""
    id: int
    tmdb_id: int
    title: str
    overview: Optional[str] = None
    poster_path: Optional[str] = None
    backdrop_path: Optional[str] = None
    release_date: Optional[str] = None
    vote_average: Optional[float] = None
    genres: Optional[list] = None


class RatingRequest(BaseModel):
    """Request model for rating a movie."""
    tmdb_id: int = Field(gt=0)
    rating: float = Field(ge=0.0, le=10.0)
    review: Optional[str] = Field(None, max_length=500)


class RatingResponse(BaseModel):
    """Response model for a rating."""
    id: str
    user_id: str
    tmdb_id: int
    rating: float
    review: Optional[str] = None
    created_at: str


class WatchlistRequest(BaseModel):
    """Request model for adding to watchlist."""
    tmdb_id: int = Field(gt=0)
    status: str = Field(default="to_watch")  # watching, completed, on_hold, dropped


class WatchlistResponse(BaseModel):
    """Response model for watchlist entry."""
    id: str
    user_id: str
    tmdb_id: int
    status: str
    added_at: str


class CustomListCreateRequest(BaseModel):
    """Request model for creating a custom user list."""
    name: str = Field(min_length=1, max_length=80)
    description: Optional[str] = Field(default=None, max_length=300)
    is_public: bool = Field(default=False)
    sort_mode: str = Field(default="manual")  # manual, recently_added, rating_desc


class CustomListResponse(BaseModel):
    """Response model for a custom user list."""
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    is_public: bool = False
    sort_mode: str = "manual"
    created_at: str
    updated_at: str
