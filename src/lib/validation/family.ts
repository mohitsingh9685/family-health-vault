import { z } from "zod";

// [Family API → Validation]
// Validates data submitted when creating a family.
export const createFamilySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Family name is required")
    .max(100, "Family name must be 100 characters or less"),
});