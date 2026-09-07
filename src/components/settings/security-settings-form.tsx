"use client";

import { FormEvent, useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function SecuritySettingsForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Unable to change password");
        return;
      }

      // Clear the current browser session so the new password is verified
      // immediately on the next sign-in.
      await signOut({ callbackUrl: "/signin" });
    } catch {
      setError("Unable to change password. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-8">
      <div>
        <div className="border-b border-slate-200 pb-5">
          <h2 className="text-xl font-semibold text-slate-950">
            Password
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Changing your password signs this browser out immediately.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="current-password"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Current password
            </label>
            <input
              id="current-password"
              type="password"
              required
              maxLength={72}
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="new-password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                New password
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Confirm new password
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex justify-end border-t border-slate-200 pt-5">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Changing..." : "Change password"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900">Current session</h3>
        <p className="mt-1 text-sm text-slate-500">
          Sign out of this browser when using a shared device.
        </p>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          <LogOut size={17} aria-hidden="true" />
          Sign out
        </button>
      </div>
    </section>
  );
}
