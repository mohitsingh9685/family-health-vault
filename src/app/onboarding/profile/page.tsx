"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileSetupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      // ----------------------------------------------------------
      // Frontend -> /api/profile -> PostgreSQL
      // The API performs the real authentication and validation.
      // ----------------------------------------------------------
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          dateOfBirth,
          gender,
          phone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to save profile");
        return;
      }

      // After profile setup, continue to family management.
      router.push("/family");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border bg-white p-8 shadow-sm">
        <div className="mb-8">
          <p className="text-sm font-semibold text-teal-700">
            PROFILE SETUP
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-950">
            Tell us about yourself
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            This information helps us personalise your family health
            vault.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full name is the only required profile field for now. */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Full name
            </label>

            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Mohit Singh"
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Date of birth
            </label>

            <input
              type="date"
              value={dateOfBirth}
              onChange={(event) =>
                setDateOfBirth(event.target.value)
              }
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-teal-600"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Gender
            </label>

            <select
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              className="w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-teal-600"
            >
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="NON_BINARY">Non-binary</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Phone number
            </label>

            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+91..."
              className="w-full rounded-xl border px-4 py-3 outline-none focus:border-teal-600"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}