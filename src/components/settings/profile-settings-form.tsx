"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

type ProfileSettingsFormProps = {
  email: string;
  initialValues: {
    name: string;
    dateOfBirth: string;
    gender: string;
    phone: string;
  };
};

export default function ProfileSettingsForm({
  email,
  initialValues,
}: ProfileSettingsFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialValues.name);
  const [dateOfBirth, setDateOfBirth] = useState(
    initialValues.dateOfBirth,
  );
  const [gender, setGender] = useState(initialValues.gender);
  const [phone, setPhone] = useState(initialValues.phone);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setIsSaving(true);

    try {
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
        setError(data.error ?? "Unable to save profile");
        return;
      }

      setSuccess("Profile saved successfully.");
      router.refresh();
    } catch {
      setError("Unable to save profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section>
      <div className="border-b border-slate-200 pb-5">
        <h2 className="text-xl font-semibold text-slate-950">
          Personal profile
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Keep the details used across your family health vault accurate.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="profile-email"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Email address
          </label>
          <input
            id="profile-email"
            type="email"
            value={email}
            disabled
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            Your email is the identity used to sign in and cannot be
            changed here.
          </p>
        </div>

        <div>
          <label
            htmlFor="profile-name"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Full name
          </label>
          <input
            id="profile-name"
            required
            minLength={2}
            maxLength={100}
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="profile-date-of-birth"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Date of birth
            </label>
            <input
              id="profile-date-of-birth"
              type="date"
              value={dateOfBirth}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setDateOfBirth(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <div>
            <label
              htmlFor="profile-gender"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Gender
            </label>
            <select
              id="profile-gender"
              value={gender}
              onChange={(event) => setGender(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="NON_BINARY">Non-binary</option>
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="profile-phone"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Phone number
          </label>
          <input
            id="profile-phone"
            type="tel"
            maxLength={20}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            autoComplete="tel"
            placeholder="+91 98765 43210"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"
          >
            <CheckCircle2 size={17} aria-hidden="true" />
            {success}
          </p>
        )}

        <div className="flex justify-end border-t border-slate-200 pt-5">
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </section>
  );
}
