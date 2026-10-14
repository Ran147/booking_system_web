import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/shared/constants";
import { evaluatePasswordStrength } from "@/shared/domain";

// Every form that sets a password uses this field, so the rule is the one the
// PasswordStrengthMeter shows (forms-validation-standards §5).
export const passwordFieldSchema = z
  .string()
  .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
  .refine(
    (password) => evaluatePasswordStrength(password).isValid,
    VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK,
  );
