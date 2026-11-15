export const AGENDA_LOCALE = Object.freeze({
  DAY_NUMBER: "en-US",
  ISO_DATE: "en-CA",
} as const);

export const AGENDA_SEPARATOR = Object.freeze({
  DATE_RANGE: " – ",
  TIME_RANGE: " - ",
} as const);

export const BOOKING_CONFIRMATION_MODE = Object.freeze({
  AUTOMATIC: "automatic",
  MANUAL: "manual",
} as const);

export type BookingConfirmationMode =
  (typeof BOOKING_CONFIRMATION_MODE)[keyof typeof BOOKING_CONFIRMATION_MODE];

export const BUSINESS_HOURS_DEFAULT_RANGE = Object.freeze({
  INITIAL_CLOSES_AT: "17:00",
  INITIAL_OPENS_AT: "09:00",
  SECOND_SHIFT_CLOSES_AT: "19:00",
  SECOND_SHIFT_OPENS_AT: "14:00",
} as const);

export const BUSINESS_HOURS_FIELD = Object.freeze({
  CLOSES_AT: "closesAt",
  OPENS_AT: "opensAt",
} as const);

export type BusinessHoursField =
  (typeof BUSINESS_HOURS_FIELD)[keyof typeof BUSINESS_HOURS_FIELD];

export const DAYS_OF_WEEK = Object.freeze([
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const);

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const DAY_OF_WEEK_BY_INDEX = Object.freeze([
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const);

export const SCHEDULE_BLOCK_DEFAULT_TIME = Object.freeze({
  DEFAULT_END_TIME: "13:00",
  DEFAULT_START_TIME: "12:00",
  FALLBACK_END_TIME: "10:00",
  FALLBACK_START_TIME: "09:00",
} as const);

export const SCHEDULE_BOOKING_ERROR_CODE = Object.freeze({
  BUSINESS_UNAVAILABLE: "business_unavailable",
  CANNOT_RESCHEDULE: "cannot_reschedule",
  CANNOT_RESCHEDULE_PAST: "cannot_reschedule_past",
  CUSTOMER_BLOCKED: "customer_blocked",
  INVALID_TRANSITION: "invalid_transition",
  SERVICE_UNAVAILABLE: "service_unavailable",
  SLOT_IN_PAST: "slot_in_past",
  SLOT_TAKEN: "slot_taken",
} as const);

export const SCHEDULE_CONSTANTS = Object.freeze({
  ALL_FILTER_VALUE: "all",
  CANCELLATION_NOTE_MAX_LENGTH: 500,
  DAYS_IN_WEEK: 7,
  DEFAULT_APP_TIME_ZONE: "America/Costa_Rica",
  DEFAULT_BOOKING_TIME: "10:00",
  DEFAULT_RESCHEDULE_HOUR: 10,
  DEFAULT_SLOT_DURATION_MINUTES: 30,
  END_OF_DAY_HOURS: 23,
  END_OF_DAY_MINUTES: 59,
  END_OF_DAY_MS: 999,
  END_OF_DAY_SECONDS: 59,
  HISTORY_DEFAULT_DAYS_RANGE: 30,
  ISO_DATE_LOCALE: "en-CA",
  LEGACY_TIME_ZONE_SUBSTRING: "Mexico",
  MAX_HISTORY_FETCH_LIMIT: 100,
  MAX_HOURS_RANGES_PER_DAY: 2,
  MAX_REASON_LENGTH: 200,
  NOTE_MAX_LENGTH: 500,
  SECONDS_SUFFIX: ":00",
  TWO_DIGIT_PAD: 2,
  UTC_TIME_ZONE: "UTC",
  ZERO_PAD_CHAR: "0",
} as const);

export const SCHEDULE_FORM_INPUT_TYPE = Object.freeze({
  DATE: "date",
  SUBMIT: "submit",
  TIME: "time",
} as const);

export const SCHEDULE_TAB = Object.freeze({
  AGENDA: "agenda",
  BOOKINGS: "bookings",
  HISTORY: "history",
  HOURS: "hours",
} as const);

export type ScheduleTab = (typeof SCHEDULE_TAB)[keyof typeof SCHEDULE_TAB];

export const SCHEDULE_VIEW_MODE = Object.freeze({
  DAY: "day",
  WEEK: "week",
} as const);

export type ScheduleViewMode =
  (typeof SCHEDULE_VIEW_MODE)[keyof typeof SCHEDULE_VIEW_MODE];
