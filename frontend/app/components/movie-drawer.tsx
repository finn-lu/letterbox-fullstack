"use client";

import { useEffect, useState } from "react";
import CameraRating from "./camera-rating";

const apiUrl = "/api";
const tokenStorageKey = "letterbox_access_token";
const posterBaseUrl = "https://image.tmdb.org/t/p/w500";
const watchlistStatuses = [
  { value: "to_watch", label: "To watch" },
  { value: "watching", label: "Watching" },
  { value: "completed", label: "Completed" },
  { value: "on_hold", label: "On hold" },
  { value: "dropped", label: "Dropped" },
] as const;

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

type MovieDrawerProps = {
  tmdbId: number | null;
  isOpen: boolean;
  initialRating?: number;
  onClose: () => void;
  onRated?: (tmdbId: number, rating: number) => void;
  onWatchlistChanged?: () => void;
};

export default function MovieDrawer({
  tmdbId,
  isOpen,
  initialRating,
  onClose,
  onRated,
  onWatchlistChanged,
}: MovieDrawerProps) {
  const [details, setDetails] = useState<MovieDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [listStatus, setListStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !tmdbId) return;

    let isActive = true;
    setIsLoading(true);
    setError(null);
    setDetails(null);

    const token = localStorage.getItem(tokenStorageKey);
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    fetch(`${apiUrl}/movies/${tmdbId}/details?region=US`, { headers })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || data.error || "Failed to load movie");
        }
        return data as MovieDetails;
      })
      .then((data) => {
        if (!isActive) return;
        setDetails(data);
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
  }, [isOpen, tmdbId]);

  useEffect(() => {
    setSelectedRating(initialRating ?? null);
  }, [initialRating, tmdbId]);

  useEffect(() => {
    setListStatus(details?.personal_lists?.watchlist_status ?? null);
  }, [details?.personal_lists?.watchlist_status, tmdbId]);

  if (!isOpen || !tmdbId) return null;

  const movie = details?.movie;
  const posterUrl = movie?.poster_path ? `${posterBaseUrl}${movie.poster_path}` : null;
  const releaseYear = movie?.release_date ? movie.release_date.split("-")[0] : null;
  const trailerKey = details?.trailer?.key;
  const providers = details?.providers;
  const personalLists = details?.personal_lists;

  async function handleSaveRating() {
    if (!tmdbId) return;

    if (!selectedRating) {
      setStatus("Choose a rating first.");
      return;
    }

    const token = localStorage.getItem(tokenStorageKey);
    if (!token) {
      setStatus("Please log in to rate movies.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/movies/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tmdb_id: tmdbId, rating: selectedRating }),
      });

      if (!response.ok) {
        const data = await response.json();
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
      if (onRated) {
        onRated(tmdbId, selectedRating);
      }
    } catch (err) {
      setStatus(`Rating failed: ${String(err)}`);
    }
  }

  async function handleSaveWatchlist(nextStatus: string) {
    if (!tmdbId) return;

    const token = localStorage.getItem(tokenStorageKey);
    if (!token) {
      setStatus("Please log in to manage your lists.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/movies/watchlist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tmdb_id: tmdbId, status: nextStatus }),
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus(data.detail || data.error || "Failed to update watchlist.");
        return;
      }

      setListStatus(nextStatus);
      setStatus(`List updated: ${nextStatus.replace("_", " ")}`);
      setDetails((prev) =>
        prev
          ? {
              ...prev,
              personal_lists: {
                rated: prev.personal_lists?.rated ?? false,
                rating: prev.personal_lists?.rating ?? null,
                watchlist_status: nextStatus,
              },
            }
          : prev
      );
      onWatchlistChanged?.();
    } catch (err) {
      setStatus(`List update failed: ${String(err)}`);
    }
  }

  async function handleRemoveWatchlist() {
    if (!tmdbId) return;

    const token = localStorage.getItem(tokenStorageKey);
    if (!token) {
      setStatus("Please log in to manage your lists.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/movies/watchlist/${tmdbId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus(data.detail || data.error || "Failed to remove watchlist item.");
        return;
      }

      setListStatus(null);
      setStatus("Removed from watchlist.");
      setDetails((prev) =>
        prev
          ? {
              ...prev,
              personal_lists: {
                rated: prev.personal_lists?.rated ?? false,
                rating: prev.personal_lists?.rating ?? null,
                watchlist_status: null,
              },
            }
          : prev
      );
      onWatchlistChanged?.();
    } catch (err) {
      setStatus(`Removal failed: ${String(err)}`);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full overflow-y-auto bg-slate-950 text-slate-100 shadow-2xl md:w-[70vw] lg:w-[60vw]">
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Movie</p>
            <h2 className="text-xl font-semibold">{movie?.title ?? "Loading..."}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-200 hover:border-slate-500"
          >
            Close
          </button>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-slate-400">Loading details...</div>
        ) : error ? (
          <div className="p-6 text-sm text-rose-300">{error}</div>
        ) : (
          <div className="space-y-8 p-6">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
              <div className="space-y-4">
                {posterUrl ? (
                  <img
                    src={posterUrl}
                    alt={movie?.title ?? "Movie poster"}
                    className="h-[360px] w-full rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-[360px] w-full items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/70 text-sm text-slate-400">
                    Poster unavailable
                  </div>
                )}

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm">
                  <div className="flex flex-wrap gap-3 text-slate-300">
                    {releaseYear ? <span>{releaseYear}</span> : null}
                    {typeof movie?.vote_average === "number" ? (
                      <span>TMDB {movie.vote_average.toFixed(1)}/10</span>
                    ) : null}
                    {movie?.genres?.length
                      ? movie.genres
                          .filter((genre) => genre?.name)
                          .slice(0, 3)
                          .map((genre) => (
                            <span key={genre?.id}>{genre?.name}</span>
                          ))
                      : null}
                  </div>
                  {movie?.overview ? (
                    <p className="mt-3 text-slate-200">{movie.overview}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <h3 className="text-sm font-semibold text-slate-100">Trailer</h3>
                  {trailerKey ? (
                    <div className="mt-3 aspect-video overflow-hidden rounded-xl border border-slate-800">
                      <iframe
                        title={details?.trailer?.name ?? "Trailer"}
                        src={`https://www.youtube.com/embed/${trailerKey}?autoplay=0`}
                        className="h-full w-full"
                        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">Trailer not available.</p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <h3 className="text-sm font-semibold text-slate-100">Streaming</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Availability from TMDB. Pricing varies by provider.
                  </p>
                  {providers?.link ? (
                    <a
                      href={providers.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs text-amber-400 hover:text-amber-300"
                    >
                      View full availability
                    </a>
                  ) : null}

                  <div className="mt-4 space-y-4 text-sm">
                    {([
                      { label: "Included", items: providers?.subscription ?? [] },
                      { label: "Rent", items: providers?.rent ?? [] },
                      { label: "Buy", items: providers?.buy ?? [] },
                    ] as const).map((group) => (
                      <div key={group.label}>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {group.label}
                        </p>
                        {group.items.length ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {group.items.map((provider) => (
                              <a
                                key={provider.provider_id ?? provider.provider_name}
                                href={providers?.link ?? "#"}
                                target={providers?.link ? "_blank" : undefined}
                                rel={providers?.link ? "noreferrer" : undefined}
                                className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-950/60 px-3 py-1 transition hover:border-amber-400/60"
                              >
                                {provider.logo_path ? (
                                  <img
                                    src={`${posterBaseUrl}${provider.logo_path}`}
                                    alt={provider.provider_name ?? "Provider"}
                                    className="h-5 w-5 rounded-full"
                                  />
                                ) : null}
                                <span className="text-xs text-slate-200">
                                  {provider.provider_name ?? "Unknown"}
                                </span>
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

                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <h3 className="text-sm font-semibold text-slate-100">Your rating</h3>
                  <div className="mt-2 text-xs text-slate-400">
                    {personalLists?.rated && typeof personalLists?.rating === "number" ? (
                      <p>Rated: {personalLists.rating.toFixed(1)}/10</p>
                    ) : (
                      <p>Rated: Not yet</p>
                    )}
                    <p>
                      Watchlist: {listStatus
                        ? listStatus.replace("_", " ")
                        : "Not in list"}
                    </p>
                  </div>
                  <div className="mt-3">
                    <CameraRating
                      value={selectedRating ?? undefined}
                      onChange={(rating) => setSelectedRating(rating)}
                    />
                  </div>
                  <button
                    onClick={handleSaveRating}
                    className="mt-4 w-full rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
                  >
                    Save rating
                  </button>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      value={listStatus ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value) {
                          handleSaveWatchlist(value);
                        }
                      }}
                      className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-2 text-xs text-slate-200 focus:border-amber-400 focus:outline-none"
                    >
                      <option value="">Add to list…</option>
                      {watchlistStatuses.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                    {listStatus ? (
                      <button
                        onClick={handleRemoveWatchlist}
                        className="rounded-full border border-rose-500/50 px-3 py-2 text-xs text-rose-200 hover:border-rose-400"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  {status ? (
                    <p className="mt-2 text-xs text-slate-400">{status}</p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
