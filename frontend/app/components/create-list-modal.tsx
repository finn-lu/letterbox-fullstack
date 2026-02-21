"use client";

import { FormEvent, useState } from "react";

const apiUrl = "/api";
const tokenStorageKey = "letterbox_access_token";

type CustomList = {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  is_public: boolean;
  sort_mode: "manual" | "recently_added" | "rating_desc";
  created_at: string;
  updated_at: string;
};

type CreateListModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (list: CustomList) => void;
};

export default function CreateListModal({ isOpen, onClose, onCreated }: CreateListModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [sortMode, setSortMode] = useState<"manual" | "recently_added" | "rating_desc">("manual");
  const [status, setStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setStatus(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setStatus("Please enter a list name.");
      return;
    }

    const token = localStorage.getItem(tokenStorageKey);
    if (!token) {
      setStatus("Please log in first.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${apiUrl}/movies/lists`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          description: description.trim() || null,
          is_public: isPublic,
          sort_mode: sortMode,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setStatus(data.detail || data.error || "Failed to create list.");
        return;
      }

      onCreated(data as CustomList);
      setName("");
      setDescription("");
      setIsPublic(false);
      setSortMode("manual");
      setStatus(null);
      onClose();
    } catch (error) {
      setStatus(`Create failed: ${String(error)}`);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Create list</h2>
            <button
              onClick={onClose}
              className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:border-slate-500"
              type="button"
            >
              Close
            </button>
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Name</label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Weekend picks"
                maxLength={80}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Description</label>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Optional note about this list"
                maxLength={300}
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-amber-400"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-500">Sort</label>
                <select
                  value={sortMode}
                  onChange={(event) => setSortMode(event.target.value as "manual" | "recently_added" | "rating_desc")}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-amber-400"
                >
                  <option value="manual">Manual</option>
                  <option value="recently_added">Recently added</option>
                  <option value="rating_desc">Rating high to low</option>
                </select>
              </div>

              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(event) => setIsPublic(event.target.checked)}
                  />
                  Public list
                </label>
              </div>
            </div>

            {status ? <p className="text-xs text-slate-400">{status}</p> : null}

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-400 disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save list"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
