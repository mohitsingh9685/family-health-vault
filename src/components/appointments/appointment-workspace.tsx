"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import AppointmentActions from "@/components/appointments/appointment-actions";
import AppointmentForm from "@/components/appointments/appointment-form";

type FamilyOption = {
  id: string;
  name: string;
};

type PatientOption = {
  id: string;
  name: string;
};

type AppointmentItem = {
  id: string;
  hospitalName: string;
  hospitalAddress: string | null;
  doctorName: string | null;
  status: "UPCOMING" | "VISITED";
  timestamp: string;
  dateLabel: string;
  timeLabel: string;
  patient: PatientOption;
};

type AppointmentWorkspaceProps = {
  familyId: string;
  familyName: string;
  currentUserId: string;
  currentUserName: string;
  families: FamilyOption[];
  familyMembers: PatientOption[];
  appointments: AppointmentItem[];
};

export default function AppointmentWorkspace({
  familyId,
  familyName,
  currentUserId,
  currentUserName,
  families,
  familyMembers,
  appointments,
}: AppointmentWorkspaceProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortOrder, setSortOrder] = useState<"soonest" | "latest">("soonest");
  const [message, setMessage] = useState("");

  const upcomingCount = appointments.filter(
    (appointment) => appointment.status === "UPCOMING",
  ).length;
  const visitedCount = appointments.filter(
    (appointment) => appointment.status === "VISITED",
  ).length;

  const visibleAppointments = appointments
    .filter(
      (appointment) =>
        (selectedPatient === "all" ||
          appointment.patient.id === selectedPatient) &&
        (selectedStatus === "all" || appointment.status === selectedStatus),
    )
    .sort((left, right) => {
      const difference =
        new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
      return sortOrder === "soonest" ? difference : -difference;
    });

  function appointmentCreated() {
    setShowForm(false);
    setMessage("Appointment added successfully.");
    router.refresh();
  }

  return (
    <div className="min-w-0 flex-1">
      <header className="border-b border-slate-200 bg-white px-5 py-6 sm:px-7 lg:px-9">
        <div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              {familyName}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              Appointments
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Schedule and review healthcare visits for your family.
            </p>
          </div>

          <label className="min-w-56 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Switch family
            <select
              value={familyId}
              onChange={(event) =>
                router.push(
                  `/appointments?familyId=${encodeURIComponent(event.target.value)}`,
                )
              }
              className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold normal-case tracking-normal text-slate-800 outline-none focus:border-teal-600"
            >
              {families.map((family) => (
                <option key={family.id} value={family.id}>
                  {family.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <nav
        aria-label="Dashboard navigation"
        className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden"
      >
        <Link
          href={`/home?familyId=${encodeURIComponent(familyId)}`}
          className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
        >
          Overview
        </Link>
        <Link
          href={`/family/${familyId}`}
          className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
        >
          Family
        </Link>
        <Link
          href={`/medical-record?familyId=${encodeURIComponent(familyId)}`}
          className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
        >
          Records
        </Link>
        <Link
          href={`/appointments?familyId=${encodeURIComponent(familyId)}`}
          className="whitespace-nowrap rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700"
        >
          Appointments
        </Link>
        <Link
          href={`/health-trends?familyId=${encodeURIComponent(familyId)}&range=30`}
          className="whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold text-slate-600"
        >
          Trends
        </Link>
      </nav>

      <div className="mx-auto max-w-[1480px] px-4 py-6 sm:px-6 lg:px-7">
        {message && (
          <div className="mb-5 rounded-xl border border-teal-200 bg-teal-50 px-5 py-4 text-sm font-medium text-teal-800">
            {message}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setMessage("");
            setShowForm((current) => !current);
          }}
          className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left shadow-sm transition ${
            showForm
              ? "border-teal-600 bg-teal-50"
              : "border-slate-200 bg-white hover:border-teal-300"
          }`}
        >
          <span className="rounded-xl bg-teal-100 p-3 text-teal-700">
            <Plus size={22} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold text-slate-950">
              Create Appointment
            </span>
            <span className="mt-1 block text-sm text-slate-500">
              Schedule a doctor, clinic, or hospital visit for a family member.
            </span>
          </span>
          <span className="text-xl text-slate-400" aria-hidden="true">
            {showForm ? "−" : "+"}
          </span>
        </button>

        {showForm && (
          <section className="mt-5 rounded-2xl border border-teal-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Appointment details
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Times are saved using your browser&apos;s current timezone.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close appointment form"
              >
                <X size={18} />
              </button>
            </div>
            <AppointmentForm
              familyId={familyId}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
              familyMembers={familyMembers}
              onCreated={appointmentCreated}
            />
          </section>
        )}

        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <CalendarDays className="text-teal-700" size={20} aria-hidden="true" />
            <p className="mt-3 text-2xl font-bold text-slate-950">{upcomingCount}</p>
            <p className="text-sm text-slate-500">Upcoming</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <CalendarCheck className="text-slate-700" size={20} aria-hidden="true" />
            <p className="mt-3 text-2xl font-bold text-slate-950">{visitedCount}</p>
            <p className="text-sm text-slate-500">Visited</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Users className="text-sky-700" size={20} aria-hidden="true" />
            <p className="mt-3 text-2xl font-bold text-slate-950">
              {familyMembers.length}
            </p>
            <p className="text-sm text-slate-500">Family members</p>
          </article>
        </section>

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Family appointments
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Upcoming visits and completed appointment history.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {visibleAppointments.length} shown
              </span>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Patient
                <select
                  value={selectedPatient}
                  onChange={(event) => setSelectedPatient(event.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-teal-600"
                >
                  <option value="all">All family members</option>
                  {familyMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Status
                <select
                  value={selectedStatus}
                  onChange={(event) => setSelectedStatus(event.target.value)}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-teal-600"
                >
                  <option value="all">All statuses</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="VISITED">Visited</option>
                </select>
              </label>

              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Order
                <select
                  value={sortOrder}
                  onChange={(event) =>
                    setSortOrder(event.target.value as "soonest" | "latest")
                  }
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-teal-600"
                >
                  <option value="soonest">Earliest first</option>
                  <option value="latest">Latest first</option>
                </select>
              </label>
            </div>
          </div>

          {visibleAppointments.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarDays className="mx-auto text-slate-300" size={32} />
              <p className="mt-3 font-medium text-slate-700">
                No matching appointments
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Change the filters or add a family appointment.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visibleAppointments.map((appointment) => (
                <article key={appointment.id} className="p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-teal-50 text-teal-800">
                        <CalendarDays size={18} aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-950">
                            {appointment.hospitalName}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              appointment.status === "VISITED"
                                ? "bg-slate-100 text-slate-600"
                                : "bg-teal-50 text-teal-700"
                            }`}
                          >
                            {appointment.status === "VISITED"
                              ? "Visited"
                              : "Upcoming"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-600">
                          {appointment.patient.name}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-teal-700">
                            <Clock3 size={14} aria-hidden="true" />
                            {appointment.dateLabel} · {appointment.timeLabel}
                          </span>
                          {appointment.doctorName && (
                            <span className="inline-flex items-center gap-1.5">
                              <Stethoscope size={14} aria-hidden="true" />
                              {appointment.doctorName}
                            </span>
                          )}
                          {appointment.hospitalAddress && (
                            <span className="inline-flex items-center gap-1.5">
                              <MapPin size={14} aria-hidden="true" />
                              {appointment.hospitalAddress}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {appointment.status === "UPCOMING" && (
                      <AppointmentActions appointmentId={appointment.id} />
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
