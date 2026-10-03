import type { TransitionMap } from "../stateMachine";

export const BOOKING_STATUS = {
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  CONFIRMED: "confirmed",
  NO_SHOW: "no_show",
  PENDING: "pending",
} as const;

export type BookingStatus =
  (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const CANCELLATION_ACTOR = {
  BUSINESS: "business",
  CUSTOMER: "customer",
} as const;

export type CancellationActor =
  (typeof CANCELLATION_ACTOR)[keyof typeof CANCELLATION_ACTOR];

export const BOOKING_STATUS_TRANSITIONS: TransitionMap<BookingStatus> = {
  [BOOKING_STATUS.CANCELLED]: [],
  [BOOKING_STATUS.COMPLETED]: [],
  [BOOKING_STATUS.CONFIRMED]: [
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.NO_SHOW,
  ],
  [BOOKING_STATUS.NO_SHOW]: [],
  [BOOKING_STATUS.PENDING]: [
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.CONFIRMED,
  ],
};
