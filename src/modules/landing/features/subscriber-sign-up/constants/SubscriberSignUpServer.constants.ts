// Mirror of BUSINESS_SLUG_AVAILABILITY and SIGN_UP_ERROR_REASON in
// functions/src/billing/constants/SubscriberSignUp.constants.ts — keep in sync
// (SPEC "Server functions").
export const BUSINESS_SLUG_AVAILABILITY = {
  AVAILABLE: "available",
  RESERVED: "reserved",
  TAKEN: "taken",
} as const;

export type BusinessSlugAvailability =
  (typeof BUSINESS_SLUG_AVAILABILITY)[keyof typeof BUSINESS_SLUG_AVAILABILITY];

export const SIGN_UP_ERROR_REASON = {
  ACCOUNT_EXISTS: "accountExists",
  LINK_EXPIRED: "linkExpired",
  LINK_INVALID: "linkInvalid",
  SLUG_RESERVED: "slugReserved",
  SLUG_TAKEN: "slugTaken",
} as const;

export type SignUpErrorReason =
  (typeof SIGN_UP_ERROR_REASON)[keyof typeof SIGN_UP_ERROR_REASON];

// Plan.billingPeriod values (KAN-180 spec), as the plan catalog shows them.
export const SIGN_UP_BILLING_PERIOD = {
  ANNUAL: "annual",
  MONTHLY: "monthly",
} as const;

// Same currency as the plan catalog (PLAN_CATALOG_CONSTANTS.CURRENCY), so the
// paid price reads the same as the price the visitor chose.
export const SIGN_UP_PLAN_CURRENCY = "USD";

// The sign-up link arrives as /sign-up?token=<token> (KAN-24 email).
export const SIGN_UP_TOKEN_SEARCH_PARAM = "token";
