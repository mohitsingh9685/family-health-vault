import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE() {
  // [Auth.js → Account API]
  // Only authenticated users can delete their account.
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    // [Account API → Prisma]
    // Check whether the user owns any families.
    const ownedFamilies = await prisma.familyMember.findMany({
      where: {
        userId,
        role: "OWNER",
      },
      select: {
        familyId: true,
      },
    });

    // [Account Deletion → Ownership Protection]
    // Do not allow deletion while the user owns a family.
    if (ownedFamilies.length > 0) {
      return NextResponse.json(
        {
          error:
            "You must transfer ownership or delete your families before deleting your account.",
        },
        { status: 409 }
      );
    }

    // [Account API → Prisma Transaction]
    // Delete the user and related authentication/profile data atomically.
    await prisma.$transaction(async (tx) => {
      // [User → FamilyInvitation]
      // Remove invitations created by this user.
      await tx.familyInvitation.deleteMany({
        where: {
          invitedByUserId: userId,
        },
      });

      // [User → FamilyMember]
      // Remove the user's membership from every family.
      await tx.familyMember.deleteMany({
        where: {
          userId,
        },
      });

      // [User → Profile]
      // Profile has a cascading relation, but explicitly deleting it
      // keeps the account deletion flow clear.
      await tx.profile.deleteMany({
        where: {
          userId,
        },
      });

      // [Account → User]
      // Delete the authentication account last.
      await tx.user.delete({
        where: {
          id: userId,
        },
      });
    });

    // [Account API → Client]
    return NextResponse.json({
      message: "Account deleted successfully",
    });
  } catch (error) {
    // [Account API → Error Handling]
    // Never expose internal database details.
    console.error("Failed to delete account:", error);

    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }
}