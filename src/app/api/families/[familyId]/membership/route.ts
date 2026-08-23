import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  requireFamilyMember,
} from "@/lib/auth/authorization";

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      familyId: string;
    }>;
  }
) {
  // [Auth.js → Leave Family API]
  // Only authenticated users can leave a family.
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { familyId } = await params;

  try {
    // [Authorization → Leave Family API]
    // Verify that the authenticated user belongs to this family.
    const membership = await requireFamilyMember(
      session.user.id,
      familyId
    );

    // [FamilyRole → Leave Family API]
    // The only OWNER cannot leave because that would leave the
    // family without an owner.
    if (membership.role === "OWNER") {
      return NextResponse.json(
        {
          error:
            "The family owner cannot leave the family. Transfer ownership first.",
        },
        { status: 400 }
      );
    }

    // [Prisma → FamilyMember]
    // Remove only this user's membership.
    // The user's account and other family memberships remain untouched.
    await prisma.familyMember.delete({
      where: {
        id: membership.id,
      },
    });

    // [Leave Family API → Client]
    return NextResponse.json({
      message: "You have left the family successfully",
    });
  } catch (error) {
    // [Authorization → Leave Family API]
    // Convert authorization failures into a safe response.
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // [API → Error Handling]
    // Keep internal database errors on the server.
    console.error("Failed to leave family:", error);

    return NextResponse.json(
      { error: "Failed to leave family" },
      { status: 500 }
    );
  }
}