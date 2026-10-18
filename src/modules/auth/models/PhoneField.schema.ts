import { z } from "zod";
import { STRING, VALIDATION_MESSAGE_KEY } from "@/constants";
import { isValidPhone, PHONE_RULE } from "@/domain";

// The phone field of every form that asks for one
// (forms-validation-standards §6).
export const phoneFieldSchema = z
  .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
  .trim()
  .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
  .max(PHONE_RULE.MAX_LENGTH, VALIDATION_MESSAGE_KEY.TOO_LONG)
  .refine(isValidPhone, VALIDATION_MESSAGE_KEY.PHONE_INVALID);

// The same field when the form does not require it. The value is trimmed
// first, so a field with only spaces counts as empty, not as a missing phone;
// a missing value is stored as empty too.
export const optionalPhoneFieldSchema = z
  .string()
  .trim()
  .default(STRING.EMPTY)
  .pipe(z.union([z.literal(STRING.EMPTY), phoneFieldSchema]));
