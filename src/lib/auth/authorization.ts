import { prisma } from "@/lib/prisma";

// [Family API] Represents a genuine authorization failure.
export class AuthorizationError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
  }
}

// [Family API] Checks whether the authenticated user belongs to the family.
export async function requireFamilyMember(
  userId: string,
  familyId: string
) {
  // [Prisma] Both userId and familyId must match the same membership.
  const membership = await prisma.familyMember.findFirst({
    where: {
      userId,
      familyId,
    },
  });

  if (!membership) {
    throw new AuthorizationError(
      "User is not a member of this family"
    );
  }

  return membership;
}

// [Family API] Checks whether the authenticated user owns the family.
export async function requireFamilyOwner(
  userId: string,
  familyId: string
) {
  // [Family API] First verify membership, then verify ownership.
  const membership = await requireFamilyMember(userId, familyId);

  if (membership.role !== "OWNER") {
    throw new AuthorizationError(
      "Family owner access required"
    );
  }

  return membership;
}