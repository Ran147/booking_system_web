import { STRING } from "@/constants";
import type { ChangePasswordFormValues } from "../models/ChangePasswordForm.schema";

export const CHANGE_PASSWORD_ERROR_CODE = {
  AUTHENTICATED_USER_REQUIRED: "change-password/authenticated-user-required",
} as const;

export type ChangePasswordErrorCode =
  (typeof CHANGE_PASSWORD_ERROR_CODE)[keyof typeof CHANGE_PASSWORD_ERROR_CODE];

export const CHANGE_PASSWORD_ERROR_KEY = {
  CONFIRMATION_MISMATCH: "confirmationMismatch",
  CURRENT_PASSWORD_INVALID: "currentPasswordInvalid",
  SAME_AS_CURRENT: "sameAsCurrent",
} as const;

export const CHANGE_PASSWORD_FORM_MODE = {
  VALIDATION: "onBlur",
} as const;

export const DEFAULT_CHANGE_PASSWORD_VALUES = {
  confirmPassword: STRING.EMPTY,
  currentPassword: STRING.EMPTY,
  newPassword: STRING.EMPTY,
} as const satisfies ChangePasswordFormValues;
