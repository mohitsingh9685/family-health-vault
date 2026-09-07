import { redirect } from "next/navigation";

import { auth } from "@/auth";
import Dashboard from "@/components/dashboard/dashboard";
import { getUpcomingAppointments } from "@/lib/appointments";
import { getFamilyOverview } from "@/lib/dashboard/get-family-overview";
import {
  getHealthTrends,
  parseHealthTrendRange,
} from "@/lib/dashboard/get-health-trends";
import { getUserVitals } from "@/lib/dashboard/get-user-vitals";
import { prisma } from "@/lib/prisma";

export default async function HomePage({
  searchParams,
}: {
  // [URL → Home]
  // Next.js provides query parameters asynchronously.
  searchParams: Promise<{
    familyId?: string;
    range?: string;
  }>;
}) {
  // ------------------------------------------------------------
  // [Auth.js → Home]
  // Only authenticated users can access the dashboard.
  // ------------------------------------------------------------
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const userId = session.user.id;

  // ------------------------------------------------------------
  // [Family Switcher → Home]
  //
  // /family sends the selected family as:
  //
  // /home?familyId=<family-id>
  //
  // The value is NOT trusted by itself.
  // We verify membership against PostgreSQL below.
  // ------------------------------------------------------------
  const { familyId, range } = await searchParams;
  const trendRange = parseHealthTrendRange(range);

  // ------------------------------------------------------------
  // [Home → Family Authorization]
  //
  // If familyId exists:
  //   Find that exact family membership.
  //
  // If familyId does not exist:
  //   Find the user's first family.
  //
  // This means a user can NEVER access another family's
  // dashboard simply by changing the URL.
  // ------------------------------------------------------------
  const membership = await prisma.familyMember.findFirst({
    where: {
      userId,

      ...(familyId
        ? {
            familyId,
          }
        : {}),
    },

    include: {
      family: true,
    },

    orderBy: {
      createdAt: "asc",
    },
  });

  // ------------------------------------------------------------
  // [Home → Family Setup]
  //
  // If the user has no family at all, send them to the
  // family selection/setup flow.
  //
  // If familyId was invalid or the user is not a member of
  // that family, membership will also be null.
  // ------------------------------------------------------------
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

    // The requested family exists but the user does not belong
    // to it. Redirect to the user's valid default family.
    redirect(`/home?familyId=${firstMembership.familyId}`);
  }

  // ------------------------------------------------------------
  // [Family → Family Members]
  //
  // IMPORTANT:
  // We query using familyId, NOT userId.
  //
  // Therefore every member of the same family sees the same
  // family members on their dashboard.
  // ------------------------------------------------------------
  const familyOverview = await getFamilyOverview(
    membership.familyId,
    userId,
  );

  const upcomingAppointments = await getUpcomingAppointments(
    membership.familyId,
  );

  const userVitals = await getUserVitals(userId);
  const healthTrends = await getHealthTrends(userId, trendRange);
  // Return only uploaded records owned by the user or explicitly shared
  // with the selected family.

const recentMedicalRecords =
  await prisma.medicalRecord.findMany({
    
    where: {
      uploadStatus: "UPLOADED",

      // [Medical Record Ownership → Home]
      // A user's own medical records are visible to them
      // in every family they belong to.
      OR: [
        {
          userId,
        },

        // [Family Access → Home]
        // Other family members can see a record only when
        // that record has been explicitly shared with this family.
        {
          accesses: {
            some: {
              familyId: membership.familyId,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      type: true,
      createdAt: true,
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
      createdAt: "desc",
    },
    take: 5,
  });

  const currentUserName =
    familyOverview.find((member) => member.userId === userId)?.name ||
    session.user.email?.split("@")[0] ||
    "User";

  return (
    <Dashboard
      familyId={membership.familyId}
      familyName={membership.family.name}
      familyRole={membership.role}
      userName={currentUserName}
      latestVitals={userVitals}
      familyOverview={familyOverview}
      trends={healthTrends}
      upcomingAppointments={upcomingAppointments}
      recentMedicalRecords={recentMedicalRecords}
    />
  );
}