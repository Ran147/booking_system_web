import { TONE, type Tone } from "@/shared/constants";
import { BOOKING_STATUS, type BookingStatus } from "./BookingStatus.constants";

export const BOOKING_STATUS_TONE = {
  [BOOKING_STATUS.CANCELLED]: TONE.DANGER,
  [BOOKING_STATUS.COMPLETED]: TONE.NEUTRAL,
  [BOOKING_STATUS.CONFIRMED]: TONE.SUCCESS,
  [BOOKING_STATUS.NO_SHOW]: TONE.DANGER,
  [BOOKING_STATUS.PENDING]: TONE.WARNING,
} as const satisfies Record<BookingStatus, Tone>;
