export const BOOKING_CONFIRMATION_MODE = Object.freeze({
  AUTOMATIC: "automatic",
  MANUAL: "manual",
} as const);

export type BookingConfirmationMode =
  (typeof BOOKING_CONFIRMATION_MODE)[keyof typeof BOOKING_CONFIRMATION_MODE];

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

export const SCHEDULE_CONSTANTS = Object.freeze({
  ALL_FILTER_VALUE: "all",
  CANCELLATION_NOTE_MAX_LENGTH: 500,
  DAYS_IN_WEEK: 7,
  DEFAULT_SLOT_DURATION_MINUTES: 30,
  END_OF_DAY_HOURS: 23,
  END_OF_DAY_MINUTES: 59,
  END_OF_DAY_MS: 999,
  END_OF_DAY_SECONDS: 59,
  HISTORY_DEFAULT_DAYS_RANGE: 30,
  MAX_HOURS_RANGES_PER_DAY: 2,
  MAX_REASON_LENGTH: 200,
  NOTE_MAX_LENGTH: 500,
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
