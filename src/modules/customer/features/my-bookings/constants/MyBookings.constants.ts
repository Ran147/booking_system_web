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

// Most recent bookings read to find the businesses the customer booked at
// (the business filter options); Firestore has no distinct query.
export const BUSINESS_FILTER_SAMPLE_SIZE = 100;

// Upcoming = still to be served and in the future; the rest is history (AS-3).
export const CLOSED_BOOKING_STATUSES: readonly BookingStatus[] = [
  BOOKING_STATUS.CANCELLED,
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.NO_SHOW,
];

export const DATE_FILTER_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DEFAULT_BUSINESS_CURRENCY = "CRC";

export const MY_BOOKINGS_QUERY_PARAM = {
  BUSINESS: "business",
  FROM: "from",
  STATUS: "status",
  TAB: "tab",
  TO: "to",
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

// The status options each list offers: those that can appear in it (AC-KAN-154-01).
export const STATUS_FILTER_OPTIONS: Readonly<
  Record<MyBookingsTab, readonly BookingStatus[]>
> = {
  [MY_BOOKINGS_TAB.HISTORY]: [
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.CONFIRMED,
    BOOKING_STATUS.NO_SHOW,
    BOOKING_STATUS.PENDING,
  ],
  [MY_BOOKINGS_TAB.UPCOMING]: OPEN_BOOKING_STATUSES,
};

export const TIME_ZONE_OFFSET = {
  MS_PER_DAY: 86_400_000,
  MS_PER_SECOND: 1000,
  ONE_MS: 1,
} as const;
