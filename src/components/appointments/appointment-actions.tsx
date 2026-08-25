"use client";

import { useState } from "react";

type AppointmentActionsProps = {
  appointmentId: string;
};

export default function AppointmentActions({
  appointmentId,
}: AppointmentActionsProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function markVisited() {
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}`,
        {
          method: "PATCH",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to mark appointment as visited");
      }

      // Refresh the Server Component so the appointment
      // disappears from the upcoming list.
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to mark appointment as visited.");
      setIsLoading(false);
    }
  }

  async function deleteAppointment() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this appointment?",
    );

    if (!confirmed) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/appointments/${appointmentId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete appointment");
      }

      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Failed to delete appointment.");
      setIsLoading(false);
    }
  }

  return (
    <div className="mt-4 flex gap-2">
      <button
        type="button"
        onClick={markVisited}
        disabled={isLoading}
        className="rounded-lg bg-teal-50 px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50"
      >
        Mark Visited
      </button>

      <button
        type="button"
        onClick={deleteAppointment}
        disabled={isLoading}
        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}