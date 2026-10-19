import { STRING } from "@/constants";
import type { ChangePasswordFormValues } from "../models/ChangePasswordForm.schema";

export const CHANGE_PASSWORD_ERROR_CODE = Object.freeze({
  AUTHENTICATED_USER_REQUIRED: "change-password/authenticated-user-required",
} as const);

export type ChangePasswordErrorCode =
  (typeof CHANGE_PASSWORD_ERROR_CODE)[keyof typeof CHANGE_PASSWORD_ERROR_CODE];

export const CHANGE_PASSWORD_ERROR_KEY = Object.freeze({
  CONFIRMATION_MISMATCH: "confirmationMismatch",
  CURRENT_PASSWORD_INVALID: "currentPasswordInvalid",
  SAME_AS_CURRENT: "sameAsCurrent",
} as const);

export const CHANGE_PASSWORD_FORM_MODE = Object.freeze({
  VALIDATION: "onBlur",
} as const);

export const DEFAULT_CHANGE_PASSWORD_VALUES = Object.freeze({
  confirmPassword: STRING.EMPTY,
  currentPassword: STRING.EMPTY,
  newPassword: STRING.EMPTY,
} as const satisfies ChangePasswordFormValues);
