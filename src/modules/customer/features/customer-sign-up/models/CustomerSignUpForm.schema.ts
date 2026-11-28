import { z } from "zod";
import {
  emailFieldSchema,
  fullNameFieldSchema,
  passwordFieldSchema,
  phoneFieldSchema,
} from "@/modules/auth";

// The shared field rules (forms-validation-standards §5 and §6); the server
// checks the same ones again (completeCustomerSignUp).
export const customerSignUpFormSchema = z.object({
  email: emailFieldSchema,
  fullName: fullNameFieldSchema,
  password: passwordFieldSchema,
  phone: phoneFieldSchema,
});

export type CustomerSignUpFormValues = z.input<typeof customerSignUpFormSchema>;
