import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/constants";

// The email field of sign-in and password recovery.
export const emailFieldSchema = z
  .string()
  .trim()
  .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
  .email(VALIDATION_MESSAGE_KEY.EMAIL_INVALID);
