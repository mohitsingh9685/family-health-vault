import { z } from "zod";

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(72),
    newPassword: z.string().min(8).max(72),
  })
  .refine(
    ({ currentPassword, newPassword }) =>
      currentPassword !== newPassword,
    {
      message: "New password must be different from the current password",
      path: ["newPassword"],
    },
  );
