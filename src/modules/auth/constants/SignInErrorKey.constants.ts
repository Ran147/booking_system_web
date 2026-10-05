// Translation keys of the messages shown above the sign-in form. They carry
// their namespace because they come from common and validation (US-33, D-2).
export const SIGN_IN_ERROR_KEY = Object.freeze({
  ACCOUNT_DISABLED: "common:auth.signIn.accountDisabled",
  INVALID_CREDENTIALS: "common:auth.signIn.invalidCredentials",
  NETWORK: "common:errors.network",
  RECAPTCHA_REJECTED: "validation:recaptchaRequired",
  TOO_MANY_ATTEMPTS: "common:auth.signIn.tooManyAttempts",
  UNKNOWN: "common:errors.unknown",
} as const);

export type SignInErrorKey =
  (typeof SIGN_IN_ERROR_KEY)[keyof typeof SIGN_IN_ERROR_KEY];

// Developer-facing messages; never shown to end users.
export const SIGN_IN_FAILURE = Object.freeze({
  MISSING_ROLE_CLAIM: "The signed-in account has no role claim",
} as const);
