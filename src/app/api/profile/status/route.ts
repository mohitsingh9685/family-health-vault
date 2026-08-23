import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // [Auth.js → Profile Status]
  // Identify the current user from the authenticated session.
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  // [User → Profile]
  // Name is currently the only required profile field.
  const profile = await prisma.profile.findUnique({
    where: {
      userId: session.user.id,
    },
    select: {
      name: true,
    },
  });

  return NextResponse.json({
    complete: Boolean(profile?.name?.trim()),
  });
}