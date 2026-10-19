// Developer-facing messages; the client maps the code, never shows these.
export const DELETE_SERVICE_ERROR = Object.freeze({
  BUSINESS_NOT_ACTIVE: "The business is not active",
  HAS_ACTIVE_BOOKINGS: "The service has pending or confirmed bookings",
  INVALID_PAYLOAD: "businessId and serviceId are required strings",
  MUST_BE_INACTIVE: "Only inactive services can be deleted",
  NOT_FOUND: "The service does not exist",
} as const);

export const DELETE_SERVICE_ERROR_REASON = Object.freeze({
  BUSINESS_NOT_ACTIVE: "business_not_active",
  HAS_ACTIVE_BOOKINGS: "has_active_bookings",
  MUST_BE_INACTIVE: "must_be_inactive",
} as const);
