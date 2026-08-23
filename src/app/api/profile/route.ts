import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileSchema } from "@/lib/validation/profile";

export async function POST(request: Request) {
  // [Auth.js → Profile API]
  // Get the authenticated user from the server session.
  // Never trust a userId sent by the browser.
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();

    // [Profile UI → Validation]
    // Validate incoming profile data before database access.
    const result = profileSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid profile data",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { name, dateOfBirth, gender, phone } = result.data;

    // [Authenticated User → Profile → PostgreSQL]
    // Upsert supports both first-time profile creation
    // and future profile updates.
    const profile = await prisma.profile.upsert({
      where: {
        userId: session.user.id,
      },

      create: {
        userId: session.user.id,
        name,
        dateOfBirth: dateOfBirth
          ? new Date(dateOfBirth)
          : null,
        gender: gender || null,
        phone: phone || null,
      },

      update: {
        name,
        dateOfBirth: dateOfBirth
          ? new Date(dateOfBirth)
          : null,
        gender: gender || null,
        phone: phone || null,
      },
    });

    return NextResponse.json(
      {
        message: "Profile saved successfully",
        profile,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Profile save error:", error);

    return NextResponse.json(
      { error: "Unable to save profile" },
      { status: 500 },
    );
  }
}