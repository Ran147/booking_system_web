export const VALIDATION_MESSAGE_KEY = {
  EMAIL_INVALID: "emailInvalid",
  FILE_INVALID: "fileInvalid",
  OUT_OF_RANGE: "outOfRange",
  PASSWORD_TOO_WEAK: "passwordTooWeak",
  PHONE_INVALID: "phoneInvalid",
  RECAPTCHA_REQUIRED: "recaptchaRequired",
  REQUIRED: "required",
  TOO_LONG: "tooLong",
  TOO_SHORT: "tooShort",
  URL_INVALID: "urlInvalid",
} as const;

export type ValidationMessageKey =
  (typeof VALIDATION_MESSAGE_KEY)[keyof typeof VALIDATION_MESSAGE_KEY];
