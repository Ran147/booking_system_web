// Translation keys of the messages shown by the recovery and reset pages. They
// carry their namespace because they come from common and validation (US-36).
export const PASSWORD_RESET_ERROR_KEY = Object.freeze({
  LINK_INVALID: "common:auth.passwordReset.linkInvalid",
  NETWORK: "common:errors.network",
  RECAPTCHA_REJECTED: "validation:recaptchaRequired",
  TOO_MANY_REQUESTS: "common:auth.passwordReset.tooManyRequests",
  UNKNOWN: "common:errors.unknown",
  WEAK_PASSWORD: "common:auth.passwordReset.weakPassword",
} as const);

export type PasswordResetErrorKey =
  (typeof PASSWORD_RESET_ERROR_KEY)[keyof typeof PASSWORD_RESET_ERROR_KEY];
