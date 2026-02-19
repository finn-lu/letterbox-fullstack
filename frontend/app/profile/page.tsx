"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProfileDisplay from "../components/profile-display";
import ProfileEditModal from "../components/profile-edit-modal";
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

const apiUrl = "/api";
const tokenStorageKey = "letterbox_access_token";

const posterBaseUrl = "https://image.tmdb.org/t/p/w500";

const friends = [
  { name: "Lena", status: "Watching Dune: Part Two" },
  { name: "Jules", status: "Rated Poor Things 9.5" },
  { name: "Amir", status: "Added The Holdovers" },
  { name: "Mina", status: "Finished Past Lives" },
];

const suggestions = [
  {
    title: "Civil War",
    poster: "https://image.tmdb.org/t/p/w500/6Rh0Q8L3st4iSMwK7ndFY8jZ7dU.jpg",
  },
  {
    title: "Bottoms",
    poster: "https://image.tmdb.org/t/p/w500/7TNoDC5mB8QMvW9j6iPV6oVwXlJ.jpg",
  },
  {
    title: "Past Lives",
    poster: "https://image.tmdb.org/t/p/w500/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg",
  },
  {
    title: "The Batman",
    poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
  },
  {
    title: "Perfect Days",
    poster: "https://image.tmdb.org/t/p/w500/l0Y9Dk9aCVlZr2K6mPMgh9H0B2O.jpg",
  },
  {
    title: "Oppenheimer",
    poster: "https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg",
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
    loadSummary();
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

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem(tokenStorageKey);
    router.push("/");
  }

  const recentItems = summary?.recent ?? [];
  const topRatedItems = summary?.top_rated ?? [];
  const watchlistSummary = summary?.watchlist_summary ?? [];
  const ratingsCount = summary?.stats?.ratings_count ?? 0;
  const averageRating = summary?.stats
    ? summary.stats.average_rating.toFixed(1)
    : "0.0";
  const watchlistCount = summary?.stats?.watchlist_count ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-slate-300 hover:text-white"
          >
            ← Back to landing
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
                    className="group min-w-[180px] rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-lg shadow-black/30 transition hover:-translate-y-2 hover:border-slate-600"
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
                    className="group min-w-[180px] rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-lg shadow-black/30 transition hover:-translate-y-2 hover:border-emerald-400/60"
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

        <section className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h3 className="text-lg font-semibold">My lists</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {watchlistSummary.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/50 p-6 text-sm text-slate-400">
                  Add movies to your watchlist to see progress here.
                </div>
              ) : (
                watchlistSummary.map((item) => (
                  <div
                    key={item.status}
                    className="rounded-xl bg-slate-950/70 p-4"
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                      {item.label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-slate-100">
                      {item.count}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h3 className="text-lg font-semibold">Suggestions for you</h3>
            <p className="mt-2 text-xs text-slate-400">
              Based on your watch history and top ratings.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {suggestions.map((movie) => (
                <img
                  key={movie.title}
                  src={movie.poster}
                  alt={movie.title}
                  className="h-28 w-full rounded-lg object-cover"
                />
              ))}
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
      </div>
    </div>
  );
}
