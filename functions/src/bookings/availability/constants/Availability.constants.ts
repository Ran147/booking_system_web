// Slot grid and booking window of the availability engine (spec KAN-139,
// D-3). Kept as constants so the business can change them in one place.
export const AVAILABILITY = Object.freeze({
  BOOKING_WINDOW_DAYS: 60,
  MINUTES_PER_HOUR: 60,
  MS_PER_HOUR: 3_600_000,
  MS_PER_MINUTE: 60_000,
  // Bookings and blocks are read this far before and after the requested
  // start, enough to cover the whole local day and a booking that started
  // the day before.
  READ_WINDOW_HOURS: 48,
  SLOT_INTERVAL_MINUTES: 30,
  TIME_TEXT_DIGITS: 2,
} as const);

// Day-of-week key used by `businessHours`, indexed by the number that
// `Date.getUTCDay()` returns (0 is Sunday).
export const WEEKDAY_NAME_BY_UTC_DAY = Object.freeze({
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
} as const);
