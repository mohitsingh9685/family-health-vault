import { redirect } from "next/navigation";

import { auth } from "@/auth";
import AppointmentWorkspace from "@/components/appointments/appointment-workspace";
import Sidebar from "@/components/dashboard/sidebar";
import {
  formatAppointmentDate,
  formatAppointmentTime,
} from "@/lib/appointments";
import { prisma } from "@/lib/prisma";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    familyId?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const userId = session.user.id;
  const { familyId } = await searchParams;
  const memberships = await prisma.familyMember.findMany({
    where: { userId },
    include: {
      family: {
        include: {
          _count: {
            select: { members: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  const membership = familyId
    ? memberships.find((item) => item.familyId === familyId)
    : memberships[0];

  if (!membership) {
    redirect(
      `/appointments?familyId=${encodeURIComponent(memberships[0].familyId)}`,
    );
  }

  const [familyMembers, appointments] = await Promise.all([
    prisma.familyMember.findMany({
      where: { familyId: membership.familyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.appointment.findMany({
      where: { familyId: membership.familyId },
      include: {
        patient: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { appointmentDate: "asc" },
    }),
  ]);

  const members = familyMembers.map((member) => ({
    id: member.user.id,
    name: member.user.profile?.name || member.user.email.split("@")[0],
  }));
  const currentUserName =
    members.find((member) => member.id === userId)?.name ||
    session.user.email?.split("@")[0] ||
    "User";

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar
        familyId={membership.familyId}
        familyName={membership.family.name}
        familyRole={membership.role}
        memberCount={membership.family._count.members}
      />

      <AppointmentWorkspace
        familyId={membership.familyId}
        familyName={membership.family.name}
        currentUserId={userId}
        currentUserName={currentUserName}
        families={memberships.map((item) => ({
          id: item.familyId,
          name: item.family.name,
        }))}
        familyMembers={members}
        appointments={appointments.map((appointment) => ({
          id: appointment.id,
          hospitalName: appointment.hospitalName,
          hospitalAddress: appointment.hospitalAddress,
          doctorName: appointment.doctorName,
          status: appointment.status,
          timestamp: appointment.appointmentDate.toISOString(),
          dateLabel: formatAppointmentDate(
            appointment.appointmentDate,
            appointment.timeZone,
          ),
          timeLabel: formatAppointmentTime(
            appointment.appointmentDate,
            appointment.timeZone,
          ),
          patient: {
            id: appointment.patient.id,
            name:
              appointment.patient.profile?.name ||
              appointment.patient.email.split("@")[0],
          },
        }))}
      />
    </div>
  );
}
