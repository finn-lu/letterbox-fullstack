"use client";

import { useState, useEffect } from "react";

type Profile = {
  id: string;
  user_id: string;
  display_name?: string;
  birth_date?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

type ProfileEditModalProps = {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile | null;
  onProfileUpdated: (updatedProfile: Profile) => void;
};

const tokenStorageKey = "letterbox_access_token";

export default function ProfileEditModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: ProfileEditModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill form when modal opens or profile changes
  useEffect(() => {
    if (isOpen && profile) {
      setDisplayName(profile.display_name || "");
      setBirthDate(profile.birth_date || "");
      setAvatarUrl(profile.avatar_url || "");
      setError(null);
    }
  }, [isOpen, profile]);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const token = localStorage.getItem(tokenStorageKey);
    if (!token) {
      setError("No access token found. Please log in.");
      setIsSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/profile/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: displayName || null,
          birth_date: birthDate || null,
          avatar_url: avatarUrl || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to update profile");
        setIsSaving(false);
        return;
      }

      const updatedProfile = await response.json();
      onProfileUpdated(updatedProfile);
      onClose();
    } catch (err) {
      setError(`Network error: ${String(err)}`);
    } finally {
      setIsSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Edit Profile</h2>

        {error && (
          <div className="bg-red-900 border border-red-700 rounded p-3 mb-4">
            <p className="text-red-100 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={saveProfile} className="space-y-5">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              maxLength={255}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              {displayName.length}/255 characters
            </p>
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Birth Date
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Format: YYYY-MM-DD
            </p>
          </div>

          {/* Avatar URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Avatar URL
            </label>
            <input
              type="text"
              maxLength={2048}
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
            />
            <p className="text-xs text-slate-500 mt-1">
              {avatarUrl.length}/2048 characters
            </p>
            {avatarUrl && (
              <div className="mt-3 border border-slate-600 rounded p-2 bg-slate-900">
                <p className="text-xs text-slate-400 mb-2">Preview:</p>
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-20 h-20 rounded object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white font-medium rounded transition"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}   
    
    