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

const apiUrl = "/api";
const tokenStorageKey = "letterbox_access_token";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadProfile();
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

  async function handleLogout() {
    await supabase.auth.signOut();
    localStorage.removeItem(tokenStorageKey);
    router.push("/");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
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

        <ProfileDisplay
          profile={profile}
          isLoading={isLoading}
          error={error}
          onRetry={loadProfile}
          onEditClick={() => setShowEditModal(true)}
        />

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
