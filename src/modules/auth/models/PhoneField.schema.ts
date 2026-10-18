import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";
import { isValidPhone, PHONE_RULE } from "@/domain";

// The phone field of every form that asks for one
// (forms-validation-standards §6). A form with an optional phone accepts
// z.literal(STRING.EMPTY) as well.
export const phoneFieldSchema = z
  .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
  .trim()
  .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
  .max(PHONE_RULE.MAX_LENGTH, VALIDATION_MESSAGE_KEY.TOO_LONG)
  .refine(isValidPhone, VALIDATION_MESSAGE_KEY.PHONE_INVALID);
