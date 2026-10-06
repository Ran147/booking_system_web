export const CHANGE_PASSWORD_ERROR_KEY = {
  CONFIRMATION_MISMATCH: "confirmationMismatch",
  CURRENT_PASSWORD_INVALID: "currentPasswordInvalid",
  SAME_AS_CURRENT: "sameAsCurrent",
} as const;

export const DEFAULT_CHANGE_PASSWORD_VALUES = {
  confirmPassword: STRING.EMPTY,
  currentPassword: STRING.EMPTY,
  newPassword: STRING.EMPTY,
} as const satisfies ChangePasswordFormValues;
import { STRING } from "@/constants";
import type { ChangePasswordFormValues } from "../models/ChangePasswordForm.schema";
