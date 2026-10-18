// Booking seed data for the test customer (KAN-150). Offsets are relative to
// the moment the seed runs, so "upcoming" and "past" stay true on every run.

export const SEED_BOOKING_ID = {
  CANCELLED_BY_BUSINESS_PAST: "seed-booking-cancelled-by-business-past",
  CANCELLED_BY_CUSTOMER_FUTURE: "seed-booking-cancelled-by-customer-future",
  COMPLETED: "seed-booking-completed",
  CONFIRMED_NEXT_WEEK: "seed-booking-confirmed-next-week",
  CONFIRMED_TOMORROW: "seed-booking-confirmed-tomorrow",
  NO_SHOW: "seed-booking-no-show",
  OTHER_CUSTOMER: "seed-booking-other-customer",
  PENDING_NEXT_MONTH: "seed-booking-pending-next-month",
  RESCHEDULED: "seed-booking-rescheduled",
} as const;

export const SEED_BOOKING_CUSTOMER_ID = "seed-customer-carla";

export const SEED_BOOKING_START_HOUR = 10;

export const SEED_BOOKING_TIME = {
  MS_PER_DAY: 86_400_000,
  MS_PER_MINUTE: 60_000,
} as const;

// Days from now to each booking's start; negative means in the past.
export const SEED_BOOKING_DAYS_FROM_NOW = {
  CANCELLED_BY_BUSINESS_PAST: -10,
  CANCELLED_BY_CUSTOMER_FUTURE: 3,
  COMPLETED: -14,
  CONFIRMED_NEXT_WEEK: 7,
  CONFIRMED_TOMORROW: 1,
  NO_SHOW: -30,
  OTHER_CUSTOMER: 2,
  PENDING_NEXT_MONTH: 30,
  RESCHEDULED: 5,
} as const;

export const SEED_BOOKING_RESCHEDULE_SHIFT_DAYS = 2;

export const SEED_CANCELLATION_NOTE =
  "Internal note: not shown to the customer";

export const SEED_OTHER_CUSTOMER = {
  CUSTOMER_ID: "seed-customer-other",
  USER_ID: "seed-customer-other-user",
} as const;
