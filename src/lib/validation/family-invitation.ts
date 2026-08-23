// import { z } from "zod";

// // [Family Invitation API → Validation]
// // Validates the email address used to invite a family member.
// export const createFamilyInvitationSchema = z.object({
//   email: z.string().trim().email("Invalid email address"),
// });
import { z } from "zod";

// [Join Family UI → Invitation API]
// Validates the invitation code entered by the authenticated user.
export const acceptFamilyInvitationSchema = z.object({
  code: z
    .string()
    .trim()
    .toUpperCase()
    .regex(
      /^[A-Z0-9-]{10,20}$/,
      "Invalid invitation code"
    ),
});