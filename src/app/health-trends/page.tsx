import { redirect } from "next/navigation";

import { auth } from "@/auth";
import DetailedHealthTrends from "@/components/health-trends/detailed-health-trends";
import {
  getHealthTrends,
  parseHealthTrendRange,
} from "@/lib/dashboard/get-health-trends";
import { prisma } from "@/lib/prisma";

export default async function HealthTrendsPage({
  searchParams,
}: {
  searchParams: Promise<{
    familyId?: string;
    range?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin");
  }

  const userId = session.user.id;
  const { familyId, range } = await searchParams;
  const trendRange = parseHealthTrendRange(range);

  const membership = await prisma.familyMember.findFirst({
    where: {
      userId,
      ...(familyId ? { familyId } : {}),
    },
    include: {
      family: {
        include: {
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
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

    redirect(
      `/health-trends?familyId=${encodeURIComponent(firstMembership.familyId)}&range=${trendRange}`,
    );
  }

  const trends = await getHealthTrends(userId, trendRange);

  return (
    <DetailedHealthTrends
      familyId={membership.familyId}
      familyName={membership.family.name}
      familyRole={membership.role}
      memberCount={membership.family._count.members}
      trends={trends}
    />
  );
}
