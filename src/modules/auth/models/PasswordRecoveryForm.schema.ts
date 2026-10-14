import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";

export const passwordRecoveryFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .email(VALIDATION_MESSAGE_KEY.EMAIL_INVALID),
});

export type PasswordRecoveryFormValues = z.infer<
  typeof passwordRecoveryFormSchema
>;
