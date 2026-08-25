// Relation:
// Appointment Form → POST /api/appointments → Authorization → Prisma → PostgreSQL

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// [API → Input Validation]
// Never trust values coming from the browser.
const createAppointmentSchema = z.object({
  hospitalName: z.string().trim().min(1).max(200),
  patientId: z.string().uuid(),
  hospitalAddress: z.string().trim().max(500).optional(),
  doctorName: z.string().trim().max(200).optional(),
  appointmentDate: z.string().min(1),
  appointmentTime: z.string().min(1),
});

// [Appointments API → Appointment List]
// Returns upcoming appointments for the authenticated user.
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const appointments =
      await prisma.appointment.findMany({
        where: {
          status: "UPCOMING",

          // User can see appointments they created
          // or appointments where they are the patient.
          OR: [
            {
              createdById: session.user.id,
            },
            {
              patientId: session.user.id,
            },
          ],

          // Only future appointments.
          appointmentDate: {
            gte: new Date(),
          },
        },

        include: {
          patient: {
            select: {
              id: true,
              email: true,

              profile: {
                select: {
                  name: true,
                },
              },
            },
          },
        },

        orderBy: {
          appointmentDate: "asc",
        },
      });

    return NextResponse.json({
      appointments,
    });
  } catch (error) {
    console.error(
      "Failed to fetch appointments:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    // [Auth.js → Appointment API]
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    const result = createAppointmentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid appointment data",
          details: result.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      hospitalName,
      patientId,
      hospitalAddress,
      doctorName,
      appointmentDate,
      appointmentTime,
    } = result.data;

    const userId = session.user.id;

    // ------------------------------------------------------------
    // [Authorization → Family]
    //
    // Find a family that both:
    // 1. The logged-in user belongs to
    // 2. The selected patient belongs to
    //
    // This prevents creating appointments for unrelated users.
    // ------------------------------------------------------------
    const sharedFamily = await prisma.familyMember.findFirst({
      where: {
        userId,
        family: {
          members: {
            some: {
              userId: patientId,
            },
          },
        },
      },
    });

    if (!sharedFamily) {
      return NextResponse.json(
        { error: "Patient is not a member of your family" },
        { status: 403 },
      );
    }

    // ------------------------------------------------------------
    // [API → Date/Time]
    //
    // Combine the browser's date and time into one DateTime value.
    // ------------------------------------------------------------
    const appointmentDateTime = new Date(
      `${appointmentDate}T${appointmentTime}`,
    );

    if (Number.isNaN(appointmentDateTime.getTime())) {
      return NextResponse.json(
        { error: "Invalid appointment date or time" },
        { status: 400 },
      );
    }

    // Appointments in the past should not be created as UPCOMING.
    if (appointmentDateTime <= new Date()) {
      return NextResponse.json(
        { error: "Appointment must be in the future" },
        { status: 400 },
      );
    }

    // ------------------------------------------------------------
    // [Prisma → PostgreSQL]
    // Create the appointment after authorization succeeds.
    // ------------------------------------------------------------
    const appointment = await prisma.appointment.create({
      data: {
        createdById: userId,
        patientId,
        hospitalName,
        hospitalAddress:
          hospitalAddress || null,
        doctorName:
          doctorName || null,
        appointmentDate: appointmentDateTime,
        status: "UPCOMING",
      },
    });

    return NextResponse.json(
      { appointment },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Failed to create appointment:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to create appointment" },
      { status: 500 },
    );
  }
}