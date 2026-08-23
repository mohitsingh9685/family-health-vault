import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signupSchema } from "@/lib/validation/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate incoming data
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const {email, password } = result.data;

    // Check whether email is already registered
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Never store the plain password
    const passwordHash = await hashPassword(password);

   // [Prisma schema] Create the user using only fields defined in User.
const user = await prisma.user.create({
  data: {
    email,
    passwordHash,
  },
  select: {
    id: true,
    email: true,
  },
});

    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}