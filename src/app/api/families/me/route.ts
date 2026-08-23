import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // [Auth.js → Family Membership API]
  // Use the authenticated user's database ID as the trusted identity.
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // [Family Membership API → Prisma]
    // A user can belong to multiple families, so fetch every membership.
    const memberships = await prisma.familyMember.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        role: true,
        createdAt: true,
        family: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // [Prisma → Family Frontend]
    // Return all families available to the authenticated user.
    return NextResponse.json({
      families: memberships.map((membership) => ({
        ...membership.family,
        role: membership.role,
      })),
    });
  } catch (error) {
    // [Family Membership API → Error Handling]
    // Keep database details on the server.
    console.error("Failed to fetch user families:", error);

    return NextResponse.json(
      { error: "Failed to fetch families" },
      { status: 500 }
    );
  }
}