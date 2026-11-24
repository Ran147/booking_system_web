// Business.bookingConfirmationMode (KAN-70): with `manual` a new booking waits
// for the business as `pending`; with `automatic` (the default) it is
// `confirmed` at once. Mirror of BOOKING_CONFIRMATION_MODE in
// api/callFunction.ts — keep in sync.
export const BOOKING_CONFIRMATION_MODE = Object.freeze({
  AUTOMATIC: "automatic",
  MANUAL: "manual",
} as const);
