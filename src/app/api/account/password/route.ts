import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validation/account";

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const result = changePasswordSchema.safeParse(await request.json());

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid password data",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        passwordHash: true,
      },
    });

    if (
      !user ||
      !(await verifyPassword(
        result.data.currentPassword,
        user.passwordHash,
      ))
    ) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(result.data.newPassword);

    await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        passwordHash,
      },
    });

    return NextResponse.json({
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Password change failed:", error);

    return NextResponse.json(
      { error: "Unable to change password" },
      { status: 500 },
    );
  }
}
