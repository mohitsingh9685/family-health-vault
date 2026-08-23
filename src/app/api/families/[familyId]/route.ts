import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  requireFamilyMember,
  requireFamilyOwner,
} from "@/lib/auth/authorization";
import { createFamilySchema } from "@/lib/validation/family";

type FamilyRouteContext = {
  params: Promise<{
    familyId: string;
  }>;
};

// [Auth.js → Family API]
// Allows only authenticated members to access their family.
export async function GET(
  _request: Request,
  { params }: FamilyRouteContext
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
    // Only safe User fields are returned.
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
    // Handle a family that no longer exists.
    if (!family) {
      return NextResponse.json(
        { error: "Family not found" },
        { status: 404 }
      );
    }

    // [Family API → Client]
    return NextResponse.json(family);
  } catch (error) {
    // [Authorization → Family API]
    // Convert authorization failures into a safe 403 response.
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

// [Auth.js → Family API]
// Allows only the family OWNER to update family information.
export async function PATCH(
  request: Request,
  { params }: FamilyRouteContext
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
    // Only the OWNER can rename the family.
    await requireFamilyOwner(session.user.id, familyId);

    // [Client → Family API]
    // Request data is untrusted and must be validated.
    const body = await request.json();

    // [Family API → Validation]
    // Reuse the existing family-name validation schema.
    const result = createFamilySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error:
            result.error.issues[0]?.message ??
            "Invalid request",
        },
        { status: 400 }
      );
    }

    // [Validation → Prisma]
    // Update only the validated family name.
    const family = await prisma.family.update({
      where: {
        id: familyId,
      },
      data: {
        name: result.data.name,
      },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
    });

    // [Family API → Client]
    return NextResponse.json(family);
  } catch (error) {
    // [Authorization → Family API]
    // Convert authorization failures into a safe 403 response.
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // [API → Error Handling]
    // Keep internal database errors on the server.
    console.error("Failed to update family:", error);

    return NextResponse.json(
      { error: "Failed to update family" },
      { status: 500 }
    );
  }
}
// [Auth.js → Family API]
// Only the family OWNER can permanently delete the family.
export async function DELETE(
  _request: Request,
  { params }: FamilyRouteContext
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
    // Only the OWNER can delete the family.
    await requireFamilyOwner(session.user.id, familyId);

    // [Prisma → Family]
    // FamilyMember and FamilyInvitation records are deleted
    // automatically through the schema's onDelete: Cascade.
    await prisma.family.delete({
      where: {
        id: familyId,
      },
    });

    return NextResponse.json({
      message: "Family deleted successfully",
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    console.error("Failed to delete family:", error);

    return NextResponse.json(
      { error: "Failed to delete family" },
      { status: 500 }
    );
  }
}