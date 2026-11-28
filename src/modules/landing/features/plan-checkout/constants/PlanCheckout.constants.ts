// How a two-digit expiry (MM/AA) is read.
export const CARD_EXPIRY = Object.freeze({
  CENTURY_START_YEAR: 2000,
  MONTH_GROUP_INDEX: 1,
  MONTHS_PER_YEAR: 12,
  YEAR_GROUP_INDEX: 2,
} as const);

// Same rules as the payPlanCheckout schema of api/callFunction.ts, so nothing
// the form accepts comes back as invalid-argument (AC-KAN-22-05).
export const CHECKOUT_FIELD_LIMIT = Object.freeze({
  CARDHOLDER_NAME_MAX_LENGTH: 60,
  CARDHOLDER_NAME_MIN_LENGTH: 2,
  EMAIL_MAX_LENGTH: 254,
} as const);

export const CHECKOUT_FIELD_PATTERN = Object.freeze({
  CARD_CVC: /^\d{3,4}$/,
  CARD_EXPIRY: /^(0[1-9]|1[0-2])\/(\d{2})$/,
  CARD_NUMBER: /^\d{16}$/,
  WHITESPACE: /\s/g,
} as const);

// Mirror of PLAN_CHECKOUT_ERROR_REASON in api/callFunction.ts — keep in sync.
// The server sends it in details.reason with a failed-precondition error.
export const PLAN_CHECKOUT_ERROR_REASON = Object.freeze({
  ATTEMPT_REUSED: "attemptReused",
  PAYMENT_DECLINED: "paymentDeclined",
  PLAN_UNAVAILABLE: "planUnavailable",
  PRICE_CHANGED: "priceChanged",
} as const);

export type PlanCheckoutErrorReason =
  (typeof PLAN_CHECKOUT_ERROR_REASON)[keyof typeof PLAN_CHECKOUT_ERROR_REASON];

// Keys of the landing namespace the checkout form shows on a field.
export const PLAN_CHECKOUT_MESSAGE_KEY = Object.freeze({
  CARD_INVALID: "planCheckout.payment.cardInvalid",
  TERMS_REQUIRED: "planCheckout.checkout.termsRequired",
} as const);

export type PlanCheckoutMessageKey =
  (typeof PLAN_CHECKOUT_MESSAGE_KEY)[keyof typeof PLAN_CHECKOUT_MESSAGE_KEY];
