import { z } from "zod";

// [Family Invitation API → Validation]
// Validates the email address used to invite a family member.
export const createFamilyInvitationSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
});