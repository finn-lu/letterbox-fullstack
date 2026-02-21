"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

const apiUrl = "/api";
const tokenStorageKey = "letterbox_access_token";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [status, setStatus] = useState("Ready");
  const [isLoading, setIsLoading] = useState(false);

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

  // Load session from Supabase on mount (OAuth callback)
  useEffect(() => {
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
      localStorage.setItem(tokenStorageKey, oauthToken);
      fillProfileFromGoogle(oauthToken, session.user.user_metadata);
      router.push("/");
    });
  }, [router]);

  async function signInWithGoogle() {
    setStatus("Redirecting to Google...");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/login" },
    });

    if (error) {
      setStatus(`Google sign-in failed: ${error.message}`);
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
      // Auto-login after registration
      await loginUser(true);
    } catch (error) {
      setStatus(
        `Registration network error: ${String(error)}. Check frontend proxy and backend reachability.`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function loginUser(fromRegister = false) {
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
      localStorage.setItem(tokenStorageKey, token);
      setStatus("Login successful.");

      if (fromRegister) {
        await updateProfile(token, {
          display_name: displayName || null,
          birth_date: birthDate || null,
          avatar_url: avatarUrl || null,
        });
      }

      router.push("/");
    } catch (error) {
      setStatus(
        `Login network error: ${String(error)}. Check frontend proxy and backend reachability.`
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function updateProfile(token: string, payload: Record<string, string | null>) {
    const sanitized = Object.fromEntries(
      Object.entries(payload).filter(([, value]) => value !== null)
    );

    if (!Object.keys(sanitized).length) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/profile/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sanitized),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        setStatus(normalizeErrorDetail(errorBody.detail ?? errorBody));
      }
    } catch (error) {
      setStatus(`Profile update failed: ${String(error)}`);
    }
  }

  async function fillProfileFromGoogle(token: string, metadata: Record<string, unknown>) {
    const displayNameValue =
      (metadata.full_name as string | undefined) ||
      (metadata.name as string | undefined) ||
      null;
    const avatarValue = (metadata.avatar_url as string | undefined) || null;

    await updateProfile(token, {
      display_name: displayNameValue,
      avatar_url: avatarValue,
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <a
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            <span aria-hidden="true">←</span>
            Back
          </a>
          <div className="text-xs text-slate-400">Auth Portal</div>
        </div>

        <main className="space-y-5 rounded-xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-xl shadow-black/30">
          <div className="flex gap-3 rounded-full border border-slate-800 bg-slate-950/60 p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full px-3 py-2 text-sm ${
                mode === "login"
                  ? "bg-emerald-500 text-slate-950"
                  : "text-slate-300"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 rounded-full px-3 py-2 text-sm ${
                mode === "register"
                  ? "bg-amber-500 text-slate-950"
                  : "text-slate-300"
              }`}
            >
              Register
            </button>
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            {mode === "login" ? "Welcome back" : "Create your profile"}
          </h1>
          <p className="text-sm text-slate-300">
            {mode === "login"
              ? "Access your profile, rate movies, and manage your watchlist."
              : "Pick a display name and start your cinematic archive."}
          </p>
          <p className="text-xs text-slate-500">API URL: {apiUrl} (proxied via Next.js)</p>

          <div className="space-y-3">
            <label className="block space-y-1 text-sm">
              <span>Email</span>
              <input
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>

            <label className="block space-y-1 text-sm">
              <span>Password</span>
              <input
                className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
              />
            </label>

            {mode === "register" ? (
              <>
                <label className="block space-y-1 text-sm">
                  <span>Display name</span>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Your public name"
                  />
                </label>

                <label className="block space-y-1 text-sm">
                  <span>Birth date</span>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                    type="date"
                    value={birthDate}
                    onChange={(event) => setBirthDate(event.target.value)}
                  />
                </label>

                <label className="block space-y-1 text-sm">
                  <span>Avatar URL (optional)</span>
                  <input
                    className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2"
                    type="text"
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    placeholder="https://"
                  />
                </label>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
              onClick={() => (mode === "login" ? loginUser() : registerUser())}
              disabled={isLoading}
            >
              {mode === "login" ? "Login" : "Register"}
            </button>
            <button
              className="rounded-md border border-slate-700 px-3 py-2 text-sm"
              onClick={signInWithGoogle}
              disabled={isLoading}
            >
              Sign in with Google
            </button>
          </div>

          <p className="text-sm">Status: {status}</p>
        </main>
      </div>
    </div>
  );
}
