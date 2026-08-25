"use client";

import { FormEvent, useState } from "react";

type AppointmentPatient = {
  id: string;
  name: string;
};

type AppointmentFormProps = {
  // [Home/Family → Appointment Form]
  // Family members are provided by the server component.
  familyMembers: AppointmentPatient[];

  // Current logged-in user is always available as a patient option.
  currentUserId: string;
  currentUserName: string;
};

export default function AppointmentForm({
  familyMembers,
  currentUserId,
  currentUserName,
}: AppointmentFormProps) {
  // ------------------------------------------------------------
  // [Appointment Form → Local Form State]
  //
  // These values will later be sent to:
  // POST /api/appointments
  // ------------------------------------------------------------
  const [hospitalName, setHospitalName] = useState("");
  const [patientId, setPatientId] = useState(currentUserId);
  const [hospitalAddress, setHospitalAddress] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(
  event: FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  setIsSubmitting(true);

  try {
    // [Appointment Form → API]
    // Send validated form data to the server.
    const response = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        hospitalName,
        patientId,
        hospitalAddress,
        doctorName,
        appointmentDate,
        appointmentTime,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to create appointment",
      );
    }

    // Clear the form after successful creation.
    setHospitalName("");
    setPatientId(currentUserId);
    setHospitalAddress("");
    setDoctorName("");
    setAppointmentDate("");
    setAppointmentTime("");

    alert("Appointment added successfully.");
  } catch (error) {
    console.error(
      "Appointment creation failed:",
      error,
    );

    alert(
      error instanceof Error
        ? error.message
        : "Failed to create appointment",
    );
  } finally {
    setIsSubmitting(false);
  }
}

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* [Appointment → Hospital/Clinic] */}
      <div>
        <label
          htmlFor="hospitalName"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Hospital / Clinic Name
        </label>

        <input
          id="hospitalName"
          type="text"
          value={hospitalName}
          onChange={(event) =>
            setHospitalName(event.target.value)
          }
          placeholder="e.g. AIIMS Delhi"
          required
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      </div>

      {/* [Appointment → Patient] */}
      <div>
        <label
          htmlFor="patientId"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Patient
        </label>

        <select
          id="patientId"
          value={patientId}
          onChange={(event) =>
            setPatientId(event.target.value)
          }
          required
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        >
          {/* Current user is explicitly marked as Self. */}
          <option value={currentUserId}>
            {currentUserName} (Self)
          </option>

          {/* Other members of the selected family. */}
          {familyMembers
            .filter((member) => member.id !== currentUserId)
            .map((member) => (
              <option
                key={member.id}
                value={member.id}
              >
                {member.name}
              </option>
            ))}
        </select>
      </div>

      {/* [Appointment → Hospital Address] */}
      <div>
        <label
          htmlFor="hospitalAddress"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Hospital Address
        </label>

        <textarea
          id="hospitalAddress"
          value={hospitalAddress}
          onChange={(event) =>
            setHospitalAddress(event.target.value)
          }
          placeholder="Enter hospital or clinic address"
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      </div>

      {/* [Appointment → Doctor] */}
      <div>
        <label
          htmlFor="doctorName"
          className="mb-2 block text-sm font-medium text-slate-700"
        >
          Doctor Name
        </label>

        <input
          id="doctorName"
          type="text"
          value={doctorName}
          onChange={(event) =>
            setDoctorName(event.target.value)
          }
          placeholder="e.g. Dr. Sharma"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
        />
      </div>

      {/* [Appointment → Date and Time] */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label
            htmlFor="appointmentDate"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Date
          </label>

          <input
            id="appointmentDate"
            type="date"
            value={appointmentDate}
            onChange={(event) =>
              setAppointmentDate(event.target.value)
            }
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>

        <div>
          <label
            htmlFor="appointmentTime"
            className="mb-2 block text-sm font-medium text-slate-700"
          >
            Time
          </label>

          <input
            id="appointmentTime"
            type="time"
            value={appointmentTime}
            onChange={(event) =>
              setAppointmentTime(event.target.value)
            }
            required
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
          />
        </div>
      </div>

      {/* [Appointment Form → API]
          This button will eventually submit to
          POST /api/appointments. */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Add Appointment"}
      </button>
    </form>
  );
}