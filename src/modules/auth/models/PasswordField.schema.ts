import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";
import { evaluatePasswordStrength, PASSWORD_RULE } from "@/domain";

export const passwordFieldSchema = z
  .string()
  .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
  .min(PASSWORD_RULE.MIN_LENGTH, VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK)
  .refine(
    (password) => evaluatePasswordStrength(password).isValid,
    VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK,
  );
