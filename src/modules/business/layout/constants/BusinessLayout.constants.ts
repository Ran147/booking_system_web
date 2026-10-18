export const BUSINESS_LAYOUT_CONSTANTS = Object.freeze({
  CURRENT_DOCUMENT_ID: "current",
  EXPIRY_WARNING: Object.freeze({
    MAX_DAYS: 7,
    MIN_DAYS: 0,
  }),
  EXPIRY_WARNING_TYPE: Object.freeze({
    ACTIVE_ENDING_SOON: "active_ending_soon",
    PAST_DUE: "past_due",
  }),
});

export type ExpiryWarningType =
  (typeof BUSINESS_LAYOUT_CONSTANTS.EXPIRY_WARNING_TYPE)[keyof typeof BUSINESS_LAYOUT_CONSTANTS.EXPIRY_WARNING_TYPE];
