"use client";

import { useState } from "react";

type InviteCodeProps = {
  familyId: string;
  isOwner: boolean;
};

export function InviteCode({
  familyId,
  isOwner,
}: InviteCodeProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // [Family Dashboard → Invitation API]
  // Generate a new invitation code for this family.
  async function generateCode() {
    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch(
        `/api/families/${familyId}/invitations`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      // [Invitation API → Family Dashboard]
      // Display only the newly generated code.
      if (!response.ok) {
        setError(data.error ?? "Failed to generate code.");
        return;
      }

      setCode(data.code);
    } catch {
      // [Network → Family Dashboard]
      setError("Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  // [Authorization → Family Dashboard]
  // Non-owners should not see the invitation controls.
  if (!isOwner) {
    return null;
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {/* [Family Dashboard → Invitation] */}
      <h2 className="text-xl font-semibold text-slate-950">
        Invite a family member
      </h2>

      <p className="mt-2 text-sm text-slate-600">
        Generate a code and share it with the person you want
        to invite.
      </p>

      <button
        type="button"
        onClick={generateCode}
        disabled={isGenerating}
        className="mt-5 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isGenerating ? "Generating..." : "Generate invitation code"}
      </button>

      {/* [Invitation API → Code Display]
          The raw code is shown only after successful generation. */}
      {code && (
        <div className="mt-5 rounded-lg bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Invitation code
          </p>

          <p className="mt-2 break-all font-mono text-xl font-bold tracking-widest text-slate-950">
            {code}
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Share this code with the family member. It expires
            after 7 days and can only be used once.
          </p>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 text-sm font-medium text-red-600"
        >
          {error}
        </p>
      )}
    </div>
  );
}