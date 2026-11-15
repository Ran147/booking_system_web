import type { AvailabilityStoredBooking } from "./models/AvailabilityData.model.js";
import { BOOKING_STATUS } from "../../shared/constants/BookingStatus.constants.js";

const OPEN_BOOKING_STATUSES: readonly string[] = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.PENDING,
];

interface TimeRange {
  readonly endsAt: Date;
  readonly startsAt: Date;
}

/**
 * Whether the customer already holds an open booking in the business that
 * overlaps the range (AC-KAN-144-06). `createBooking` rejects such a booking,
 * so `getAvailability` must not offer that slot to the same customer.
 */
export const overlapsOwnOpenBooking = (
  bookings: readonly AvailabilityStoredBooking[],
  customerUserId: string,
  range: TimeRange,
): boolean =>
  bookings.some(
    (booking) =>
      booking.customerUserId === customerUserId &&
      OPEN_BOOKING_STATUSES.includes(booking.status) &&
      booking.startsAt.getTime() < range.endsAt.getTime() &&
      range.startsAt.getTime() < booking.endsAt.getTime(),
  );
