import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import Sidebar from "@/components/dashboard/sidebar";
import VitalCard from "@/components/dashboard/vital-card";
import { prisma } from "@/lib/prisma";

export default async function FamilyMemberPage({
  params,
}: {
  params: Promise<{
    memberId: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const { memberId } = await params;
  const familyMember = await prisma.familyMember.findFirst({
    where: {
      id: memberId,
      family: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
    },
    select: {
      userId: true,
      role: true,
      user: {
        select: {
          email: true,
          profile: {
            select: {
              name: true,
            },
          },
        },
      },
      family: {
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              members: true,
            },
          },
          members: {
            where: {
              userId: session.user.id,
            },
            select: {
              role: true,
            },
            take: 1,
          },
        },
      },
    },
  });

  if (!familyMember) {
    notFound();
  }

  const isViewingOwnData = familyMember.userId === session.user.id;
  const measurements = await prisma.healthMeasurement.findMany({
    where: {
      userId: familyMember.userId,
      ...(isViewingOwnData
        ? {}
        : {
            accesses: {
              some: {
                familyId: familyMember.family.id,
              },
            },
          }),
    },
    select: {
      type: true,
      value: true,
      systolic: true,
      diastolic: true,
      measuredAt: true,
    },
    orderBy: {
      measuredAt: "desc",
    },
    take: 20,
  });

  const bloodPressure = measurements.find(
    (measurement) => measurement.type === "BLOOD_PRESSURE",
  );
  const weight = measurements.find(
    (measurement) => measurement.type === "WEIGHT",
  );
  const bloodSugar = measurements.find(
    (measurement) => measurement.type === "BLOOD_SUGAR",
  );
  const oxygen = measurements.find(
    (measurement) => measurement.type === "OXYGEN_SATURATION",
  );
  const memberName =
    familyMember.user.profile?.name ||
    familyMember.user.email.split("@")[0];
  const viewerRole = familyMember.family.members[0]?.role ?? "MEMBER";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-950">
      <Sidebar
        familyId={familyMember.family.id}
        familyName={familyMember.family.name}
        familyRole={viewerRole}
        memberCount={familyMember.family._count.members}
      />

      <div className="min-w-0 flex-1 px-6 py-10">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
              {familyMember.family.name}
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">
              {memberName}
            </h1>
            <p className="mt-2 text-slate-500">Family health profile</p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="font-medium">{familyMember.user.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Role</p>
                <p className="font-medium">{familyMember.role}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Data visibility</p>
                <p className="font-medium">
                  {isViewingOwnData ? "Your measurements" : "Shared with this family"}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 text-xl font-semibold">Latest health data</h2>
            <p className="mb-4 text-sm text-slate-500">
              Other members&apos; values appear only when explicitly shared with this family.
            </p>

            <div className="grid gap-4 md:grid-cols-4">
              <VitalCard
                title="Blood Pressure"
                value={
                  bloodPressure
                    ? `${bloodPressure.systolic}/${bloodPressure.diastolic}`
                    : "--"
                }
                unit="mmHg"
                icon="❤️"
              />
              <VitalCard
                title="Weight"
                value={weight?.value?.toString() || "--"}
                unit="kg"
                icon="⚖️"
              />
              <VitalCard
                title="Sugar"
                value={bloodSugar?.value?.toString() || "--"}
                unit="mg/dL"
                icon="🩸"
              />
              <VitalCard
                title="SpO₂"
                value={oxygen?.value?.toString() || "--"}
                unit="%"
                icon="🫁"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
