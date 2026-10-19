import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";
import { passwordFieldSchema } from "./PasswordField.schema";

export const passwordResetFormSchema = z
  .object({
    confirmation: z.string().min(1, VALIDATION_MESSAGE_KEY.REQUIRED),
    newPassword: passwordFieldSchema,
  })
  .refine((values) => values.confirmation === values.newPassword, {
    message: VALIDATION_MESSAGE_KEY.PASSWORD_MISMATCH,
    path: ["confirmation"],
  });

export type PasswordResetFormValues = z.infer<typeof passwordResetFormSchema>;
