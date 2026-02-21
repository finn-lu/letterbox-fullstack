"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import CameraRating from "../../components/camera-rating";

const apiUrl = "/api";
const tokenStorageKey = "letterbox_access_token";
const imageBaseUrl = "https://image.tmdb.org/t/p/w500";

type MovieDetails = {
  movie: {
    tmdb_id: number;
    title?: string;
    overview?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
    release_date?: string | null;
    vote_average?: number | null;
    genres?: { id?: number; name?: string }[] | null;
  };
  trailer?: {
    key?: string;
    name?: string;
  } | null;
  providers?: {
    link?: string | null;
    subscription?: { provider_id?: number; provider_name?: string; logo_path?: string | null }[];
    rent?: { provider_id?: number; provider_name?: string; logo_path?: string | null }[];
    buy?: { provider_id?: number; provider_name?: string; logo_path?: string | null }[];
  } | null;
  personal_lists?: {
    rated?: boolean;
    rating?: number | null;
    watchlist_status?: string | null;
  } | null;
};

export default function MovieDetailsPage() {
  const router = useRouter();
  const params = useParams<{ tmdbId: string }>();
  const movieId = useMemo(() => Number(params.tmdbId), [params.tmdbId]);

  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!movieId || Number.isNaN(movieId)) {
      setError("Invalid movie id");
      setIsLoading(false);
      return;
    }

    let isActive = true;
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem(tokenStorageKey);
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${apiUrl}/movies/${movieId}/details?region=US`, { headers })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || data.error || "Failed to load movie details");
        }
        return data as MovieDetails;
      })
      .then((data) => {
        if (!isActive) return;
        setDetails(data);
        setSelectedRating(data.personal_lists?.rating ?? null);
      })
      .catch((err) => {
        if (!isActive) return;
        setError(String(err));
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [movieId]);

  async function saveRating() {
    if (!selectedRating) {
      setStatus("Choose a rating first.");
      return;
    }

    const token = localStorage.getItem(tokenStorageKey);
    if (!token) {
      setStatus("Please log in to save ratings.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/movies/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tmdb_id: movieId, rating: selectedRating }),
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus(data.detail || data.error || "Failed to save rating.");
        return;
      }

      setStatus(`Saved ${selectedRating.toFixed(1)}/10`);
      setDetails((prev) =>
        prev
          ? {
              ...prev,
              personal_lists: {
                rated: true,
                rating: selectedRating,
                watchlist_status: prev.personal_lists?.watchlist_status ?? null,
              },
            }
          : prev
      );
    } catch (err) {
      setStatus(`Rating failed: ${String(err)}`);
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-slate-950 p-8 text-slate-200">Loading movie...</div>;
  }

  if (error || !details?.movie) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-200">
        <button
          onClick={() => router.push("/")}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>
        <p className="text-rose-300">{error ?? "Movie not found"}</p>
      </div>
    );
  }

  const movie = details.movie;
  const trailerKey = details.trailer?.key;
  const releaseYear = movie.release_date?.split("-")[0] ?? "—";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          onClick={() => router.push("/")}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Back
        </button>

        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
          {movie.backdrop_path ? (
            <img
              src={`${imageBaseUrl}${movie.backdrop_path}`}
              alt={movie.title ?? "Movie banner"}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/35" />

          <div className="relative z-10 grid min-h-[320px] gap-6 p-6 md:min-h-[380px] md:grid-cols-[1.2fr_0.8fr] md:p-10">
            <div className="flex flex-col justify-end">
              <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
                {movie.title ?? "Untitled"}
              </h1>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-300 md:text-base">
                <span>{releaseYear}</span>
                {typeof movie.vote_average === "number" ? (
                  <span>TMDB {movie.vote_average.toFixed(1)}/10</span>
                ) : null}
                {movie.genres?.slice(0, 4).map((genre) =>
                  genre?.name ? <span key={genre.id}>{genre.name}</span> : null
                )}
              </div>
              {movie.overview ? (
                <p className="mt-4 max-w-3xl text-sm text-slate-200 md:text-base">{movie.overview}</p>
              ) : null}
            </div>

            <div className="hidden items-end justify-end md:flex">
              {movie.poster_path ? (
                <img
                  src={`${imageBaseUrl}${movie.poster_path}`}
                  alt={movie.title ?? "Movie poster"}
                  className="h-64 w-44 rounded-2xl border border-slate-700 object-cover shadow-2xl"
                />
              ) : (
                <div className="flex h-64 w-44 items-center justify-center rounded-2xl border border-slate-700 bg-slate-900/80 text-xs text-slate-400">
                  No poster
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 md:p-6">
          <h2 className="text-xl font-semibold">Trailer</h2>
          {trailerKey ? (
            <div className="mt-4 aspect-video overflow-hidden rounded-2xl border border-slate-800">
              <iframe
                title={details.trailer?.name ?? "Trailer"}
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=0`}
                className="h-full w-full"
                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-400">No trailer available.</p>
          )}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 md:p-6">
            <h2 className="text-xl font-semibold">Your rating</h2>
            <p className="mt-2 text-sm text-slate-300">
              Rated: {details.personal_lists?.rated ? `${details.personal_lists.rating?.toFixed(1)}/10` : "No"}
            </p>
            <p className="text-sm text-slate-300">
              Watchlist: {details.personal_lists?.watchlist_status ? details.personal_lists.watchlist_status.replace("_", " ") : "Not in list"}
            </p>

            <div className="mt-4">
              <CameraRating value={selectedRating ?? undefined} onChange={setSelectedRating} />
            </div>
            <button
              onClick={saveRating}
              className="mt-4 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
            >
              Save rating
            </button>
            {status ? <p className="mt-2 text-xs text-slate-400">{status}</p> : null}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-5 md:p-6">
            <h2 className="text-xl font-semibold">Streaming</h2>
            <p className="mt-1 text-xs text-slate-500">Provider availability from TMDB.</p>
            {details.providers?.link ? (
              <a
                href={details.providers.link}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-amber-400 hover:text-amber-300"
              >
                Open all providers
              </a>
            ) : null}

            <div className="mt-4 space-y-3">
              {([
                { label: "Included", items: details.providers?.subscription ?? [] },
                { label: "Rent", items: details.providers?.rent ?? [] },
                { label: "Buy", items: details.providers?.buy ?? [] },
              ] as const).map((group) => (
                <div key={group.label}>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{group.label}</p>
                  {group.items.length ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.items.map((provider) => (
                        <a
                          key={provider.provider_id ?? provider.provider_name}
                          href={details.providers?.link ?? "#"}
                          target={details.providers?.link ? "_blank" : undefined}
                          rel={details.providers?.link ? "noreferrer" : undefined}
                          className="rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 text-xs text-slate-200 hover:border-amber-400/60"
                        >
                          {provider.provider_name ?? "Unknown"}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">No options listed.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
