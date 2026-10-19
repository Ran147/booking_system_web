// Mirror of src/domain/booking/BookingStatus.constants.ts — keep in sync.
export const BOOKING_STATUS = Object.freeze({
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  CONFIRMED: "confirmed",
  NO_SHOW: "no_show",
  PENDING: "pending",
} as const);

export type BookingStatus =
  (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];
