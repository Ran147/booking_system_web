export const VALIDATION_MESSAGE_KEY = {
  EMAIL_INVALID: "emailInvalid",
  OUT_OF_RANGE: "outOfRange",
  PASSWORD_TOO_WEAK: "passwordTooWeak",
  RECAPTCHA_REQUIRED: "recaptchaRequired",
  REQUIRED: "required",
  TOO_LONG: "tooLong",
  TOO_SHORT: "tooShort",
} as const;

export type ValidationMessageKey =
  (typeof VALIDATION_MESSAGE_KEY)[keyof typeof VALIDATION_MESSAGE_KEY];
