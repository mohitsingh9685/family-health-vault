"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type AccountSettingsProps = {
  email: string;
  memberSince: string;
  ownedFamilies: Array<{
    id: string;
    name: string;
  }>;
};

export default function AccountSettings({
  email,
  memberSince,
  ownedFamilies,
}: AccountSettingsProps) {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const ownsFamily = ownedFamilies.length > 0;

  async function deleteAccount() {
    if (confirmation !== "DELETE" || ownsFamily) {
      return;
    }

    setError("");
    setIsDeleting(true);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to delete account");
        return;
      }

      await signOut({ callbackUrl: "/" });
    } catch {
      setError("Unable to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <div className="border-b border-slate-200 pb-5">
          <h2 className="text-xl font-semibold text-slate-950">
            Account information
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Basic information associated with your account.
          </p>
        </div>

        <dl className="mt-6 divide-y divide-slate-200 rounded-xl border border-slate-200">
          <div className="grid gap-1 px-5 py-4 sm:grid-cols-3">
            <dt className="text-sm font-medium text-slate-500">Email</dt>
            <dd className="break-all text-sm text-slate-900 sm:col-span-2">
              {email}
            </dd>
          </div>
          <div className="grid gap-1 px-5 py-4 sm:grid-cols-3">
            <dt className="text-sm font-medium text-slate-500">
              Member since
            </dt>
            <dd className="text-sm text-slate-900 sm:col-span-2">
              {memberSince}
            </dd>
          </div>
        </dl>
      </div>

      <div className="rounded-xl border border-red-200 bg-red-50/40 p-5">
        <h3 className="font-semibold text-red-800">Delete account</h3>
        <p className="mt-2 text-sm text-red-700">
          This permanently removes your account and database records. This
          action cannot be undone.
        </p>

        {ownsFamily ? (
          <div className="mt-4 rounded-lg bg-white p-4 text-sm text-slate-700">
            You own {ownedFamilies.length}{" "}
            {ownedFamilies.length === 1 ? "family" : "families"}. Transfer
            ownership or delete those families before deleting your account.
            <div className="mt-3 space-y-2">
              {ownedFamilies.map((family) => (
                <Link
                  key={family.id}
                  href={`/family/${family.id}`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 font-semibold text-teal-700 transition hover:bg-teal-50"
                >
                  <span className="truncate">{family.name}</span>
                  <span className="ml-3 shrink-0">Manage →</span>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-5">
            <label
              htmlFor="delete-confirmation"
              className="mb-2 block text-sm font-medium text-red-800"
            >
              Type DELETE to confirm
            </label>
            <input
              id="delete-confirmation"
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              autoComplete="off"
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-3 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
            />

            {error && (
              <p role="alert" className="mt-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={deleteAccount}
              disabled={confirmation !== "DELETE" || isDeleting}
              className="mt-4 rounded-xl bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "Deleting..." : "Delete account permanently"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
