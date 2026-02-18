import os
import requests
from typing import Optional

TMDB_API_KEY = os.getenv("TMDB_API_KEY")
TMDB_BASE_URL = "https://api.themoviedb.org/3"


class TMDBClient:
    """Client for interacting with The Movie Database (TMDB) API."""

    @staticmethod
    def get_popular_movies(page: int = 1, language: str = "en-US") -> dict:
        """Fetch popular movies from TMDB.
        
        Args:
            page: Page number for pagination (default: 1)
            language: Language code (default: en-US)
            
        Returns:
            Dictionary with movies data and metadata
        """
        if not TMDB_API_KEY:
            raise ValueError("TMDB_API_KEY not configured in environment")

        url = f"{TMDB_BASE_URL}/movie/popular"
        params = {
            "api_key": TMDB_API_KEY,
            "language": language,
            "page": page,
        }

        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            raise RuntimeError(f"TMDB API error: {exc}")

    @staticmethod
    def get_movie_details(movie_id: int, language: str = "en-US") -> dict:
        """Fetch detailed information about a specific movie.
        
        Args:
            movie_id: TMDB movie ID
            language: Language code (default: en-US)
            
        Returns:
            Dictionary with detailed movie information
        """
        if not TMDB_API_KEY:
            raise ValueError("TMDB_API_KEY not configured in environment")

        url = f"{TMDB_BASE_URL}/movie/{movie_id}"
        params = {
            "api_key": TMDB_API_KEY,
            "language": language,
        }

        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            raise RuntimeError(f"TMDB API error: {exc}")

    @staticmethod
    def search_movies(query: str, language: str = "en-US", page: int = 1) -> dict:
        """Search for movies by title.
        
        Args:
            query: Search query string
            language: Language code (default: en-US)
            page: Page number for pagination (default: 1)
            
        Returns:
            Dictionary with search results
        """
        if not TMDB_API_KEY:
            raise ValueError("TMDB_API_KEY not configured in environment")

        url = f"{TMDB_BASE_URL}/search/movie"
        params = {
            "api_key": TMDB_API_KEY,
            "query": query,
            "language": language,
            "page": page,
        }

        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as exc:
            raise RuntimeError(f"TMDB API error: {exc}")


def transform_movie_for_api(tmdb_movie: dict) -> dict:
    """Transform TMDB movie data into API response format.
    
    Args:
        tmdb_movie: Raw movie data from TMDB API
        
    Returns:
        Transformed movie data for API response
    """
    return {
        "id": tmdb_movie.get("id"),
        "tmdb_id": tmdb_movie.get("id"),
        "title": tmdb_movie.get("title"),
        "overview": tmdb_movie.get("overview"),
        "poster_path": tmdb_movie.get("poster_path"),
        "backdrop_path": tmdb_movie.get("backdrop_path"),
        "release_date": tmdb_movie.get("release_date"),
        "vote_average": tmdb_movie.get("vote_average"),
        "genres": tmdb_movie.get("genres", []),
    }
