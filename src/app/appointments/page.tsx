import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import AppointmentForm from "@/components/appointments/appointment-form";
import AppointmentActions from "@/components/appointments/appointment-actions";
import {
  formatAppointmentDate,
  formatAppointmentTime,
} from "@/lib/appointments";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    familyId?: string;
  }>;
}) {
  // [Auth.js → Appointments]
  // Only authenticated users can access appointments.
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const userId = session.user.id;

  // [Appointments → Selected Family]
  // The URL value is never trusted without matching membership.
  const { familyId } = await searchParams;

  const membership = await prisma.familyMember.findFirst({
    where: {
      userId,
      ...(familyId ? { familyId } : {}),
    },
    include: {
      family: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  if (!membership) {
    const firstMembership = await prisma.familyMember.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!firstMembership) {
      redirect("/onboarding");
    }

    redirect(`/appointments?familyId=${firstMembership.familyId}`);
  }

  // [Family → Appointment Form]
  // Only members of the user's family are offered as patients.
  const familyMembers = await prisma.familyMember.findMany({
    where: {
      familyId: membership.familyId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

// [Appointments → PostgreSQL]
// Fetch all non-deleted appointments for the appointment history page.
//
// IMPORTANT:
// Unlike the Home dashboard, this page must show both:
// - UPCOMING
// - VISITED
//
// Deleted appointments are permanently removed and therefore
// do not appear here.
const appointments =
  await prisma.appointment.findMany({
    where: {
      familyId: membership.familyId,
    },

    include: {
      patient: {
        select: {
          email: true,
          profile: {
            select: {
              name: true,
            },
          },
        },
      },
    },

    // [Appointments → Chronological History]
    // Show appointments from earliest to latest.
    orderBy: {
      appointmentDate: "asc",
    },
  });

  const currentUser =
    familyMembers.find(
      (member) => member.userId === userId,
    );

  const currentUserName =
    currentUser?.user.profile?.name ||
    currentUser?.user.email.split("@")[0] ||
    "User";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-5xl">

        {/* [Appointments → Page Header] */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-950">
            Appointments
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your family&apos;s healthcare appointments.
          </p>
        </div>

        {/* [Appointments → Create Appointment] */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">
            Add Appointment
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Add an upcoming hospital or doctor appointment.
          </p>

          <div className="mt-6">
            <AppointmentForm
              familyId={membership.familyId}
              currentUserId={userId}
              currentUserName={currentUserName}
              familyMembers={familyMembers.map((member) => ({
                id: member.user.id,
                name:
                  member.user.profile?.name ||
                  member.user.email.split("@")[0],
              }))}
            />
          </div>
        </section>
       {/* [Appointments → Appointment History]
    This page intentionally shows both UPCOMING and VISITED
    appointments. Only deleted appointments are absent. */}
<section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">

  <div className="mb-5">
    <h2 className="text-xl font-semibold text-slate-900">
      Appointments
    </h2>

    <p className="mt-1 text-sm text-slate-500">
      View and manage your family&apos;s healthcare appointments.
    </p>
  </div>

  {appointments.length === 0 ? (
    <div className="rounded-xl border border-dashed p-8 text-center">
      <p className="font-medium text-slate-700">
        No appointments
      </p>

      <p className="mt-1 text-sm text-slate-500">
        Add an appointment to keep track of healthcare visits.
      </p>
    </div>
  ) : (
    <div className="space-y-3">

      {appointments.map((appointment) => (

        <div
          key={appointment.id}
          className="rounded-xl border p-5"
        >

          {/* [Appointment → Header]
              Hospital/clinic name and current appointment status. */}
          <div className="flex items-start justify-between gap-4">

            <div>
              <h3 className="font-semibold text-slate-900">
                {appointment.hospitalName}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Patient:{" "}
                {appointment.patient.profile?.name ||
                  appointment.patient.email.split("@")[0]}
              </p>
            </div>

            {/* [Appointment → Status]
                VISITED appointments remain in history but are
                visually separated from upcoming appointments. */}
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
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

          {/* [Appointment → Details] */}
          {appointment.doctorName && (
            <p className="mt-2 text-sm text-slate-500">
              Doctor: {appointment.doctorName}
            </p>
          )}

          <p className="mt-2 text-sm font-medium text-teal-700">
            {formatAppointmentDate(
              appointment.appointmentDate,
              appointment.timeZone,
            )}{" "}
            at{" "}
            {formatAppointmentTime(
              appointment.appointmentDate,
              appointment.timeZone,
            )}
          </p>

          {appointment.hospitalAddress && (
            <p className="mt-2 text-sm text-slate-500">
              {appointment.hospitalAddress}
            </p>
          )}

          {/* [Appointment → Actions]
              Only UPCOMING appointments can be marked visited.
              VISITED appointments remain as history. */}
          {appointment.status === "UPCOMING" && (
            <div className="mt-4">
              <AppointmentActions
                appointmentId={appointment.id}
              />
            </div>
          )}

        </div>

      ))}

    </div>
  )}

</section>
      </div>
    </main>
  );
}