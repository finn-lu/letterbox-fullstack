"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SearchMovie = {
  tmdb_id: number;
  title: string;
  release_date?: string;
  poster_path?: string;
};

const posterBaseUrl = "https://image.tmdb.org/t/p/w154";

export default function MovieSearch() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchMovie[]>([]);

  useEffect(() => {
    function onDocumentMouseDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    document.addEventListener("mousedown", onDocumentMouseDown);
    return () => document.removeEventListener("mousedown", onDocumentMouseDown);
  }, []);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/movies/search?q=${encodeURIComponent(trimmedQuery)}&page=1`);
        const data = await response.json();
        if (!response.ok) {
          setSuggestions([]);
          return;
        }
        setSuggestions((data.movies ?? []).slice(0, 6));
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [query]);

  function openMovie(tmdbId: number) {
    setIsExpanded(false);
    setQuery("");
    setSuggestions([]);
    router.push(`/movie/${tmdbId}`);
  }

  const shouldShowDropdown = isExpanded && (isLoading || suggestions.length > 0 || query.trim().length > 0);

  return (
    <div ref={containerRef} className="relative z-[80]">
      {!isExpanded ? (
        <button
          type="button"
          aria-label="Open movie search"
          onClick={() => setIsExpanded(true)}
          className="flex h-11 w-11 items-center justify-center text-slate-100 transition hover:text-white"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
            <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
          </svg>
        </button>
      ) : (
        <div className="flex h-11 w-[340px] items-center gap-2 rounded-full border border-slate-700 bg-slate-900/95 px-3 transition-all duration-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-300" aria-hidden="true">
            <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" fill="none" />
            <line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" strokeWidth="2" />
          </svg>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search movies"
            className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
          />
        </div>
      )}

      {shouldShowDropdown ? (
        <div className="absolute right-0 z-[90] mt-2 w-[340px] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
          {isLoading ? (
            <p className="px-4 py-3 text-sm text-slate-400">Searching…</p>
          ) : suggestions.length === 0 ? (
            <p className="px-4 py-3 text-sm text-slate-400">No matching movies.</p>
          ) : (
            suggestions.map((movie) => {
              const year = movie.release_date ? movie.release_date.split("-")[0] : "—";
              return (
                <button
                  key={movie.tmdb_id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => openMovie(movie.tmdb_id)}
                  className="flex w-full items-center gap-3 border-b border-slate-900 px-4 py-3 text-left hover:bg-slate-900/80"
                >
                  {movie.poster_path ? (
                    <img
                      src={`${posterBaseUrl}${movie.poster_path}`}
                      alt={movie.title}
                      className="h-12 w-9 rounded object-cover"
                    />
                  ) : (
                    <div className="h-12 w-9 rounded bg-slate-800" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-100">{movie.title}</p>
                    <p className="text-xs text-slate-400">{year}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
