import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";
import { PASSWORD_RULE } from "../constants/PasswordRule.constants";

export const passwordFieldSchema = z
  .string()
  .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
  .min(PASSWORD_RULE.MIN_LENGTH, VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK)
  .refine(
    (password) =>
      Object.values(PASSWORD_RULE.PATTERN).every((pattern) =>
        pattern.test(password),
      ),
    VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK,
  );
