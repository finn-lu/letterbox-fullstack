"use client";

import { useState } from "react";

type User = {
  id: string;
  email?: string | null;
  email_confirmed_at?: string | null;
};

const apiUrl = "/api";
const tokenStorageKey = "letterbox_access_token";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState("Ready");
  const [isLoading, setIsLoading] = useState(false);

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
    } catch (error) {
      setStatus(
        `Login network error: ${String(error)}. Check frontend proxy and backend reachability.`
      );
    } finally {
      setIsLoading(false);
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
      const response = await fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.detail ?? "Failed to load profile");
        return;
      }

      setUser(data);
      setStatus("Profile loaded.");
    } catch (error) {
      setStatus(
        `Profile network error: ${String(error)}. Check frontend proxy and backend reachability.`
      );
    } finally {
      setIsLoading(false);
    }
  }

  function clearSession() {
    localStorage.removeItem(tokenStorageKey);
    setAccessToken("");
    setUser(null);
    setStatus("Local session cleared.");
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
            onClick={loadProfile}
            disabled={isLoading}
          >
            Load /auth/me
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
          <div className="space-y-1 rounded-md border border-foreground/10 p-3 text-sm">
            <p>User ID: {user.id}</p>
            <p>Email: {user.email ?? "-"}</p>
            <p>Confirmed: {user.email_confirmed_at ? "yes" : "no"}</p>
          </div>
        ) : null}
      </main>
    </div>
  );
}
