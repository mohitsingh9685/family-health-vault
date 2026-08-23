import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  requireFamilyOwner,
} from "@/lib/auth/authorization";

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      familyId: string;
    }>;
  }
) {
  // [Auth.js → Ownership API]
  // Only authenticated users can transfer ownership.
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { familyId } = await params;

  try {
    // [Authorization → Ownership API]
    // Only the current OWNER can transfer ownership.
    await requireFamilyOwner(session.user.id, familyId);

    // [Client → Ownership API]
    // The target member ID comes from an untrusted client.
    const body = await request.json();

    if (
      !body ||
      typeof body.memberId !== "string" ||
      !body.memberId.trim()
    ) {
      return NextResponse.json(
        { error: "Invalid member ID" },
        { status: 400 }
      );
    }

    const targetMemberId = body.memberId.trim();

    // [Prisma → Ownership]
    // Transfer ownership atomically so the family never has
    // two owners or temporarily has no owner.
    await prisma.$transaction(async (tx) => {
      const currentOwner = await tx.familyMember.findFirst({
        where: {
          userId: session.user.id,
          familyId,
          role: "OWNER",
        },
      });

      if (!currentOwner) {
        throw new AuthorizationError("Family owner access required");
      }

      const targetMember = await tx.familyMember.findFirst({
        where: {
          id: targetMemberId,
          familyId,
        },
      });

      if (!targetMember) {
        throw new Error("MEMBER_NOT_FOUND");
      }

      // [Ownership → Validation]
      // The owner cannot transfer ownership to themselves.
      if (targetMember.userId === session.user.id) {
        throw new Error("CANNOT_TRANSFER_TO_SELF");
      }

      // [Ownership → Validation]
      // Ownership can only be transferred to a normal MEMBER.
      if (targetMember.role !== "MEMBER") {
        throw new Error("INVALID_TARGET");
      }

      // [Ownership → FamilyMember]
      // First demote the current owner.
      await tx.familyMember.update({
        where: {
          id: currentOwner.id,
        },
        data: {
          role: "MEMBER",
        },
      });

      // [Ownership → FamilyMember]
      // Then promote the selected member to OWNER.
      await tx.familyMember.update({
        where: {
          id: targetMember.id,
        },
        data: {
          role: "OWNER",
        },
      });
    });

    return NextResponse.json({
      message: "Family ownership transferred successfully",
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    if (error instanceof Error) {
      switch (error.message) {
        case "MEMBER_NOT_FOUND":
          return NextResponse.json(
            { error: "Family member not found" },
            { status: 404 }
          );

        case "CANNOT_TRANSFER_TO_SELF":
          return NextResponse.json(
            { error: "You are already the family owner" },
            { status: 400 }
          );

        case "INVALID_TARGET":
          return NextResponse.json(
            { error: "Ownership can only be transferred to a member" },
            { status: 400 }
          );
      }
    }

    // [Ownership API → Error Handling]
    console.error("Failed to transfer family ownership:", error);

    return NextResponse.json(
      { error: "Failed to transfer ownership" },
      { status: 500 }
    );
  }
}