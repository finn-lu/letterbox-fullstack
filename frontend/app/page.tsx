"use client";

import { useState, useEffect } from "react";
import MoviesSwipe from "./components/movies-swipe";
import ProfileDisplay from "./components/profile-display";
import ProfileEditModal from "./components/profile-edit-modal";
import { supabase } from "./lib/supabaseClient";

type User = {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
};

type Profile = {
  id: string;
  user_id: string;
  display_name?: string;
  birth_date?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

const apiUrl = "/api";
const tokenStorageKey = "letterbox_access_token";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState("Ready");
  const [isLoading, setIsLoading] = useState(false);
  const [showMovies, setShowMovies] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  function normalizeErrorDetail(detail: unknown): string {
    if (typeof detail === "string") return detail;
    if (detail && typeof detail === "object") {
      try {
        return JSON.stringify(detail);
      } catch {
        return "Unknown error";
      }
    }
    return "Unknown error";
  }

  // Load profile from localStorage and Supabase session on mount
  useEffect(() => {
    const token = localStorage.getItem(tokenStorageKey);
    if (token) {
      setAccessToken(token);
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("Supabase session error:", error.message);
        return;
      }

      const session = data.session;
      if (!session?.access_token) {
        return;
      }

      const oauthToken = session.access_token;
      setAccessToken(oauthToken);
      localStorage.setItem(tokenStorageKey, oauthToken);
      setUser({
        id: session.user.id,
        email: session.user.email ?? null,
        email_confirmed_at: session.user.email_confirmed_at ?? null,
      });
      loadProfileWithToken(oauthToken);
    });
  }, []);

  async function signInWithGoogle() {
    setStatus("Redirecting to Google...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });

    if (error) {
      setStatus(`Google sign-in failed: ${error.message}`);
    }
  }

  async function signInWithApple() {
    setStatus("Redirecting to Apple...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo: window.location.origin },
    });

    if (error) {
      setStatus(`Apple sign-in failed: ${error.message}`);
    }
  }

  async function registerUser() {
    const normalizedEmail = email.trim().toLowerCase();

    setIsLoading(true);
    setStatus("Registering user...");

    try {
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.detail ?? "Registration failed");
        return;
      }

      setStatus(
        data.email_confirmation_required
          ? "Registered. Confirm email in Supabase before login."
          : "Registered successfully."
      );
      setUser(data.user ?? null);

      // Auto-load profile after registration
      if (data.access_token) {
        const token = data.access_token as string;
        setAccessToken(token);
        localStorage.setItem(tokenStorageKey, token);
        loadProfileWithToken(token);
      }
    } catch (error) {
      setStatus(
        `Registration network error: ${String(error)}. Check frontend proxy and backend reachability.`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loginUser() {
    const normalizedEmail = email.trim().toLowerCase();

    setIsLoading(true);
    setStatus("Logging in...");

    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.detail ?? "Login failed");
        return;
      }

      const token = data.access_token as string;
      setAccessToken(token);
      localStorage.setItem(tokenStorageKey, token);
      setUser(data.user ?? null);
      setStatus("Login successful.");

      // Auto-load profile after login
      loadProfileWithToken(token);
    } catch (error) {
      setStatus(
        `Login network error: ${String(error)}. Check frontend proxy and backend reachability.`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loadProfileWithToken(token: string) {
    try {
      const response = await fetch(`${apiUrl}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        let errorDetail = "Failed to load profile";
        try {
          const errorBody = await response.json();
          errorDetail = normalizeErrorDetail(errorBody.detail ?? errorBody);
        } catch {
          // Ignore JSON parsing errors
        }
        console.error("Failed to load profile:", errorDetail);
        setStatus(`Profile not found: ${errorDetail}`);
        return;
      }

      const profileData = await response.json();
      setProfile(profileData);
      setShowProfile(true);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  }

  async function loadProfile() {
    const token = accessToken || localStorage.getItem(tokenStorageKey) || "";

    if (!token) {
      setStatus("No access token found. Please log in first.");
      return;
    }

    setIsLoading(true);
    setStatus("Loading profile...");

    try {
      const response = await fetch(`${apiUrl}/profile/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(normalizeErrorDetail(data.detail ?? data ?? "Failed to load profile"));
        return;
      }

      setProfile(data);
      setStatus("Profile loaded.");
      setShowProfile(true);
    } catch (error) {
      setStatus(
        `Profile network error: ${String(error)}. Check frontend proxy and backend reachability.`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function clearSession() {
    await supabase.auth.signOut();
    localStorage.removeItem(tokenStorageKey);
    setAccessToken("");
    setUser(null);
    setProfile(null);
    setStatus("Local session cleared.");
    setShowMovies(false);
    setShowProfile(false);
  }

  if (showMovies && user) {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setShowMovies(false)}
            className="rounded-md bg-red-600 px-3 py-1 text-sm text-white"
          >
            Back to Profile
          </button>
        </div>
        <MoviesSwipe />
      </div>
    );
  }

  // Show profile view when user is logged in and showProfile is true
  if (showProfile && user && profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-10">
        <main className="w-full max-w-md space-y-6">
          <div className="flex gap-2">
            <button
              onClick={() => setShowProfile(false)}
              className="rounded-md bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm text-white"
            >
              ← Back
            </button>
            <button
              onClick={clearSession}
              className="rounded-md bg-red-600 hover:bg-red-700 px-3 py-2 text-sm text-white"
            >
              Logout
            </button>
          </div>

          <ProfileDisplay onEditClick={() => setShowEditModal(true)} />

          <button
            onClick={() => setShowMovies(true)}
            className="w-full rounded-md bg-blue-600 hover:bg-blue-700 px-3 py-2 text-sm font-semibold text-white"
          >
            Discover Movies →
          </button>

          <ProfileEditModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            profile={profile}
            onProfileUpdated={(updatedProfile) => {
              setProfile(updatedProfile);
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <main className="w-full max-w-xl space-y-5 rounded-xl border border-foreground/10 p-6">
        <h1 className="text-3xl font-bold tracking-tight">Letterbox Auth Starter</h1>
        <p className="text-sm text-foreground/80">
          Register, login, and fetch current user via FastAPI + Supabase Auth.
        </p>
        <p className="text-xs text-foreground/70">API URL: {apiUrl} (proxied via Next.js)</p>

        <div className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span>Email</span>
            <input
              className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </label>

          <label className="block space-y-1 text-sm">
            <span>Password</span>
            <input
              className="w-full rounded-md border border-foreground/20 bg-transparent px-3 py-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-md border border-foreground/20 px-3 py-2 text-sm"
            onClick={registerUser}
            disabled={isLoading}
          >
            Register
          </button>
          <button
            className="rounded-md border border-foreground/20 px-3 py-2 text-sm"
            onClick={loginUser}
            disabled={isLoading}
          >
            Login
          </button>
          <button
            className="rounded-md border border-foreground/20 px-3 py-2 text-sm"
            onClick={signInWithGoogle}
            disabled={isLoading}
          >
            Sign in with Google
          </button>
          <button
            className="rounded-md border border-foreground/20 px-3 py-2 text-sm"
            onClick={signInWithApple}
            disabled={isLoading}
          >
            Sign in with Apple
          </button>
          <button
            className="rounded-md border border-foreground/20 px-3 py-2 text-sm"
            onClick={loadProfile}
            disabled={isLoading}
          >
            Load Profile
          </button>
          <button
            className="rounded-md border border-foreground/20 px-3 py-2 text-sm"
            onClick={clearSession}
            disabled={isLoading}
          >
            Clear session
          </button>
        </div>

        <p className="text-sm">Status: {status}</p>

        {user ? (
          <>
            <div className="space-y-1 rounded-md border border-foreground/10 p-3 text-sm">
              <p>User ID: {user.id}</p>
              <p>Email: {user.email ?? "-"}</p>
              <p>Confirmed: {user.email_confirmed_at ? "yes" : "no"}</p>
            </div>
            <button
              onClick={() => setShowProfile(true)}
              className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Profile →
            </button>
          </>
        ) : null}
      </main>
    </div>
  );
}
