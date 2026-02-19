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
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <p className="text-slate-300">Loading profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 rounded-lg p-8 text-center">
        <p className="text-red-100">Error: {error}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded transition"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-slate-800 rounded-lg p-8 text-center">
        <p className="text-slate-300">No profile data found.</p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg p-8 max-w-md mx-auto">
      <div className="flex justify-center mb-6">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border-4 border-blue-500"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-blue-500">
            <span className="text-white text-3xl font-bold">
              {profile.display_name?.[0]?.toUpperCase() || "?"}
            </span>
          </div>
        )}
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {profile.display_name || "Unnamed User"}
        </h2>

        <div className="space-y-3 mt-6 text-left bg-slate-700 rounded p-4">
          <div>
            <p className="text-sm text-slate-400">Display Name</p>
            <p className="text-white font-medium">
              {profile.display_name || "Not set"}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-400">Birth Date</p>
            <p className="text-white font-medium">
              {formatDate(profile.birth_date)}
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-400">Avatar URL</p>
            <p className="text-white font-medium text-xs break-all">
              {profile.avatar_url || "Not set"}
            </p>
          </div>

          <div className="text-xs text-slate-500 pt-2 border-t border-slate-600">
            <p>Created: {formatDate(profile.created_at)}</p>
            <p>Updated: {formatDate(profile.updated_at)}</p>
          </div>
        </div>
      </div>

      <button
        onClick={onEditClick}
        className="w-full mt-6 px-4 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold rounded-lg transition duration-200"
      >
        Edit Profile
      </button>
    </div>
  );
}
