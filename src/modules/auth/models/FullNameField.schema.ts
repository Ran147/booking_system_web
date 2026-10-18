import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";
import { FULL_NAME_RULE } from "@/domain";

// The full name field of every form that asks for one
// (forms-validation-standards §6).
export const fullNameFieldSchema = z
  .string({ message: VALIDATION_MESSAGE_KEY.REQUIRED })
  .trim()
  .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
  .min(FULL_NAME_RULE.MIN_LENGTH, VALIDATION_MESSAGE_KEY.TOO_SHORT)
  .max(FULL_NAME_RULE.MAX_LENGTH, VALIDATION_MESSAGE_KEY.TOO_LONG);
