import { BOOKING_STATUS, type BookingStatus } from "@/domain";

export const BOOKING_FIELD = {
  BUSINESS_ID: "businessId",
  CUSTOMER_USER_ID: "customerUserId",
  STARTS_AT: "startsAt",
  STATUS: "status",
} as const;

export const BUSINESS_FIELD = {
  SLUG: "slug",
} as const;

// Upcoming = still to be served and in the future; the rest is history (AS-3).
export const CLOSED_BOOKING_STATUSES: readonly BookingStatus[] = [
  BOOKING_STATUS.CANCELLED,
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.NO_SHOW,
];

// Used for the price of a business that has no currency saved. Where the
// currency of a business comes from is still to be defined by the team.
export const DEFAULT_BUSINESS_CURRENCY = "MXN";

export const MY_BOOKINGS_QUERY_PARAM = {
  TAB: "tab",
} as const;

export const MY_BOOKINGS_TAB = {
  HISTORY: "history",
  UPCOMING: "upcoming",
} as const;

export type MyBookingsTab =
  (typeof MY_BOOKINGS_TAB)[keyof typeof MY_BOOKINGS_TAB];

export const NO_BUSINESS_ID = "";

// A signed-out session has no user id; the list query stays disabled.
export const NO_CUSTOMER_USER_ID = "";

export const OPEN_BOOKING_STATUSES: readonly BookingStatus[] = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.PENDING,
];
