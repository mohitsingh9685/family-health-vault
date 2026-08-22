import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate login input
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Don't reveal whether the email exists
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Credentials are valid
    return NextResponse.json({
      id: user.id,
      email: user.email,
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}