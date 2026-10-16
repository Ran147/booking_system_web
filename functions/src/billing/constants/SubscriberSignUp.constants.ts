// Mirror of SUBSCRIBER_SIGN_UP_FIELD_LIMIT and SUBSCRIBER_SIGN_UP_PATTERN in
// src/modules/landing/features/subscriber-sign-up/constants/
// SubscriberSignUpForm.constants.ts — keep in sync (SPEC AS-3, AS-7, AS-9).
export const SUBSCRIBER_SIGN_UP_FIELD_LIMIT = Object.freeze({
  BUSINESS_NAME_MAX_LENGTH: 80,
  BUSINESS_NAME_MIN_LENGTH: 2,
  BUSINESS_SLUG_MAX_LENGTH: 40,
  BUSINESS_SLUG_MIN_LENGTH: 3,
  PERSON_NAME_MAX_LENGTH: 60,
  PERSON_NAME_MIN_LENGTH: 2,
  PHONE_MAX_LENGTH: 20,
  PHONE_MIN_LENGTH: 7,
} as const);

export const SUBSCRIBER_SIGN_UP_PATTERN = Object.freeze({
  BUSINESS_SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  PHONE: /^[\d\s+-]+$/,
} as const);

// Answer of checkBusinessSlug (SPEC "Server functions").
export const BUSINESS_SLUG_AVAILABILITY = Object.freeze({
  AVAILABLE: "available",
  RESERVED: "reserved",
  TAKEN: "taken",
} as const);

export type BusinessSlugAvailability =
  (typeof BUSINESS_SLUG_AVAILABILITY)[keyof typeof BUSINESS_SLUG_AVAILABILITY];

// HttpsError details.reason of the sign-up functions. The client mirrors these
// values to choose a message (SPEC "Server functions").
export const SIGN_UP_ERROR_REASON = Object.freeze({
  ACCOUNT_EXISTS: "accountExists",
  LINK_EXPIRED: "linkExpired",
  LINK_INVALID: "linkInvalid",
  SLUG_RESERVED: "slugReserved",
  SLUG_TAKEN: "slugTaken",
} as const);

export type SignUpErrorReason =
  (typeof SIGN_UP_ERROR_REASON)[keyof typeof SIGN_UP_ERROR_REASON];

// Developer-facing messages sent with the HttpsError; the client maps the code
// and the reason to a translated key and never shows these.
export const SIGN_UP_ERROR = Object.freeze({
  ACCOUNT_EXISTS: "An account already exists for the checkout email",
  CLAIMS_NOT_SET: "The subscriber claims could not be set after sign-up",
  INVALID_PAYLOAD:
    "The sign-up payload is missing fields or breaks the field rules",
  LINK_EXPIRED: "The sign-up link has expired",
  LINK_INVALID: "The sign-up link is unknown or was already used",
  PLAN_NOT_FOUND: "The plan of the checkout does not exist",
  SLUG_RESERVED: "The business slug is reserved",
  SLUG_TAKEN: "The business slug is already taken",
} as const);

// Sign-up link of the KAN-24 email (plan-checkout SPEC "Data", AS-6). Only
// the hash of the token is stored on the PlanCheckout.
export const SIGN_UP_LINK = Object.freeze({
  HASH_ALGORITHM: "sha256",
  HASH_ENCODING: "hex",
  TOKEN_BYTE_LENGTH: 32,
  TOKEN_ENCODING: "base64url",
  VALID_MILLISECONDS: 7 * 24 * 60 * 60 * 1_000,
} as const);

export const PLAN_CHECKOUT_FIELD = Object.freeze({
  SIGN_UP_TOKEN_HASH: "signUpTokenHash",
} as const);

// Provisional until Payment is in domain-glossary (same value as the seed).
export const PAYMENT_RESULT = Object.freeze({
  SUCCEEDED: "succeeded",
} as const);
