// Booking window and week strip of the availability step (spec KAN-139 PR 5).
export const AVAILABILITY = Object.freeze({
  // AS-1: 60 days ahead, counted in the business time zone. Same value as the
  // server (functions/src/bookings/availability/constants).
  BOOKING_WINDOW_DAYS: 60,
  DAYS_PER_WEEK: 7,
  QUERY_KEY_ROOT: "availability",
} as const);

// `details.reason` the getAvailability callable sends with an error.
export const AVAILABILITY_ERROR_REASON = Object.freeze({
  BUSINESS_UNAVAILABLE: "business_unavailable",
  COLLABORATOR_UNAVAILABLE: "collaborator_unavailable",
  DATE_OUT_OF_WINDOW: "date_out_of_window",
  NO_COLLABORATOR: "no_collaborator",
  NOT_CONFIGURED: "not_configured",
  SERVICE_UNAVAILABLE: "service_unavailable",
} as const);

export type AvailabilityErrorReason =
  (typeof AVAILABILITY_ERROR_REASON)[keyof typeof AVAILABILITY_ERROR_REASON];

// What the screen offers next to an error message (spec P5-5).
export const AVAILABILITY_ERROR_ACTION = Object.freeze({
  BACK_TO_SERVICES: "back_to_services",
  NONE: "none",
  RETRY: "retry",
} as const);

export type AvailabilityErrorAction =
  (typeof AVAILABILITY_ERROR_ACTION)[keyof typeof AVAILABILITY_ERROR_ACTION];

export const AVAILABILITY_SEARCH_PARAM = Object.freeze({
  COLLABORATOR_ID: "collaboratorId",
  DATE: "date",
  STARTS_AT: "startsAt",
} as const);

// Days of the week in the order of Date.getUTCDay(), as keys of businessHours.
export const WEEKDAY_BY_UTC_DAY = Object.freeze([
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const);
