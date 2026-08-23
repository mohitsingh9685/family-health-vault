import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  requireFamilyMember,
} from "@/lib/auth/authorization";

// [Auth.js] Protects access to an individual family.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ familyId: string }> }
) {
  const session = await auth();

  // [Auth.js] Reject unauthenticated requests.
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { familyId } = await params;

  try {
    // [authorization.ts] Verify that the user belongs to this family.
    await requireFamilyMember(session.user.id, familyId);

    // [Prisma] Only query the family after authorization succeeds.
    const family = await prisma.family.findUnique({
      where: { id: familyId },
    });

    if (!family) {
      return NextResponse.json(
        { error: "Family not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(family);
  } catch (error) {
    // [authorization.ts] Handle genuine authorization failures as 403.
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Unexpected database/server errors are not authorization failures.
    console.error("Failed to access family:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}