"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SigninPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setIsSubmitting(true);

    try {
      // [Signin UI → Auth.js]
      // Authentication is handled by the Credentials provider
      // configured in src/auth.ts.
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        setError("Invalid email or password.");
        return;
      }

      // [Signin → Profile Status API]
      // The server checks the authenticated user's profile.
      const response = await fetch("/api/profile/status");

      if (!response.ok) {
        setError("Unable to check your profile.");
        return;
      }

      const data = await response.json();

      // [Profile exists → Dashboard]
      if (data.complete) {
        router.push("/home");
        return;
      }

      // [Profile missing → Onboarding]
      router.push("/onboarding/profile");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12 text-slate-950">
      <div className="w-full max-w-md">

        {/* [Signin UI → Application Identity] */}
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">
            Family Health Vault
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            Welcome back
          </h1>

          <p className="mt-2 text-slate-600">
            Sign in to access your family health vault.
          </p>
        </div>

        {/* [Signin UI → Auth.js] */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
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
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
          />

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
            autoComplete="current-password"
            placeholder="Enter your password"
            required
            disabled={isSubmitting}
            className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100"
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
          disabled={isSubmitting || !email.trim() || !password}
          className="mt-6 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50" aria-busy={isSubmitting}>{isSubmitting ? "Signing in..." : "Sign in"}</button>

          <p className="mt-5 text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-semibold text-teal-700 hover:text-teal-800"
            >
              Create account
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}