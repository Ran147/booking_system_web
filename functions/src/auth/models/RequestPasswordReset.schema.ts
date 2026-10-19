import { z } from "zod";

// Format only: the client form checks the same (cloud-functions-standards §3).
export const requestPasswordResetPayloadSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  recaptchaToken: z.string().min(1),
});
