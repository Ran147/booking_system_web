// `details.reason` the createBooking callable sends with an error.
export const CHECKOUT_ERROR_REASON = Object.freeze({
  CUSTOMER_BLOCKED: "customer_blocked",
  SERVICE_CHANGED: "service_changed",
  SERVICE_UNAVAILABLE: "service_unavailable",
  SLOT_TAKEN: "slot_taken",
} as const);

// What the summary offers next to a confirmation error (spec KAN-145, C-5).
export const CHECKOUT_ERROR_ACTION = Object.freeze({
  CHOOSE_ANOTHER_TIME: "choose_another_time",
  NONE: "none",
  RELOAD_SUMMARY: "reload_summary",
} as const);

export type CheckoutErrorAction =
  (typeof CHECKOUT_ERROR_ACTION)[keyof typeof CHECKOUT_ERROR_ACTION];

export const CHECKOUT_SEARCH_PARAM = Object.freeze({
  COLLABORATOR_ID: "collaboratorId",
  DATE: "date",
  STARTS_AT: "startsAt",
} as const);

export const DISCOUNT_TYPE = Object.freeze({
  FIXED_AMOUNT: "fixed_amount",
  PERCENTAGE: "percentage",
} as const);

export const PERCENTAGE_BASE = 100;
