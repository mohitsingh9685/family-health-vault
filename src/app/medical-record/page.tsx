import { redirect } from "next/navigation";

import { auth } from "@/auth";
import Sidebar from "@/components/dashboard/sidebar";
import MedicalRecordWorkspace from "@/components/medical-record/medical-record-workspace";
import { prisma } from "@/lib/prisma";

export default async function MedicalRecordRoute({
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
      `/medical-record?familyId=${encodeURIComponent(memberships[0].familyId)}`,
    );
  }

  const [familyMembers, medicalRecords] = await Promise.all([
    prisma.familyMember.findMany({
      where: { familyId: membership.familyId },
      select: {
        userId: true,
        user: {
          select: {
            email: true,
            profile: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.medicalRecord.findMany({
      where: {
        uploadStatus: "UPLOADED",
        OR: [
          { userId },
          {
            accesses: {
              some: { familyId: membership.familyId },
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        type: true,
        description: true,
        processingStatus: true,
        createdAt: true,
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
      orderBy: [{ createdAt: "desc" }, { title: "asc" }],
    }),
  ]);

  const members = familyMembers.map((member) => ({
    userId: member.userId,
    name: member.user.profile?.name || member.user.email.split("@")[0],
  }));
  const currentUserName =
    members.find((member) => member.userId === userId)?.name ||
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

      <MedicalRecordWorkspace
        familyId={membership.familyId}
        familyName={membership.family.name}
        userName={currentUserName}
        families={memberships.map((item) => ({
          id: item.familyId,
          name: item.family.name,
        }))}
        members={members}
        records={medicalRecords.map((record) => ({
          id: record.id,
          title: record.title,
          type: record.type,
          description: record.description,
          processingStatus: record.processingStatus,
          createdAt: record.createdAt.toISOString(),
          owner: {
            userId: record.user.id,
            name:
              record.user.profile?.name || record.user.email.split("@")[0],
          },
        }))}
      />
    </div>
  );
}
