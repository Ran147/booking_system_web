import type {
  DocumentData,
  DocumentReference,
  Transaction,
} from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import { BOOKING_STATUS } from "../../shared/constants/BookingStatus.constants.js";
import type { Nullable } from "../../shared/types/Nullable.js";
import { formatZonedDate } from "../../shared/zonedTime.js";
import { buildAvailabilityResources } from "../availability/buildAvailabilityResources.js";
import { computeFreeSlots } from "../availability/computeFreeSlots.js";
import { AVAILABILITY } from "../availability/constants/Availability.constants.js";
import type { AvailabilityBusinessHours } from "../availability/models/Availability.model.js";
import { readAvailabilityData } from "../availability/readAvailabilityData.js";
import { selectCollaborator } from "../availability/selectCollaborator.js";
import {
  CREATE_BOOKING_ERROR,
  CREATE_BOOKING_ERROR_REASON,
} from "../constants/CreateBookingError.constants.js";

interface ResolveBookingResourceOptions {
  readonly businessHours: AvailabilityBusinessHours;
  readonly businessReference: DocumentReference<DocumentData>;
  readonly chosenCollaboratorId: Nullable<string>;
  readonly customerUserId: string;
  readonly durationMinutes: number;
  readonly now: Date;
  readonly serviceId: string;
  readonly startsAt: Date;
  readonly timeZone: string;
  readonly transaction: Transaction;
}

export interface BookingResource {
  readonly collaboratorId: Nullable<string>;
  readonly collaboratorName: Nullable<string>;
}

const OPEN_BOOKING_STATUSES: readonly string[] = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.PENDING,
];

const slotTakenError = (): HttpsError =>
  new HttpsError("failed-precondition", CREATE_BOOKING_ERROR.SLOT_TAKEN, {
    reason: CREATE_BOOKING_ERROR_REASON.SLOT_TAKEN,
  });

/**
 * Re-checks the requested start inside the booking transaction (KAN-144) and
 * returns who serves it. The same engine as the availability screen decides,
 * so a slot the customer saw can only fail when something changed since: a
 * new booking or block, other business hours, or the start is now past.
 *
 * Throws `slotTakenError` when the start is not a free slot, or when the
 * chosen collaborator is not free; it never switches to another collaborator
 * (AC-KAN-144-09).
 */
export const resolveBookingResource = async ({
  businessHours,
  businessReference,
  chosenCollaboratorId,
  customerUserId,
  durationMinutes,
  now,
  serviceId,
  startsAt,
  timeZone,
  transaction,
}: ResolveBookingResourceOptions): Promise<BookingResource> => {
  const readWindowMs =
    AVAILABILITY.READ_WINDOW_HOURS * AVAILABILITY.MS_PER_HOUR;
  const availabilityData = await readAvailabilityData({
    businessReference,
    readQuery: (query) => transaction.get(query),
    serviceId,
    window: {
      from: new Date(startsAt.getTime() - readWindowMs),
      to: new Date(startsAt.getTime() + readWindowMs),
    },
  });
  // A double click must not create a second booking with another free
  // collaborator (AC-KAN-144-06): the customer cannot hold two open bookings
  // that overlap in the same business.
  const endsAt = new Date(
    startsAt.getTime() + durationMinutes * AVAILABILITY.MS_PER_MINUTE,
  );
  const hasOverlappingOwnBooking = availabilityData.bookings.some(
    (booking) =>
      booking.customerUserId === customerUserId &&
      OPEN_BOOKING_STATUSES.includes(booking.status) &&
      booking.startsAt.getTime() < endsAt.getTime() &&
      startsAt.getTime() < booking.endsAt.getTime(),
  );
  if (hasOverlappingOwnBooking) {
    throw slotTakenError();
  }

  const date = formatZonedDate(startsAt, timeZone);
  const { businessBlocks, resources } = buildAvailabilityResources(
    availabilityData,
    chosenCollaboratorId,
  );
  const requestedSlot = computeFreeSlots({
    businessBlocks,
    businessHours,
    date,
    durationMinutes,
    now,
    resources,
    timeZone,
  }).find((slot) => slot.startsAt.getTime() === startsAt.getTime());

  if (!requestedSlot) {
    throw slotTakenError();
  }
  if (requestedSlot.freeResourceIds.includes(null)) {
    return { collaboratorId: null, collaboratorName: null };
  }

  const selectedCollaborator = selectCollaborator({
    bookings: availabilityData.bookings,
    collaborators: availabilityData.activeCollaborators,
    date,
    freeCollaboratorIds: requestedSlot.freeResourceIds,
    timeZone,
  });
  if (!selectedCollaborator) {
    throw slotTakenError();
  }

  return {
    collaboratorId: selectedCollaborator.id,
    collaboratorName: selectedCollaborator.fullName,
  };
};
