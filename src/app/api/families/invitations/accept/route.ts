import { NextResponse } from "next/server";
import { createHash } from "crypto";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { acceptFamilyInvitationSchema } from "@/lib/validation/family-invitation";

export async function POST(request: Request) {
  // [Auth.js → Join Family API]
  // Only authenticated users can join a family.
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // [Join Family UI → Validation]
    // The invitation code comes from an untrusted client.
    const body = await request.json();
    const result = acceptFamilyInvitationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid invitation code" },
        { status: 400 }
      );
    }

    // [Security → Invitation Code]
    // Hash the submitted code before looking it up.
    const tokenHash = createHash("sha256")
      .update(result.data.code)
      .digest("hex");

    // [Invitation → Family Membership]
    // Membership creation and invitation consumption are atomic.
    const membership = await prisma.$transaction(async (tx) => {
      // [Prisma → FamilyInvitation]
      // Find the family associated with this invitation code.
      const invitation = await tx.familyInvitation.findUnique({
        where: {
          tokenHash,
        },
      });

      if (!invitation) {
        throw new Error("INVALID_INVITATION");
      }

      // [Invitation → Expiration]
      // Expired codes cannot be accepted.
      if (invitation.expiresAt <= new Date()) {
        throw new Error("INVITATION_EXPIRED");
      }

      // [Invitation → One-Time Use]
      // An invitation can only be consumed once.
      if (invitation.acceptedAt) {
        throw new Error("INVITATION_ALREADY_ACCEPTED");
      }

      // [FamilyMember → Duplicate Protection]
      // Prevent duplicate membership in the same family.
      const existingMembership = await tx.familyMember.findUnique({
        where: {
          userId_familyId: {
            userId: session.user.id,
            familyId: invitation.familyId,
          },
        },
      });

      if (existingMembership) {
        throw new Error("ALREADY_MEMBER");
      }

      // [Prisma → FamilyMember]
      // Add the authenticated user as a normal member.
      const newMembership = await tx.familyMember.create({
        data: {
          userId: session.user.id,
          familyId: invitation.familyId,
          role: "MEMBER",
        },
        select: {
          id: true,
          familyId: true,
          role: true,
          createdAt: true,
        },
      });

      // [FamilyInvitation → One-Time Use]
      // Mark the invitation as consumed.
      await tx.familyInvitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          acceptedAt: new Date(),
        },
      });

      return newMembership;
    });

    // [Join Family API → Family Dashboard]
    return NextResponse.json(membership, { status: 201 });
  } catch (error) {
    // [Join Family API → Known Errors]
    if (error instanceof Error) {
      switch (error.message) {
        case "INVALID_INVITATION":
        case "INVITATION_EXPIRED":
        case "INVITATION_ALREADY_ACCEPTED":
          return NextResponse.json(
            { error: "Invalid or expired invitation code" },
            { status: 400 }
          );

        case "ALREADY_MEMBER":
          return NextResponse.json(
            { error: "You are already a member of this family" },
            { status: 409 }
          );
      }
    }

    // [API → Error Handling]
    // Never expose internal database errors to the client.
    console.error("Failed to accept family invitation:", error);

    return NextResponse.json(
      { error: "Failed to join family" },
      { status: 500 }
    );
  }
}