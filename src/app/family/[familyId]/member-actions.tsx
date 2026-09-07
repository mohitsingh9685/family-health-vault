"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type MemberActionsProps = {
  familyId: string;
  memberId: string;
  memberLabel: string;
  isOwner: boolean;
  isCurrentUser: boolean;
  memberRole: "OWNER" | "MEMBER";
};

export function MemberActions({
  familyId,
  memberId,
  memberLabel,
  isOwner,
  isCurrentUser,
  memberRole,
}: MemberActionsProps) {
  const router = useRouter();
  const [isTransferring, setIsTransferring] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [error, setError] = useState("");

  // [Family Settings → Ownership API]
  // Only the current owner sees this action; the API independently
  // verifies ownership and the target membership.
  async function transferOwnership() {
    const confirmed = window.confirm(
      `Transfer ownership to ${memberLabel}? You will become a regular member.`,
    );

    if (!confirmed) return;

    setError("");
    setIsTransferring(true);

    try {
      const response = await fetch(
        `/api/families/${familyId}/ownership`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ memberId }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to transfer ownership.");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsTransferring(false);
    }
  }

  // [Family Dashboard → Remove Member API]
  // OWNER can remove another MEMBER from this family.
  async function removeMember() {
    const confirmed = window.confirm(
      "Are you sure you want to remove this family member?"
    );

    if (!confirmed) return;

    setError("");
    setIsRemoving(true);

    try {
      const response = await fetch(
        `/api/families/${familyId}/members/${memberId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to remove member.");
        return;
      }

      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsRemoving(false);
    }
  }

  // [Family Dashboard → Leave Family API]
  // A MEMBER can leave the current family.
  async function leaveFamily() {
    const confirmed = window.confirm(
      "Are you sure you want to leave this family?"
    );

    if (!confirmed) return;

    setError("");
    setIsLeaving(true);

    try {
      const response = await fetch(
        `/api/families/${familyId}/membership`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Failed to leave family.");
        return;
      }

      // [Leave Family API → Family List]
      // The user no longer belongs to this family.
      router.push("/family");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLeaving(false);
    }
  }

  // [Authorization → Family Dashboard]
  // OWNER can remove MEMBERs, but cannot remove themselves
  // or another OWNER.
  if (
    isOwner &&
    !isCurrentUser &&
    memberRole === "MEMBER"
  ) {
    return (
      <div className="ml-4">
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={transferOwnership}
            disabled={isTransferring || isRemoving}
            className="rounded-lg border border-teal-200 px-3 py-2 text-xs font-medium text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isTransferring ? "Transferring..." : "Transfer ownership"}
          </button>

          <button
            type="button"
            onClick={removeMember}
            disabled={isRemoving || isTransferring}
            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRemoving ? "Removing..." : "Remove"}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-right text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  // [Authorization → Family Dashboard]
  // MEMBER can leave their current family.
  if (
    isCurrentUser &&
    memberRole === "MEMBER"
  ) {
    return (
      <div className="ml-4">
        <button
          type="button"
          onClick={leaveFamily}
          disabled={isLeaving}
          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLeaving ? "Leaving..." : "Leave"}
        </button>

        {error && (
          <p className="mt-2 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  return null;
}