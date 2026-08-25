import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    appointmentId: string;
  }>;
};

// [Appointments API → Authorization]
// Only the creator or patient can modify an appointment.
async function getAuthorizedAppointment(
  appointmentId: string,
  userId: string,
) {
  return prisma.appointment.findFirst({
    where: {
      id: appointmentId,

      OR: [
        {
          createdById: userId,
        },
        {
          patientId: userId,
        },
      ],
    },
  });
}

// ------------------------------------------------------------
// [Appointment → Mark Visited]
// PATCH /api/appointments/[appointmentId]
// ------------------------------------------------------------
export async function PATCH(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { appointmentId } = await params;

    const appointment =
      await getAuthorizedAppointment(
        appointmentId,
        session.user.id,
      );

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // [Appointment Status]
    // Marking an appointment as visited automatically removes
    // it from upcoming appointment queries.
    const updatedAppointment =
      await prisma.appointment.update({
        where: {
          id: appointmentId,
        },
        data: {
          status: "VISITED",
        },
      });

    return NextResponse.json({
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error(
      "Failed to mark appointment as visited:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to update appointment" },
      { status: 500 },
    );
  }
}

// ------------------------------------------------------------
// [Appointment → Delete]
// DELETE /api/appointments/[appointmentId]
// ------------------------------------------------------------
export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { appointmentId } = await params;

    const appointment =
      await getAuthorizedAppointment(
        appointmentId,
        session.user.id,
      );

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    await prisma.appointment.delete({
      where: {
        id: appointmentId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Failed to delete appointment:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 },
    );
  }
}