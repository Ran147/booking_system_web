import { STRING } from "@/constants";
import type { PasswordResetFormValues } from "../models/PasswordResetForm.schema";

export const DEFAULT_PASSWORD_RESET_FORM_VALUES = Object.freeze({
  confirmation: STRING.EMPTY,
  newPassword: STRING.EMPTY,
} as const satisfies PasswordResetFormValues);
