import { NextResponse } from "next/server";
import { randomBytes, createHash } from "crypto";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  AuthorizationError,
  requireFamilyOwner,
} from "@/lib/auth/authorization";
import { createFamilyInvitationSchema } from "@/lib/validation/family-invitation";

// [Auth.js → Family Invitation API]
// Creates an invitation only for an authenticated family owner.
export async function POST(
  request: Request,
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
    // [Authorization → Family Invitation]
    // Only the family owner can invite new members.
    await requireFamilyOwner(session.user.id, familyId);

    // [Client → Validation]
    // Validate the untrusted request body.
    const body = await request.json();
    const result = createFamilyInvitationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error:
            result.error.issues[0]?.message ?? "Invalid request",
        },
        { status: 400 }
      );
    }

    const email = result.data.email.toLowerCase();

    // [Prisma → User]
    // If the email already belongs to a family member,
    // there is no reason to create another membership.
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUser) {
      const existingMembership =
        await prisma.familyMember.findUnique({
          where: {
            userId_familyId: {
              userId: existingUser.id,
              familyId,
            },
          },
        });

      if (existingMembership) {
        return NextResponse.json(
          { error: "User is already a family member" },
          { status: 409 }
        );
      }
    }

    // [Security → Invitation Token]
    // Generate a random token for the invitation link.
    // Only its SHA-256 hash is stored in the database.
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    // [Invitation → Expiration]
    // Invitations remain valid for 7 days.
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // [Prisma → FamilyInvitation]
    // Store only the hashed token, never the raw token.
    const invitation = await prisma.familyInvitation.create({
      data: {
        familyId,
        invitedByUserId: session.user.id,
        email,
        tokenHash,
        expiresAt,
      },
      select: {
        id: true,
        email: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    // [API → Client]
    // The raw token will later be used to construct the invitation
    // link and should be sent through a secure email service.
    return NextResponse.json(
      {
        invitation,
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    // [Authorization → API]
    // Convert authorization failures into a 403 response.
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // [API → Error Handling]
    // Never expose internal database errors to the client.
    console.error("Failed to create family invitation:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}