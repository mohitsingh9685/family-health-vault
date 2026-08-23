import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  requireFamilyMember,
} from "@/lib/auth/authorization";

// [Auth.js → Family API]
// Allows only authenticated members to access their family.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { familyId } = await params;

  try {
    // [Authorization → Family API]
    // Verify that the authenticated user belongs to this family.
    await requireFamilyMember(session.user.id, familyId);

    // [Prisma → Family + Members]
    // Fetch the family and its members in one query.
    // Only safe User fields are returned; passwordHash is never exposed.
    const family = await prisma.family.findUnique({
      where: { id: familyId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        members: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    // [Prisma → Family API]
    // The user may have membership data but the family itself may no longer exist.
    if (!family) {
      return NextResponse.json(
        { error: "Family not found" },
        { status: 404 }
      );
    }

    // [Family API → Client]
    // Return family information together with its members.
    return NextResponse.json(family);
  } catch (error) {
    // [Authorization → Family API]
    // Convert authorization failures into a 403 response.
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // [API → Error Handling]
    // Keep internal database errors on the server.
    console.error("Failed to access family:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}