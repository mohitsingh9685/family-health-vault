"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinFamilyPage() {
  const router = useRouter();

  // [Join Family UI]
  // Stores the invitation code and temporary request state.
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsJoining(true);

    try {
      // [Join Family UI → Invitation API]
      // The server finds the family from the invitation code.
      const response = await fetch(
        "/api/families/invitations/accept",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            code: code.trim().toUpperCase(),
          }),
        }
      );

      const data = await response.json();

      // [Invitation API → Join Family UI]
      // Display only the safe error returned by the server.
      if (!response.ok) {
        setError(data.error ?? "Failed to join family.");
        return;
      }

      // [Invitation API → Family Dashboard]
      // The response contains the familyId created by the membership.
      router.push(`/home?familyId=${data.familyId}`);
    } catch {
      // [Network → Join Family UI]
      // Handle unexpected network failures.
      setError("Something went wrong. Please try again.");
    } finally {
      setIsJoining(false);
    }
  }

  return (
    // [Join Family UI]
    // Explicit light colors prevent global CSS from hiding content.
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto max-w-md">
        {/* [Join Family → Header] */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Join a family
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            Enter your invitation code
          </h1>

          <p className="mt-2 text-slate-600">
            Ask the family owner for the invitation code and enter it
            below.
          </p>
        </div>

        {/* [Join Family → Invitation API]
            Submit the code to the server for validation. */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <label
            htmlFor="invitation-code"
            className="block text-sm font-medium text-slate-900"
          >
            Invitation code
          </label>

          <input
            id="invitation-code"
            name="code"
            type="text"
            value={code}
            onChange={(event) =>
              setCode(event.target.value.toUpperCase())
            }
            placeholder="e.g. A7F29C81D4B2"
            autoComplete="off"
            maxLength={20}
            required
            disabled={isJoining}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 font-mono text-slate-950 placeholder:text-slate-400 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
          />

          {/* [Invitation API → Error UI] */}
          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
            >
              {error}
            </p>
          )}

          <button type="submit"
          disabled={isJoining || !code.trim()}
          className="mt-6 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50" aria-busy={isJoining}>{isJoining ? "Joining..." : "Join family"}</button>
        </form>
      </div>
    </main>
  );
}