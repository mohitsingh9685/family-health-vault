"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";



export default function StartFamilyPage() {
  const router = useRouter();

  const [familyName, setFamilyName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      // [Create Family UI → Family API]
      // The server authenticates the user and validates the family name.
      const response = await fetch("/api/families", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: familyName.trim(),
        }),
      });

      const data = await response.json();

      // [Family API → Create Family UI]
      if (!response.ok) {
        setError(data.error ?? "Unable to create family.");
        return;
      }

      // [Family API → Family Page]
      // The API returns the newly created family's ID.
      router.push(`/home?familyId=${data.familyId}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-[calc(100vh-65px)] bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-3xl">

        {/* [Page Navigation]
            Returns the user to the previous onboarding page. */}
       

        {/* [Create Family → Header] */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Start a family
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Create your family health vault
          </h1>

          <p className="mt-3 text-slate-600">
            Give your family vault a name. You can invite family members
            after creating it.
          </p>
        </div>

        {/* [Create Family UI → API] */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <label
            htmlFor="familyName"
            className="block text-sm font-medium text-slate-900"
          >
            Family name
          </label>

          <input
            id="familyName"
            type="text"
            value={familyName}
            onChange={(event) => setFamilyName(event.target.value)}
            placeholder="e.g. Singh Family"
            required
            disabled={isSubmitting}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
          />

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            >
              {error}
            </p>
          )}

          <button type="submit"
          disabled={isSubmitting || !familyName.trim()}
          className="mt-6 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50" aria-busy={isSubmitting}>{isSubmitting ? "Creating family..." : "Create family"}</button>

          {/* [Create Family → Join Family]
              Users who already received an invitation can switch
              to the existing invitation-code flow. */}
          <p className="mt-5 text-center text-sm text-slate-600">
            Already have an invitation code?{" "}
            <Link
              href="/onboarding/join"
              className="font-semibold text-teal-700 hover:text-teal-800"
            >
              Join a family
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}