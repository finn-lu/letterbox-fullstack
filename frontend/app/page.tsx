"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import MovieDrawer from "./components/movie-drawer";
import MovieSearch from "./components/movie-search";

type SessionUser = {
  email?: string | null;
  avatar_url?: string | null;
};

type MovieItem = {
  tmdb_id: number;
  title: string;
  poster_path?: string | null;
};

type ShelfData = {
  id: string;
  label: string;
  movies: MovieItem[];
};

const highlights = [
  {
    title: "Cinematic discovery",
    subtitle: "Swipe, rate, and curate your taste.",
  },
  {
    title: "Personal profile",
    subtitle: "Build your film identity with a modern card.",
  },
  {
    title: "Ratings archive",
    subtitle: "Track every reaction and revisit later.",
  },
];

const shelfConfig = [
  { id: "now-showing", label: "Now showing", page: 1 },
  { id: "critics", label: "Critics picks", page: 2 },
  { id: "hidden-gems", label: "Hidden gems", page: 3 },
];

const posterBaseUrl = "https://image.tmdb.org/t/p/w500";

export default function Home() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [shelves, setShelves] = useState<ShelfData[]>([]);
  const [shelfError, setShelfError] = useState<string | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const shelfRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) return;
      setSessionUser({
        email: session.user.email ?? null,
        avatar_url: (session.user.user_metadata?.avatar_url as string) ?? null,
      });
    });
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadShelves() {
      setShelfError(null);

      try {
        const responses = await Promise.all(
          shelfConfig.map((shelf) =>
            fetch(`/api/movies?page=${shelf.page}`).then(async (response) => {
              const data = await response.json();
              if (!response.ok) {
                throw new Error(data.detail || data.error || "Failed to load movies");
              }
              return { shelf, data };
            })
          )
        );

        if (!isActive) return;

        const nextShelves = responses.map(({ shelf, data }) => ({
          id: shelf.id,
          label: shelf.label,
          movies: (data.movies ?? []).map((movie: MovieItem) => ({
            tmdb_id: movie.tmdb_id,
            title: movie.title,
            poster_path: movie.poster_path ?? null,
          })),
        }));

        setShelves(nextShelves);
      } catch (err) {
        if (!isActive) return;
        setShelfError(String(err));
      }
    }

    loadShelves();

    return () => {
      isActive = false;
    };
  }, []);

  const fallbackInitial = sessionUser?.email?.[0]?.toUpperCase() ?? "?";

  function openMovie(tmdbId: number) {
    setSelectedMovieId(tmdbId);
    setIsDrawerOpen(true);
  }

  function closeMovie() {
    setIsDrawerOpen(false);
  }

  function scrollShelf(shelfId: string, direction: "left" | "right") {
    const container = shelfRefs.current[shelfId];
    if (!container) return;

    const offset = direction === "left" ? -460 : 460;
    container.scrollBy({ left: offset, behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-0 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <header className="relative z-40">
        <nav className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/80 text-amber-400 shadow-lg shadow-black/20">
              <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
                <rect x="4" y="8" width="13" height="10" rx="2" fill="currentColor" />
                <rect x="8" y="6" width="3" height="2" rx="1" fill="currentColor" />
                <circle cx="10.5" cy="13" r="2.5" fill="#0f172a" />
                <polygon points="17,10 21,8.5 21,17.5 17,16" fill="currentColor" />
              </svg>
            </div>
            <span className="text-xl font-semibold tracking-wide">Letterbox</span>
          </div>

          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block">
            <MovieSearch />
          </div>

          <div className="flex items-center gap-3">
            {sessionUser ? (
              <a
                href="/profile"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900/80 text-sm text-slate-200 hover:border-slate-500"
                title="Go to profile"
              >
                {sessionUser.avatar_url ? (
                  <img
                    src={sessionUser.avatar_url}
                    alt="Profile"
                    className="h-9 w-9 rounded-full object-cover"
                  />
                ) : (
                  <span className="font-semibold">{fallbackInitial}</span>
                )}
              </a>
            ) : (
              <>
                <a
                  href="/login"
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-slate-500"
                >
                  Login
                </a>
                <a
                  href="/login"
                  className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400"
                >
                  Get started
                </a>
              </>
            )}
          </div>
        </nav>
      </header>

      <main className="relative z-10">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 pb-24 pt-10 lg:flex-row lg:items-center">
          <div className="flex-1 space-y-6">
            <p className="text-sm uppercase tracking-[0.2em] text-amber-400">
              The new movie ritual
            </p>
            <h1 className="text-5xl font-semibold leading-tight md:text-6xl">
              A cinematic home for your taste, memory, and obsession.
            </h1>
            <p className="max-w-xl text-lg text-slate-300">
              Curate nightly picks, build your profile, and explore films with a scrollable
              showcase of what is moving the culture.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={sessionUser ? "/profile" : "/login"}
                className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
              >
                {sessionUser ? "Go to profile" : "Start rating"}
              </a>
              <a
                href="#now-showing"
                className="rounded-full border border-slate-700 px-6 py-3 text-sm text-slate-100 hover:border-slate-500"
              >
                Explore showcases
              </a>
            </div>
          </div>
          <div className="flex-1">
            <div className="grid gap-4 sm:grid-cols-2">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/20"
                >
                  <h3 className="text-lg font-semibold text-slate-100">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{item.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl space-y-12 px-6 pb-24">
          {shelfError ? (
            <div className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-200">
              {shelfError}
            </div>
          ) : null}
          {shelves.map((shelf) => (
            <div key={shelf.id} id={shelf.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-100">{shelf.label}</h2>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Scroll
                </span>
              </div>
              <div className="group relative">
                <button
                  onClick={() => scrollShelf(shelf.id, "left")}
                  className="pointer-events-none absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-700/80 bg-slate-950/80 p-2 text-slate-100 opacity-0 shadow-lg shadow-black/30 transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100 focus:pointer-events-auto focus:opacity-100"
                  aria-label={`Scroll ${shelf.label} left`}
                  title="Scroll left"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>

                <button
                  onClick={() => scrollShelf(shelf.id, "right")}
                  className="pointer-events-none absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-700/80 bg-slate-950/80 p-2 text-slate-100 opacity-0 shadow-lg shadow-black/30 transition duration-200 group-hover:pointer-events-auto group-hover:opacity-100 focus:pointer-events-auto focus:opacity-100"
                  aria-label={`Scroll ${shelf.label} right`}
                  title="Scroll right"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m9 6 6 6-6 6" />
                  </svg>
                </button>

                <div
                  ref={(element) => {
                    shelfRefs.current[shelf.id] = element;
                  }}
                  className="no-scrollbar flex gap-5 overflow-x-auto pb-2"
                >
                  {shelf.movies.map((movie) => (
                    <div
                      key={`${shelf.id}-${movie.tmdb_id}`}
                      className="group relative min-w-[180px] rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-lg shadow-black/30 transition hover:-translate-y-2"
                      onClick={() => openMovie(movie.tmdb_id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openMovie(movie.tmdb_id);
                        }
                      }}
                    >
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 opacity-0 transition group-hover:opacity-100" />
                      {movie.poster_path ? (
                        <img
                          src={`${posterBaseUrl}${movie.poster_path}`}
                          alt={movie.title}
                          className="relative z-10 h-60 w-full rounded-xl object-cover"
                        />
                      ) : (
                        <div className="relative z-10 flex h-60 w-full items-center justify-center rounded-xl bg-slate-900/60 px-3 text-center text-xs text-slate-400">
                          {movie.title}
                        </div>
                      )}
                      <div className="relative z-10 mt-3">
                        <p className="text-sm font-semibold text-slate-100">{movie.title}</p>
                        <p className="text-xs text-slate-400">Curated pick</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </section>

        {!sessionUser ? (
          <section className="mx-auto w-full max-w-6xl px-6 pb-24">
            <div className="grid gap-8 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-10 md:grid-cols-2">
              <div className="space-y-4">
                <h2 className="text-3xl font-semibold">Ready to build your film identity?</h2>
                <p className="text-slate-400">
                  Create your profile, rate films, and shape a recommendation feed that feels
                  handcrafted. Your next favorite is one scroll away.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="/login"
                  className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400"
                >
                  Join now
                </a>
                <a
                  href="#now-showing"
                  className="rounded-full border border-slate-700 px-6 py-3 text-sm text-slate-100"
                >
                  Browse picks
                </a>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="relative z-10 border-t border-slate-900">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>Letterbox - curated movie discovery.</span>
          <div className="flex gap-4">
            <a href="/login" className="hover:text-slate-300">Login</a>
            <a href="#now-showing" className="hover:text-slate-300">Showcases</a>
          </div>
        </div>
      </footer>

      <MovieDrawer
        tmdbId={selectedMovieId}
        isOpen={isDrawerOpen}
        onClose={closeMovie}
      />
    </div>
  );
}
