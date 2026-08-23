import { NextResponse } from "next/server";
import { createHash } from "crypto";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// [Auth.js → Invitation Acceptance]
// Accepts a valid family invitation for the authenticated user.
export async function POST(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      familyId: string;
      token: string;
    }>;
  }
) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { familyId, token } = await params;

  // [Security → Token Hashing]
  // The database stores only the SHA-256 hash of the invitation token.
  const tokenHash = createHash("sha256")
    .update(token)
    .digest("hex");

  try {
    const result = await prisma.$transaction(async (tx) => {
      // [Prisma → FamilyInvitation]
      // Find the invitation using the family and hashed token.
      const invitation = await tx.familyInvitation.findFirst({
        where: {
          familyId,
          tokenHash,
        },
      });

      if (!invitation) {
        throw new Error("INVITATION_NOT_FOUND");
      }

      // [Invitation → Expiration]
      // Expired invitations cannot be accepted.
      if (invitation.expiresAt <= new Date()) {
        throw new Error("INVITATION_EXPIRED");
      }

      // [Invitation → One-Time Use]
      // An accepted invitation cannot be reused.
      if (invitation.acceptedAt) {
        throw new Error("INVITATION_ALREADY_ACCEPTED");
      }

      // [Security → Email Ownership]
      // The invitation must belong to the authenticated user's email.
      if (
        invitation.email.toLowerCase() !==
        session.user.email.toLowerCase()
      ) {
        throw new Error("INVITATION_EMAIL_MISMATCH");
      }

      // [Prisma → FamilyMember]
      // Prevent duplicate membership in the same family.
      const existingMembership =
        await tx.familyMember.findUnique({
          where: {
            userId_familyId: {
              userId: session.user.id,
              familyId,
            },
          },
        });

      if (existingMembership) {
        throw new Error("ALREADY_MEMBER");
      }

      // [FamilyInvitation → FamilyMember]
      // Create the member and mark the invitation as consumed
      // in the same transaction.
      const membership = await tx.familyMember.create({
        data: {
          userId: session.user.id,
          familyId,
          role: "MEMBER",
        },
        select: {
          id: true,
          familyId: true,
          role: true,
          createdAt: true,
        },
      });

      await tx.familyInvitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          acceptedAt: new Date(),
        },
      });

      return membership;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    // [Invitation → API Errors]
    // Convert known invitation failures into appropriate responses.
    if (error instanceof Error) {
      switch (error.message) {
        case "INVITATION_NOT_FOUND":
        case "INVITATION_EXPIRED":
        case "INVITATION_ALREADY_ACCEPTED":
          return NextResponse.json(
            { error: "Invalid or expired invitation" },
            { status: 400 }
          );

        case "INVITATION_EMAIL_MISMATCH":
          return NextResponse.json(
            { error: "Invitation email does not match your account" },
            { status: 403 }
          );

        case "ALREADY_MEMBER":
          return NextResponse.json(
            { error: "You are already a member of this family" },
            { status: 409 }
          );
      }
    }

    // [API → Error Handling]
    // Do not expose internal database errors.
    console.error("Failed to accept family invitation:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}