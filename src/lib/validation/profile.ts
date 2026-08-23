import { z } from "zod";

// [Profile Setup UI → Profile API]
// Validates profile data before it is written to PostgreSQL.
export const profileSchema = z.object({
  // Required because the dashboard needs a display name.
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(100, "Name is too long"),

  // Store DOB instead of age because DOB does not change.
  dateOfBirth: z.string().optional().or(z.literal("")),

  gender: z.string().optional().or(z.literal("")),

  phone: z
    .string()
    .trim()
    .max(20, "Phone number is too long")
    .optional()
    .or(z.literal("")),
});

export type ProfileInput = z.infer<typeof profileSchema>;