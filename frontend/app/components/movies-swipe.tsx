"use client";

import { useState, useEffect } from "react";

type Movie = {
  id: number;
  tmdb_id: number;
  title: string;
  overview?: string;
  poster_path?: string;
  backdrop_path?: string;
  release_date?: string;
  vote_average?: number;
};

type MoviesData = {
  movies: Movie[];
  page: number;
  total_pages: number;
};

const apiUrl = "/api";
const tokenStorageKey = "letterbox_access_token";

export default function MoviesSwipe() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState("Loading movies...");
  const [isLoading, setIsLoading] = useState(true);
  const [ratings, setRatings] = useState<Record<number, number>>({});

  useEffect(() => {
    loadMovies();
    loadMyRatings();
  }, []);

  async function loadMovies() {
    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/movies?page=1`);
      const data: MoviesData = await response.json();
      setMovies(data.movies || []);
      setStatus(
        data.movies?.length ? `Loaded ${data.movies.length} movies` : "No movies found"
      );
    } catch (error) {
      setStatus(`Error loading movies: ${String(error)}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMyRatings() {
    const token = localStorage.getItem(tokenStorageKey);
    if (!token) return;

    try {
      const response = await fetch(`${apiUrl}/movies/ratings/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const ratingMap = (data.ratings || []).reduce(
          (acc: Record<number, number>, r: any) => {
            acc[r.tmdb_id] = r.rating;
            return acc;
          },
          {}
        );
        setRatings(ratingMap);
      }
    } catch {
      // Silent fail for ratings load
    }
  }

  async function rateMovie(rating: number) {
    if (currentIndex >= movies.length) return;

    const token = localStorage.getItem(tokenStorageKey);
    if (!token) {
      setStatus("Please log in to rate movies");
      return;
    }

    const movie = movies[currentIndex];

    try {
      const response = await fetch(`${apiUrl}/movies/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          tmdb_id: movie.tmdb_id,
          rating,
        }),
      });

      if (response.ok) {
        setRatings({ ...ratings, [movie.tmdb_id]: rating });
        setStatus(`Rated "${movie.title}" as ${rating}/10`);
      } else {
        const data = await response.json();
        setStatus(`Rating failed: ${data.detail}`);
      }
    } catch (error) {
      setStatus(`Error rating movie: ${String(error)}`);
    }

    // Move to next movie
    nextMovie();
  }

  function nextMovie() {
    if (currentIndex < movies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setStatus("No more movies! Load more.");
    }
  }

  function prevMovie() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>{status}</p>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <main className="w-full max-w-xl text-center space-y-4">
          <p className="text-lg">{status}</p>
          <button
            onClick={loadMovies}
            className="rounded-md bg-blue-600 px-4 py-2 text-white"
          >
            Reload
          </button>
        </main>
      </div>
    );
  }

  const movie = movies[currentIndex];
  const currentRating = ratings[movie.tmdb_id];

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <main className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">Letterbox Movies</h1>

        {/* Movie Card */}
        <div className="space-y-3 rounded-lg border border-foreground/10 overflow-hidden">
          {movie.poster_path && (
            <img
              src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
              alt={movie.title}
              className="w-full h-96 object-cover"
            />
          )}

          <div className="space-y-2 p-4">
            <h2 className="text-xl font-bold">{movie.title}</h2>
            {movie.release_date && (
              <p className="text-sm text-foreground/60">{movie.release_date.split("-")[0]}</p>
            )}
            {movie.vote_average && (
              <p className="text-sm">
                TMDB Rating: <span className="font-bold">{movie.vote_average.toFixed(1)}/10</span>
              </p>
            )}
            {movie.overview && (
              <p className="text-sm text-foreground/80 line-clamp-3">{movie.overview}</p>
            )}
            {currentRating && (
              <p className="text-sm bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded px-2 py-1 w-fit">
                You rated: {currentRating}/10
              </p>
            )}
          </div>
        </div>

        {/* Rating Buttons */}
        <div className="grid grid-cols-5 gap-2">
          {[1, 3, 5, 7, 10].map((rating) => (
            <button
              key={rating}
              onClick={() => rateMovie(rating)}
              className="rounded-md border border-foreground/20 py-2 text-sm font-semibold hover:bg-foreground/10"
            >
              {rating}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex gap-2 justify-center">
          <button
            onClick={prevMovie}
            disabled={currentIndex === 0}
            className="rounded-md border border-foreground/20 px-4 py-2 text-sm disabled:opacity-50"
          >
            ← Back
          </button>
          <button
            onClick={nextMovie}
            disabled={currentIndex >= movies.length - 1}
            className="rounded-md border border-foreground/20 px-4 py-2 text-sm disabled:opacity-50"
          >
            Skip →
          </button>
        </div>

        {/* Progress */}
        <div className="text-center text-sm text-foreground/70">
          {currentIndex + 1} / {movies.length} | {status}
        </div>
      </main>
    </div>
  );
}
