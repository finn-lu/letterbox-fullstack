"use client";

import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";

type SessionUser = {
  email?: string | null;
  avatar_url?: string | null;
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

const shelves = [
  {
    id: "now-showing",
    label: "Now showing",
    movies: [
      {
        title: "Dune: Part Two",
        poster: "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
      },
      {
        title: "Poor Things",
        poster: "https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
      },
      {
        title: "The Batman",
        poster: "https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
      },
      {
        title: "Oppenheimer",
        poster: "https://image.tmdb.org/t/p/w500/ptpr0kGAckfQkJeJIt8st5dglvd.jpg",
      },
      {
        title: "Anatomy of a Fall",
        poster: "https://image.tmdb.org/t/p/w500/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg",
      },
      {
        title: "Civil War",
        poster: "https://image.tmdb.org/t/p/w500/6Rh0Q8L3st4iSMwK7ndFY8jZ7dU.jpg",
      },
    ],
  },
  {
    id: "critics",
    label: "Critics picks",
    movies: [
      {
        title: "Past Lives",
        poster: "https://image.tmdb.org/t/p/w500/k3waqVXSnvCZWfJYNtdamTgTtTA.jpg",
      },
      {
        title: "Killers of the Flower Moon",
        poster: "https://image.tmdb.org/t/p/w500/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg",
      },
      {
        title: "Fallen Leaves",
        poster: "https://image.tmdb.org/t/p/w500/pwSpjQO1EGwZ8gZl1tSQGevxV0a.jpg",
      },
      {
        title: "The Holdovers",
        poster: "https://image.tmdb.org/t/p/w500/VHSzNBTwxV8qh8u9srj7zA17kv.jpg",
      },
      {
        title: "The Iron Claw",
        poster: "https://image.tmdb.org/t/p/w500/iKqHv5ruD3Noym8e4eo2QeUAGmR.jpg",
      },
      {
        title: "Zone of Interest",
        poster: "https://image.tmdb.org/t/p/w500/hUu9zyZm0Nk2cRm7O6cK7tG5xkO.jpg",
      },
    ],
  },
  {
    id: "hidden-gems",
    label: "Hidden gems",
    movies: [
      {
        title: "Aftersun",
        poster: "https://image.tmdb.org/t/p/w500/evKztU1pihfFk3XVZ3oN6ryFp67.jpg",
      },
      {
        title: "Perfect Days",
        poster: "https://image.tmdb.org/t/p/w500/l0Y9Dk9aCVlZr2K6mPMgh9H0B2O.jpg",
      },
      {
        title: "All of Us Strangers",
        poster: "https://image.tmdb.org/t/p/w500/oF0a5D9W8kQbE3C94EGSgR9pWW6.jpg",
      },
      {
        title: "Bottoms",
        poster: "https://image.tmdb.org/t/p/w500/7TNoDC5mB8QMvW9j6iPV6oVwXlJ.jpg",
      },
      {
        title: "The Taste of Things",
        poster: "https://image.tmdb.org/t/p/w500/5yGEA2L9feQloWcYQ2lbNQkKxAO.jpg",
      },
      {
        title: "The Beast",
        poster: "https://image.tmdb.org/t/p/w500/v5hq7BSq65a6j5E2X7mQe2m7YEC.jpg",
      },
    ],
  },
];

export default function Home() {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

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

  const fallbackInitial = sessionUser?.email?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-0 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="absolute top-20 right-0 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-rose-500/10 blur-3xl" />
      </div>

      <header className="relative z-10">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-400 to-rose-500" />
            <span className="text-xl font-semibold tracking-wide">Letterbox</span>
          </div>
          <div className="hidden gap-6 text-sm text-slate-300 md:flex">
            <a href="#now-showing" className="hover:text-white">Now</a>
            <a href="#critics" className="hover:text-white">Critics</a>
            <a href="#hidden-gems" className="hover:text-white">Hidden gems</a>
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
                href="/login"
                className="rounded-full bg-emerald-400 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-300"
              >
                Start rating
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
          {shelves.map((shelf) => (
            <div key={shelf.id} id={shelf.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-100">{shelf.label}</h2>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Scroll
                </span>
              </div>
              <div className="no-scrollbar flex gap-5 overflow-x-auto pb-2">
                {shelf.movies.map((movie) => (
                  <div
                    key={movie.title}
                    className="group relative min-w-[180px] rounded-2xl border border-slate-800 bg-slate-900/70 p-3 shadow-lg shadow-black/30 transition hover:-translate-y-2"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-amber-500/10 to-rose-500/10 opacity-0 transition group-hover:opacity-100" />
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="relative z-10 h-60 w-full rounded-xl object-cover"
                    />
                    <div className="relative z-10 mt-3">
                      <p className="text-sm font-semibold text-slate-100">{movie.title}</p>
                      <p className="text-xs text-slate-400">Curated pick</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

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
    </div>
  );
}
