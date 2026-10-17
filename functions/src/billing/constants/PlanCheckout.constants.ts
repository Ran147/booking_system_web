// Constants of payPlanCheckout (KAN-22 spec, docs/specs/
// 2026-10-17-US-KAN-22-pago-del-plan.md). The checkout form mirrors the field
// rules and the error reasons in the checkout page PR.

// Developer-facing messages sent with the HttpsError; the client maps the code
// and the reason to a translated key and never shows these.
export const PLAN_CHECKOUT_ERROR = Object.freeze({
  INVALID_PAYLOAD:
    "The checkout payload is missing fields or breaks the field rules",
  PAYMENT_DECLINED: "The simulated gateway declined the card",
  PLAN_UNAVAILABLE: "The plan does not exist or is not active",
  PRICE_CHANGED: "The plan price changed after the checkout opened",
} as const);

// HttpsError details.reason of payPlanCheckout (spec §3.6).
export const PLAN_CHECKOUT_ERROR_REASON = Object.freeze({
  PAYMENT_DECLINED: "paymentDeclined",
  PLAN_UNAVAILABLE: "planUnavailable",
  PRICE_CHANGED: "priceChanged",
} as const);

export type PlanCheckoutErrorReason =
  (typeof PLAN_CHECKOUT_ERROR_REASON)[keyof typeof PLAN_CHECKOUT_ERROR_REASON];

// Simulated payment form (SPEC AS-9).
export const PLAN_CHECKOUT_FIELD_LIMIT = Object.freeze({
  CARDHOLDER_NAME_MAX_LENGTH: 60,
  CARDHOLDER_NAME_MIN_LENGTH: 2,
  EMAIL_MAX_LENGTH: 254,
} as const);

export const PLAN_CHECKOUT_PATTERN = Object.freeze({
  CARD_CVC: /^\d{3,4}$/,
  CARD_EXPIRY: /^(0[1-9]|1[0-2])\/(\d{2})$/,
  CARD_NUMBER: /^\d{16}$/,
  WHITESPACE: /\s/g,
} as const);

// Card expiry "MM/AA": the two-digit year belongs to this century, and the
// card works until the last day of its month.
export const CARD_EXPIRY = Object.freeze({
  CENTURY_START_YEAR: 2000,
  MONTH_GROUP_INDEX: 1,
  MONTHS_PER_YEAR: 12,
  YEAR_GROUP_INDEX: 2,
} as const);

// The gateway only fakes a success or a failure (Q5, spec D2): one test card
// is declined, every other valid card is approved.
export const SIMULATED_GATEWAY = Object.freeze({
  DECLINED_CARD_NUMBER: "4000000000000002",
  PAYMENT_REFERENCE_BYTE_LENGTH: 12,
  PAYMENT_REFERENCE_ENCODING: "hex",
  PAYMENT_REFERENCE_PREFIX: "sim_",
} as const);

// Provisional until the KAN-9 terms page exists (SPEC AS-10, spec D4): then
// the version is the last-updated date shown on that page.
export const TERMS_VERSION = Object.freeze({
  PROVISIONAL: "provisional-2026-10-17",
} as const);
