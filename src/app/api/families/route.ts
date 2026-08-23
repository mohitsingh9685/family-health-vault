import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createFamilySchema } from "@/lib/validation/family";

export async function POST(request: Request) {
  // [Auth.js → Family API]
  // Only authenticated users can create a family.
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // [Client → Family API]
    // Request data is untrusted and must be parsed safely.
    const body = await request.json();

    // [Family API → Validation]
    // Zod validates and normalizes the family name.
    const result = createFamilySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error:
            result.error.issues[0]?.message ?? "Invalid request",
        },
        { status: 400 }
      );
    }

    // [Validation → Prisma]
    // Create the family and its OWNER membership atomically.
    const family = await prisma.$transaction(async (tx) => {
      // [Prisma → Family]
      // Create the new family using only validated data.
      const newFamily = await tx.family.create({
        data: {
          name: result.data.name,
        },
      });

      // [Family → FamilyMember]
      // The authenticated user becomes the family OWNER.
      await tx.familyMember.create({
        data: {
          userId: session.user.id,
          familyId: newFamily.id,
          role: "OWNER",
        },
      });

      return newFamily;
    });

    // [Family API → Client]
    // Return the newly created family.
    return NextResponse.json(family, { status: 201 });
  } catch (error) {
    // [Family API → Error Handling]
    // Log the real error server-side without exposing database details.
    console.error("Failed to create family:", error);

    return NextResponse.json(
      { error: "Failed to create family" },
      { status: 500 }
    );
  }
}