import { z } from "zod";
import { emailFieldSchema } from "./EmailField.schema";

export const passwordRecoveryFormSchema = z.object({
  email: emailFieldSchema,
});

export type PasswordRecoveryFormValues = z.infer<
  typeof passwordRecoveryFormSchema
>;
