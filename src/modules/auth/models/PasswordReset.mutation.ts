import type { PasswordResetErrorKey } from "../constants/PasswordResetErrorKey.constants";

// Contract of the requestPasswordReset callable (functions/src/auth).
export interface RequestPasswordResetPayload {
  readonly email: string;
  readonly recaptchaToken: string;
}

export interface RequestPasswordResetResponse {
  readonly isRequested: true;
}

export interface ConfirmNewPasswordPayload {
  readonly newPassword: string;
  readonly oobCode: string;
}

export interface PasswordResetError {
  readonly code: string;
  readonly messageKey: PasswordResetErrorKey;
}
