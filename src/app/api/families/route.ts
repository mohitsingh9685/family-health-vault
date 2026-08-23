import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();

if (!session?.user?.id) {
  return NextResponse.json(
    { error: "Unauthorized" },
    { status: 401 }
  );
}
// [Client → API] Read and validate the requested family name.
const { name } = await request.json();

if (!name?.trim()) {
  return NextResponse.json(
    { error: "Family name is required" },
    { status: 400 }
  );
}
const family = await prisma.$transaction(async (tx) => {
  const newFamily = await tx.family.create({
    data: {
      name: name.trim(),
    },
  });

  await tx.familyMember.create({
    data: {
      // [Auth.js] Session now provides a properly typed database user ID.
      userId: session.user.id,
      familyId: newFamily.id,
      role: "OWNER",
    },
  });

  return newFamily;
});

  return NextResponse.json(family, { status: 201 });
}