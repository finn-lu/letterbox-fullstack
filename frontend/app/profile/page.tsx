"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileDisplay from "../components/profile-display";
import ProfileEditModal from "../components/profile-edit-modal";
import MovieDrawer from "../components/movie-drawer";
import CreateListModal from "../components/create-list-modal";
import { supabase } from "../lib/supabaseClient";

type Profile = {
  id: string;
  user_id: string;
  display_name?: string;
  birth_date?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

type MovieSummary = {
  tmdb_id: number;
  rating?: number;
  created_at?: string;
  updated_at?: string;
  movie?: {
    title?: string;
    poster_path?: string;
  };
};

type ProfileSummary = {
  recent: MovieSummary[];
  top_rated: MovieSummary[];
  stats: {
    ratings_count: number;
    average_rating: number;
    watchlist_count: number;
  };
  watchlist_summary: {
    status: string;
    label: string;
    count: number;
  }[];
};

type RatedItem = {
  tmdb_id: number;
  rating?: number;
  created_at?: string;
  updated_at?: string;
  movie?: {
    title?: string;
    poster_path?: string;
  };
};

type CustomList = {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  is_public: boolean;
  sort_mode: "manual" | "recently_added" | "rating_desc";
  created_at: string;
  updated_at: string;
};

const apiUrl = "/api";
const tokenStorageKey = "letterbox_access_token";

const posterBaseUrl = "https://image.tmdb.org/t/p/w500";

const friends = [
  { name: "Lena", status: "Watching Dune: Part Two" },
  { name: "Jules", status: "Rated Poor Things 9.5" },
  { name: "Amir", status: "Added The Holdovers" },
  { name: "Mina", status: "Finished Past Lives" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [ratedItems, setRatedItems] = useState<RatedItem[]>([]);
  const [ratedError, setRatedError] = useState<string | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [customLists, setCustomLists] = useState<CustomList[]>([]);
  const [listsError, setListsError] = useState<string | null>(null);
  const [showCreateListModal, setShowCreateListModal] = useState(false);

  useEffect(() => {
    loadProfile();
    loadSummary();
    loadRated();
    loadCustomLists();
  }, []);

  async function loadProfile() {
    setIsLoading(true);
    setError(null);

    const token = localStorage.getItem(tokenStorageKey);
    if (!token) {
      setError("No access token found. Please log in.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Failed to load profile");
        return;
      }

      setProfile(data);
    } catch (err) {
      setError(`Error loading profile: ${String(err)}`);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadSummary() {
    setSummaryError(null);

    const token = localStorage.getItem(tokenStorageKey);
    if (!token) {
      setSummaryError("No access token found. Please log in.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/movies/profile/summary`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setSummaryError(data.detail || data.error || "Failed to load stats");
        return;
      }

      setSummary(data);
    } catch (err) {
      setSummaryError(`Error loading stats: ${String(err)}`);
    }
  }

  async function loadRated() {
    setRatedError(null);

    const token = localStorage.getItem(tokenStorageKey);
    if (!token) {
      setRatedError("No access token found. Please log in.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/movies/ratings/me/details`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setRatedError(data.detail || data.error || "Failed to load rated list");
        return;
      }

      setRatedItems(data.ratings ?? []);
    } catch (err) {
      setRatedError(`Error loading rated list: ${String(err)}`);
    }
  }

  async function loadCustomLists() {
    setListsError(null);

    const token = localStorage.getItem(tokenStorageKey);
    if (!token) {
      setListsError("No access token found. Please log in.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/movies/lists/me`, {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) {
        setListsError(data.detail || data.error || "Failed to load lists");
        return;
      }

      setCustomLists(data.lists ?? []);
    } catch (err) {
      setListsError(`Error loading lists: ${String(err)}`);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem(tokenStorageKey);
    router.push("/");
  }

  const recentItems = summary?.recent ?? [];
  const topRatedItems = summary?.top_rated ?? [];
  const ratingsCount = summary?.stats?.ratings_count ?? 0;
  const averageRating = summary?.stats
    ? summary.stats.average_rating.toFixed(1)
    : "0.0";
  const watchlistCount = summary?.stats?.watchlist_count ?? 0;

  const ratedList = ratedItems.slice(0, 12);

  function openMovie(tmdbId: number) {
    setSelectedMovieId(tmdbId);
    setIsDrawerOpen(true);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Back
          </button>
          <button
            onClick={handleLogout}
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
          >
            Logout
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <ProfileDisplay
            profile={profile}
            isLoading={isLoading}
            error={error}
            onRetry={loadProfile}
            onEditClick={() => setShowEditModal(true)}
          />

          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h3 className="text-lg font-semibold">Your stats</h3>
              {summaryError ? (
                <p className="mt-3 text-xs text-rose-400">{summaryError}</p>
              ) : null}
              <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-400">Movies rated</p>
                  <p className="mt-2 text-2xl font-semibold">{ratingsCount}</p>
                </div>
                <div className="rounded-xl bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-400">Avg score</p>
                  <p className="mt-2 text-2xl font-semibold">{averageRating}</p>
                </div>
                <div className="rounded-xl bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-400">Top genre</p>
                  <p className="mt-2 text-lg font-semibold">Sci-fi</p>
                </div>
                <div className="rounded-xl bg-slate-950/70 p-4">
                  <p className="text-xs text-slate-400">Watchlist</p>
                  <p className="mt-2 text-lg font-semibold">
                    {watchlistCount} queued
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
              <h3 className="text-lg font-semibold">Friends</h3>
              <div className="mt-4 space-y-3 text-sm">
                {friends.map((friend) => (
                  <div
                    key={friend.name}
                    className="flex items-center justify-between rounded-xl bg-slate-950/70 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-slate-100">{friend.name}</p>
                      <p className="text-xs text-slate-400">{friend.status}</p>
                    </div>
                    <span className="text-xs text-amber-400">Active</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section className="mt-12 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Recently watched</h2>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Last 10
              </p>
            </div>
            <button className="rounded-full border border-slate-800 px-4 py-1 text-xs text-slate-300 hover:border-slate-600">
              See all
            </button>
          </div>
          <div className="no-scrollbar flex gap-5 overflow-x-auto pb-2">
            {recentItems.length === 0 ? (
              <div className="min-w-[240px] rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                Rate a few movies to see your recent activity here.
              </div>
            ) : (
              recentItems.map((item) => {
                const title = item.movie?.title ?? "Untitled";
                const posterPath = item.movie?.poster_path;
                const posterUrl = posterPath ? `${posterBaseUrl}${posterPath}` : null;
                const ratingLabel =
                  typeof item.rating === "number"
                    ? `Rated ${item.rating.toFixed(1)}`
                    : "Watched recently";

                return (
                  <div
                    key={`${item.tmdb_id}-${item.created_at}`}
                    className="group min-w-[180px] cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-lg shadow-black/30 transition hover:-translate-y-2 hover:border-slate-600"
                    onClick={() => openMovie(item.tmdb_id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openMovie(item.tmdb_id);
                      }
                    }}
                  >
                    <div className="relative">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={title}
                          className="h-56 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-56 w-full items-center justify-center rounded-xl bg-slate-950/80 px-3 text-center text-xs text-slate-400">
                          {title}
                        </div>
                      )}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-100">{title}</p>
                    <p className="text-xs text-slate-400">{ratingLabel}</p>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Rated</h2>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Latest
              </p>
            </div>
            <button className="rounded-full border border-slate-800 px-4 py-1 text-xs text-slate-300 hover:border-slate-600">
              See all
            </button>
          </div>
          {ratedError ? (
            <p className="text-xs text-rose-400">{ratedError}</p>
          ) : null}
          <div className="no-scrollbar flex gap-5 overflow-x-auto pb-2">
            {ratedList.length === 0 ? (
              <div className="min-w-[240px] rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                Rate a movie to see your rated list here.
              </div>
            ) : (
              ratedList.map((item) => {
                const title = item.movie?.title ?? "Untitled";
                const posterPath = item.movie?.poster_path;
                const posterUrl = posterPath ? `${posterBaseUrl}${posterPath}` : null;
                const score =
                  typeof item.rating === "number" ? item.rating.toFixed(1) : "-";

                return (
                  <div
                    key={`${item.tmdb_id}-${item.updated_at ?? item.created_at}`}
                    className="group min-w-[180px] cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-lg shadow-black/30 transition hover:-translate-y-2 hover:border-amber-400/60"
                    onClick={() => openMovie(item.tmdb_id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openMovie(item.tmdb_id);
                      }
                    }}
                  >
                    <div className="relative">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={title}
                          className="h-56 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-56 w-full items-center justify-center rounded-xl bg-slate-950/80 px-3 text-center text-xs text-slate-400">
                          {title}
                        </div>
                      )}
                      <span className="absolute right-3 top-3 rounded-full bg-amber-400 px-2 py-0.5 text-xs font-semibold text-slate-950">
                        {score}
                      </span>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-100">{title}</p>
                    <p className="text-xs text-slate-400">
                      {item.updated_at ? "Updated rating" : "Your rating"}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-12 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">Top rated</h2>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Top 10
              </p>
            </div>
            <button className="rounded-full border border-slate-800 px-4 py-1 text-xs text-slate-300 hover:border-slate-600">
              See all
            </button>
          </div>
          <div className="no-scrollbar flex gap-5 overflow-x-auto pb-2">
            {topRatedItems.length === 0 ? (
              <div className="min-w-[240px] rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-6 text-sm text-slate-400">
                Your top rated movies will show up once you rate a few.
              </div>
            ) : (
              topRatedItems.map((item) => {
                const title = item.movie?.title ?? "Untitled";
                const posterPath = item.movie?.poster_path;
                const posterUrl = posterPath ? `${posterBaseUrl}${posterPath}` : null;
                const score =
                  typeof item.rating === "number"
                    ? item.rating.toFixed(1)
                    : "-";

                return (
                  <div
                    key={`${item.tmdb_id}-${item.created_at}`}
                    className="group min-w-[180px] cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-lg shadow-black/30 transition hover:-translate-y-2 hover:border-emerald-400/60"
                    onClick={() => openMovie(item.tmdb_id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openMovie(item.tmdb_id);
                      }
                    }}
                  >
                    <div className="relative">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={title}
                          className="h-56 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-56 w-full items-center justify-center rounded-xl bg-slate-950/80 px-3 text-center text-xs text-slate-400">
                          {title}
                        </div>
                      )}
                      <span className="absolute right-3 top-3 rounded-full bg-emerald-400 px-2 py-0.5 text-xs font-semibold text-slate-950">
                        {score}
                      </span>
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-100">{title}</p>
                    <p className="text-xs text-slate-400">Your highest rating</p>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="mt-12">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 lg:min-h-[320px] lg:flex lg:flex-col">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold">My lists</h3>
            </div>
            {listsError ? (
              <p className="mt-4 text-xs text-rose-400">{listsError}</p>
            ) : null}
            {customLists.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-6 text-sm text-slate-400">
                You have no custom lists yet. Use the + button to create one.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {customLists.map((list) => (
                  <div key={list.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-100">{list.name}</p>
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                        <span>{list.is_public ? "Public" : "Private"}</span>
                        <span>•</span>
                        <span>{list.sort_mode.replace("_", " ")}</span>
                      </div>
                    </div>
                    {list.description ? (
                      <p className="mt-2 text-xs text-slate-400">{list.description}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6 flex justify-center pt-2 lg:mt-auto lg:pt-5">
              <button
                onClick={() => setShowCreateListModal(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400 text-slate-950 transition hover:bg-emerald-300"
                aria-label="Create new list"
                title="Create new list"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14" />
                  <path d="M5 12h14" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        <ProfileEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={profile}
          onProfileUpdated={(updatedProfile) => {
            setProfile(updatedProfile);
          }}
        />

        <CreateListModal
          isOpen={showCreateListModal}
          onClose={() => setShowCreateListModal(false)}
          onCreated={(list) => {
            setCustomLists((previous) => [list, ...previous]);
          }}
        />

        <MovieDrawer
          tmdbId={selectedMovieId}
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          onRated={() => {
            loadSummary();
            loadRated();
          }}
          onWatchlistChanged={() => loadSummary()}
        />
      </div>
    </div>
  );
}
