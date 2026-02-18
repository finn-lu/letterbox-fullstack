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
