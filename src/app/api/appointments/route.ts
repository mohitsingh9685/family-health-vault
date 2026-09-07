// Relation:
// Appointment Form → POST /api/appointments → Authorization → Prisma → PostgreSQL

import { NextResponse } from "next/server";

import { auth } from "@/auth";
import {
  AuthorizationError,
  requireFamilyMember,
} from "@/lib/auth/authorization";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// [API → Input Validation]
// Never trust values coming from the browser.
const createAppointmentSchema = z.object({
  familyId: z.string().uuid(),
  hospitalName: z.string().trim().min(1).max(200),
  patientId: z.string().uuid(),
  hospitalAddress: z.string().trim().max(500).optional(),
  doctorName: z.string().trim().max(200).optional(),
  appointmentDateTime: z.string().datetime(),
  timeZone: z.string().trim().min(1).max(100),
});

// [Appointments API → Appointment List]
// Returns upcoming appointments for one authorized family.
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    const familyIdResult = z
      .string()
      .uuid()
      .safeParse(new URL(request.url).searchParams.get("familyId"));

    if (!familyIdResult.success) {
      return NextResponse.json(
        { error: "A valid familyId is required" },
        { status: 400 },
      );
    }

    try {
      await requireFamilyMember(
        session.user.id,
        familyIdResult.data,
      );
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 },
        );
      }

      throw error;
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        familyId: familyIdResult.data,
        status: "UPCOMING",
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

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Failed to fetch appointments:", error);

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
      familyId,
      hospitalName,
      patientId,
      hospitalAddress,
      doctorName,
      appointmentDateTime,
      timeZone,
    } = result.data;

    const userId = session.user.id;

    // ------------------------------------------------------------
    // [Authorization → Family]
    // The creator must belong to the selected family, and the patient
    // must be a member of that same family. The appointment is then
    // permanently scoped to this family.
    // ------------------------------------------------------------
    try {
      await requireFamilyMember(userId, familyId);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { error: error.message },
          { status: 403 },
        );
      }

      throw error;
    }

    const patientMembership = await prisma.familyMember.findUnique({
      where: {
        userId_familyId: {
          userId: patientId,
          familyId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!patientMembership) {
      return NextResponse.json(
        { error: "Patient is not a member of this family" },
        { status: 403 },
      );
    }

    // ------------------------------------------------------------
    // [API → Date/Time]
    // The browser converts its local date/time to an absolute ISO instant.
    // The IANA timezone is stored separately for correct future display.
    // ------------------------------------------------------------
    try {
      new Intl.DateTimeFormat("en-US", { timeZone }).format();
    } catch {
      return NextResponse.json(
        { error: "Invalid appointment timezone" },
        { status: 400 },
      );
    }

    const appointmentInstant = new Date(appointmentDateTime);

    if (Number.isNaN(appointmentInstant.getTime())) {
      return NextResponse.json(
        { error: "Invalid appointment date or time" },
        { status: 400 },
      );
    }

    // Appointments in the past should not be created as UPCOMING.
    if (appointmentInstant <= new Date()) {
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
        familyId,
        createdById: userId,
        patientId,
        hospitalName,
        hospitalAddress:
          hospitalAddress || null,
        doctorName:
          doctorName || null,
        appointmentDate: appointmentInstant,
        timeZone,
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