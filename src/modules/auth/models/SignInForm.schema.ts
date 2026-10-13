import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";

// Password strength is not checked here: it would reveal the rules and adds
// nothing to sign-in. It belongs to sign-up and password reset (KAN-37).
export const signInFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .email(VALIDATION_MESSAGE_KEY.EMAIL_INVALID),
  password: z.string().min(1, VALIDATION_MESSAGE_KEY.REQUIRED),
});

export type SignInFormValues = z.infer<typeof signInFormSchema>;
