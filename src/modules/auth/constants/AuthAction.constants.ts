// Firebase sends every email link (verify email, reset password) to one
// action URL with ?mode=…&oobCode=…&continueUrl=… (KAN-126, spec D4).
export const AUTH_ACTION_MODE = Object.freeze({
  RESET_PASSWORD: "resetPassword",
  VERIFY_EMAIL: "verifyEmail",
} as const);

export const EMAIL_VERIFICATION_STATE = Object.freeze({
  CHECKING: "checking",
  FAILED: "failed",
  INVALID: "invalid",
  VERIFIED: "verified",
} as const);

export type EmailVerificationState =
  (typeof EMAIL_VERIFICATION_STATE)[keyof typeof EMAIL_VERIFICATION_STATE];

// Translation keys of the verification messages. They carry their namespace
// because the network and unknown messages live in common.errors.
export const EMAIL_VERIFICATION_ERROR_KEY = Object.freeze({
  LINK_INVALID: "common:auth.emailVerification.linkInvalid",
  NETWORK: "common:errors.network",
  UNKNOWN: "common:errors.unknown",
} as const);

export type EmailVerificationErrorKey =
  (typeof EMAIL_VERIFICATION_ERROR_KEY)[keyof typeof EMAIL_VERIFICATION_ERROR_KEY];
