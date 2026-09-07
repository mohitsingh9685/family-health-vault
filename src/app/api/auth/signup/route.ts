
import { NextResponse } from "next/server";

import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { signupSchema } from "@/lib/validation/auth";

export async function POST(req: Request) {
  try {
    // [Signup UI → Signup API]
    // Request data comes from the browser and must never be trusted.
    const body = await req.json();

    // [Signup API → Validation]
    // Validate email/password before touching the database.
    const result = signupSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // [Validation → Prisma]
    // Check whether the email is already registered.
    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // [Signup API → Password Security]
    // Never store the user's plain-text password.
    const passwordHash = await hashPassword(password);

    // [Password Security → Prisma]
    // Store only the password hash.
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

    // [Signup API → Signup UI]
    // Return only the minimum safe account information.
    //
    // Auth.js session creation happens separately in signup/page.tsx.
    return NextResponse.json(user, {
      status: 201,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // [Signup API → Error Handling]
    // Log the real error server-side without exposing database
    // or implementation details to the client.
    console.error("Failed to create account:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
