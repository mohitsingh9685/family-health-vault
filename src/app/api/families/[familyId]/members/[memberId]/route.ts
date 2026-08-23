import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  requireFamilyOwner,
} from "@/lib/auth/authorization";

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      familyId: string;
      memberId: string;
    }>;
  }
) {
  // [Auth.js → Remove Member API]
  // Only authenticated users can remove family members.
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { familyId, memberId } = await params;

  try {
    // [Authorization → Remove Member API]
    // Only the family OWNER can remove another member.
    await requireFamilyOwner(session.user.id, familyId);

    // [Remove Member → Prisma]
    // Find the membership inside the requested family.
    const membership = await prisma.familyMember.findFirst({
      where: {
        id: memberId,
        familyId,
      },
      select: {
        id: true,
        userId: true,
        role: true,
      },
    });

    if (!membership) {
      return NextResponse.json(
        { error: "Family member not found" },
        { status: 404 }
      );
    }

    // [Authorization → Remove Member API]
    // The OWNER cannot remove themselves.
    if (membership.userId === session.user.id) {
      return NextResponse.json(
        { error: "You cannot remove yourself" },
        { status: 400 }
      );
    }

    // [FamilyRole → Remove Member API]
    // The OWNER cannot be removed.
    if (membership.role === "OWNER") {
      return NextResponse.json(
        { error: "The family owner cannot be removed" },
        { status: 400 }
      );
    }

    // [Prisma → FamilyMember]
    // Delete only the membership, not the user's account.
    await prisma.familyMember.delete({
      where: {
        id: membership.id,
      },
    });

    return NextResponse.json({
      message: "Family member removed successfully",
    });
  } catch (error) {
    // [Authorization → Remove Member API]
    // Convert authorization failures into a safe response.
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // [API → Error Handling]
    // Keep internal database errors on the server.
    console.error("Failed to remove family member:", error);

    return NextResponse.json(
      { error: "Failed to remove family member" },
      { status: 500 }
    );
  }
}