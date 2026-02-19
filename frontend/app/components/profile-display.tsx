"use client";

type Profile = {
  id: string;
  user_id: string;
  display_name?: string;
  birth_date?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
};

type ProfileDisplayProps = {
  profile: Profile | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onEditClick: () => void;
};

export default function ProfileDisplay({
  profile,
  isLoading,
  error,
  onRetry,
  onEditClick,
}: ProfileDisplayProps) {
  function formatDate(dateString?: string): string {
    if (!dateString) return "Not set";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  if (isLoading) {
    return (
      <div className="bg-slate-900 rounded-2xl p-10 text-center border border-slate-800">
        <p className="text-slate-300">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950 rounded-2xl p-10 text-center border border-red-900">
        <p className="text-red-100">Error: {error}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-full transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-slate-900 rounded-2xl p-10 text-center border border-slate-800">
        <p className="text-slate-300">No profile data found.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-8 border border-slate-800 shadow-xl shadow-black/30">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">
            Profile
          </p>
          <h2 className="mt-3 text-3xl font-semibold text-slate-100">
            {profile.display_name || "Unnamed User"}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Member since {formatDate(profile.created_at)}
          </p>
        </div>

        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="w-20 h-20 rounded-2xl object-cover border border-slate-700"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-amber-400 flex items-center justify-center">
            <span className="text-slate-950 text-3xl font-bold">
              {profile.display_name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-slate-950/70 p-4">
          <p className="text-xs text-slate-400">Display name</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">
            {profile.display_name || "Not set"}
          </p>
        </div>
        <div className="rounded-2xl bg-slate-950/70 p-4">
          <p className="text-xs text-slate-400">Birth date</p>
          <p className="mt-2 text-lg font-semibold text-slate-100">
            {formatDate(profile.birth_date)}
          </p>
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        Last updated {formatDate(profile.updated_at)}
      </div>

      <button
        onClick={onEditClick}
        className="w-full mt-6 px-4 py-3 rounded-full bg-emerald-400 text-slate-950 font-semibold hover:bg-emerald-300 transition"
      >
        Edit Profile
      </button>
    </div>
  );
}
