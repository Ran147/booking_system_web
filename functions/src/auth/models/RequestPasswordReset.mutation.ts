// Contract of the requestPasswordReset callable. Mirror of
// src/modules/auth/models/PasswordReset.mutation.ts - keep in sync.
export interface RequestPasswordResetPayload {
  readonly email: string;
  readonly recaptchaToken: string;
}

// The answer never says whether the account exists (AC-KAN-36-02).
export interface RequestPasswordResetResponse {
  readonly isRequested: true;
}
