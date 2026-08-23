"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  // [Signup UI → Signup API]
  // Local state manages only form values and UI feedback.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      // [Signup UI → /api/auth/signup]
      // The server handles validation, hashing, and user creation.
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      // [Signup API → Signup UI]
      // Show only the safe error returned by the API.
      if (!response.ok) {
        setError(data.error ?? "Unable to create account.");
        return;
      }

      // [Signup → Auth.js]
      // After account creation, send the user to the existing
      // Auth.js sign-in screen.
      router.push("/api/auth/signin");
    } catch {
      // [Network → Signup UI]
      // Handle unexpected request failures.
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    // [Signup UI]
    // Explicit background/text classes prevent global dark styling
    // from making the signup content unreadable.
    <main className="min-h-[calc(100vh-73px)] bg-slate-50 px-6 py-12 text-slate-950">
      <div className="mx-auto flex min-h-[calc(100vh-169px)] max-w-md items-center justify-center">
        <div className="w-full">
          {/* [Signup UI → Header] */}
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
              Family Health Vault
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
              Create your account
            </h1>

            <p className="mt-2 text-slate-600">
              Create an account to start managing your family health vault.
            </p>
          </div>

          {/* [Signup UI → Signup API]
              This form submits to the existing /api/auth/signup route. */}
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            {/* [Signup Form → Email] */}
            <label
              htmlFor="email"
              className="block text-sm font-medium text-slate-900"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="you@example.com"
              required
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
            />

            {/* [Signup Form → Password] */}
            <label
              htmlFor="password"
              className="mt-5 block text-sm font-medium text-slate-900"
            >
              Password
            </label>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              placeholder="Enter your password"
              required
              disabled={isSubmitting}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
            />

            {/* [Signup API → Error UI] */}
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
              >
                {error}
              </p>
            )}

            {/* [Signup Form → Submit] */}
            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !password}
              className="mt-6 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>

            {/* [Signup → Existing Auth.js Sign-in]
                Existing users can move to the sign-in flow. */}
            <p className="mt-5 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/api/auth/signin"
                className="font-semibold text-teal-700 hover:text-teal-800"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}