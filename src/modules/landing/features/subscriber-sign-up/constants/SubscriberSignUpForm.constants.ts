// Field limits of the subscriber sign-up form (SPEC AS-3, AS-7, AS-9). The
// sign-up function checks the same limits again on the server.
export const SUBSCRIBER_SIGN_UP_FIELD_LIMIT = {
  BUSINESS_NAME_MAX_LENGTH: 80,
  BUSINESS_NAME_MIN_LENGTH: 2,
  BUSINESS_SLUG_MAX_LENGTH: 40,
  BUSINESS_SLUG_MIN_LENGTH: 3,
  PERSON_NAME_MAX_LENGTH: 60,
  PERSON_NAME_MIN_LENGTH: 2,
  PHONE_MAX_LENGTH: 20,
  PHONE_MIN_LENGTH: 7,
} as const;

export const SUBSCRIBER_SIGN_UP_PATTERN = {
  // Lowercase a-z and digits in groups joined by single hyphens (AS-7).
  BUSINESS_SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  // Digits, spaces, "+" and "-" (AS-3).
  PHONE: /^[\d\s+-]+$/,
} as const;

// Feature-specific messages, under landing:subscriberSignUp.form.*
export const SUBSCRIBER_SIGN_UP_MESSAGE_KEY = {
  PASSWORD_MISMATCH: "subscriberSignUp.form.passwordMismatch",
  PHONE_INVALID: "subscriberSignUp.form.phoneInvalidError",
  SLUG_INVALID: "subscriberSignUp.form.slugInvalidError",
  SLUG_RESERVED: "subscriberSignUp.form.slugReservedError",
} as const;

export type SubscriberSignUpMessageKey =
  (typeof SUBSCRIBER_SIGN_UP_MESSAGE_KEY)[keyof typeof SUBSCRIBER_SIGN_UP_MESSAGE_KEY];

export const BUSINESS_SLUG_SEPARATOR = "-";

export const BUSINESS_SLUG_PATH_PREFIX = "/";
