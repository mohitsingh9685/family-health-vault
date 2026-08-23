"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FamilySettingsProps = {
  familyId: string;
  familyName: string;
  isOwner: boolean;
};

export function FamilySettings({
  familyId,
  familyName,
  isOwner,
}: FamilySettingsProps) {
  const router = useRouter();

  const [name, setName] = useState(familyName);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOwner) {
    return null;
  }

  // [Family Settings → Family API]
  // OWNER can update the family name.
  async function updateFamily(event: React.FormEvent) {
    event.preventDefault();

    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(
        `/api/families/${familyId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to update family.");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  // [Family Settings → Family API]
  // OWNER can permanently delete the family.
  async function deleteFamily() {
    const confirmed = window.confirm(
      "Delete this family permanently? All family memberships and invitations will be removed."
    );

    if (!confirmed) return;

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch(
        `/api/families/${familyId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to delete family.");
        return;
      }

      router.push("/family");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* [Family Dashboard → Family Settings] */}
      <h2 className="text-xl font-semibold text-slate-950">
        Family Settings
      </h2>

      {/* [Family Settings → Rename Family] */}
      <form onSubmit={updateFamily} className="mt-5">
        <label
          htmlFor="family-name"
          className="block text-sm font-medium text-slate-900"
        >
          Family name
        </label>

        <div className="mt-2 flex gap-3">
          <input
            id="family-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={100}
            required
            disabled={isSaving || isDeleting}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 px-4 py-3 text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
          />

          <button
            type="submit"
            disabled={isSaving || isDeleting}
            className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      {/* [Family Settings → Delete Family] */}
      <div className="mt-8 border-t border-slate-200 pt-6">
        <h3 className="font-semibold text-red-700">
          Delete family
        </h3>

        <p className="mt-1 text-sm text-slate-600">
          Permanently removes this family, its memberships,
          and invitations.
        </p>

        <button
          type="button"
          onClick={deleteFamily}
          disabled={isDeleting || isSaving}
          className="mt-4 rounded-lg border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete family"}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 text-sm font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </section>
  );
}