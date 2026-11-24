import type {
  AvailabilityCollaborator,
  AvailabilityStoredBooking,
} from "./models/AvailabilityData.model.js";
import { BOOKING_STATUS } from "../../shared/constants/BookingStatus.constants.js";
import type { Nullable } from "../../shared/types/Nullable.js";
import { formatZonedDate } from "../../shared/zonedTime.js";

const OPEN_BOOKING_STATUSES: readonly string[] = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.PENDING,
];

interface SelectCollaboratorOptions {
  readonly bookings: readonly AvailabilityStoredBooking[];
  readonly collaborators: readonly AvailabilityCollaborator[];
  /** Local day of the booking, `YYYY-MM-DD`, in the business time zone. */
  readonly date: string;
  readonly freeCollaboratorIds: readonly Nullable<string>[];
  readonly timeZone: string;
}

/**
 * Automatic assignment (AS-9, AC-KAN-144-08): among the free collaborators,
 * the one with the fewest open bookings that day; ties go to the first by
 * name. Returns `null` when nobody is free.
 */
export const selectCollaborator = ({
  bookings,
  collaborators,
  date,
  freeCollaboratorIds,
  timeZone,
}: SelectCollaboratorOptions): Nullable<AvailabilityCollaborator> => {
  const countBookingsOfDay = (collaboratorId: string): number =>
    bookings.filter(
      (booking) =>
        booking.collaboratorId === collaboratorId &&
        OPEN_BOOKING_STATUSES.includes(booking.status) &&
        formatZonedDate(booking.startsAt, timeZone) === date,
    ).length;

  const [selectedCollaborator = null] = collaborators
    .filter((collaborator) => freeCollaboratorIds.includes(collaborator.id))
    .map((collaborator) => ({
      bookingsOfDay: countBookingsOfDay(collaborator.id),
      collaborator,
    }))
    .sort(
      (first, second) =>
        first.bookingsOfDay - second.bookingsOfDay ||
        first.collaborator.fullName.localeCompare(second.collaborator.fullName),
    )
    .map(({ collaborator }) => collaborator);

  return selectedCollaborator;
};
