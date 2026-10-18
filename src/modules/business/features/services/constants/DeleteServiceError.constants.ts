// Mirror of functions/src/services/constants/DeleteServiceError.constants.ts — keep in sync.
export const DELETE_SERVICE_ERROR_REASON = Object.freeze({
  BUSINESS_NOT_ACTIVE: "business_not_active",
  HAS_ACTIVE_BOOKINGS: "has_active_bookings",
  MUST_BE_INACTIVE: "must_be_inactive",
} as const);

export type DeleteServiceErrorReason =
  (typeof DELETE_SERVICE_ERROR_REASON)[keyof typeof DELETE_SERVICE_ERROR_REASON];
