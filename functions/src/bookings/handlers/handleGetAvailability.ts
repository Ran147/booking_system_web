import { CallableFailure } from "../../shared/CallableFailure.js";
import { BUSINESS_STATUS } from "../../shared/constants/BusinessStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { SERVICE_STATUS } from "../../shared/constants/ServiceStatus.constants.js";
import { USER_ROLE } from "../../shared/constants/UserRole.constants.js";
import type { CallableHandlerInput } from "../../shared/models/CallableHandler.model.js";
import { parseCallablePayload } from "../../shared/parseCallablePayload.js";
import {
  addCalendarDays,
  formatZonedDate,
  resolveZonedInstant,
} from "../../shared/zonedTime.js";
import { buildAvailabilityResources } from "../availability/buildAvailabilityResources.js";
import { computeFreeSlots } from "../availability/computeFreeSlots.js";
import { AVAILABILITY } from "../availability/constants/Availability.constants.js";
import type {
  AvailabilityBusinessHours,
  AvailabilityTimeRange,
} from "../availability/models/Availability.model.js";
import { overlapsOwnOpenBooking } from "../availability/overlapsOwnOpenBooking.js";
import { readAvailabilityData } from "../availability/readAvailabilityData.js";
import {
  GET_AVAILABILITY_ERROR,
  GET_AVAILABILITY_ERROR_REASON,
} from "../constants/GetAvailabilityError.constants.js";
import type { GetAvailabilityResponse } from "../models/GetAvailability.query.js";
import { getAvailabilityPayloadSchema } from "../models/GetAvailability.schema.js";

const MIDDAY = "12:00";

const failedPrecondition = (message: string, reason: string): CallableFailure =>
  new CallableFailure("failed-precondition", message, { reason });

const hasAnyOpeningRange = (
  businessHours: AvailabilityBusinessHours,
): boolean =>
  Object.values(businessHours).some(
    (ranges: unknown) =>
      Array.isArray(ranges) && (ranges as AvailabilityTimeRange[]).length > 0,
  );

/**
 * Free slots of one service on one local day (KAN-140 to KAN-143). Only a
 * signed-in customer may ask (AS-8). It returns start and end of each free
 * slot and never who would serve it (AC-KAN-142-02). The same engine runs
 * again inside `createBooking` before a booking is written (KAN-144).
 *
 * Shared by the `getAvailability` callable and the Vercel dispatcher (Q8).
 */
export const handleGetAvailability = async ({
  caller,
  payload,
  firestore,
  now,
}: CallableHandlerInput): Promise<GetAvailabilityResponse> => {
  if (!caller) {
    throw new CallableFailure(
      "unauthenticated",
      GET_AVAILABILITY_ERROR.UNAUTHENTICATED,
    );
  }
  if (caller.role !== USER_ROLE.CUSTOMER && caller.role !== USER_ROLE.CLIENT) {
    throw new CallableFailure(
      "permission-denied",
      GET_AVAILABILITY_ERROR.PERMISSION_DENIED,
    );
  }

  const { businessId, collaboratorId, date, serviceId } = parseCallablePayload(
    getAvailabilityPayloadSchema,
    payload,
    GET_AVAILABILITY_ERROR.INVALID_PAYLOAD,
  );

  const businessReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(businessId);
  const [businessSnapshot, serviceSnapshot] = await Promise.all([
    businessReference.get(),
    businessReference
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(serviceId)
      .get(),
  ]);

  if (businessSnapshot.get("status") !== BUSINESS_STATUS.ACTIVE) {
    throw failedPrecondition(
      GET_AVAILABILITY_ERROR.BUSINESS_UNAVAILABLE,
      GET_AVAILABILITY_ERROR_REASON.BUSINESS_UNAVAILABLE,
    );
  }
  if (serviceSnapshot.get("status") !== SERVICE_STATUS.ACTIVE) {
    throw failedPrecondition(
      GET_AVAILABILITY_ERROR.SERVICE_UNAVAILABLE,
      GET_AVAILABILITY_ERROR_REASON.SERVICE_UNAVAILABLE,
    );
  }

  const businessHours = (businessSnapshot.get("businessHours") ??
    {}) as AvailabilityBusinessHours;
  if (!hasAnyOpeningRange(businessHours)) {
    throw failedPrecondition(
      GET_AVAILABILITY_ERROR.NOT_CONFIGURED,
      GET_AVAILABILITY_ERROR_REASON.NOT_CONFIGURED,
    );
  }

  const timeZone: string = businessSnapshot.get("timeZone") ?? "UTC";
  const middayOfDate = resolveZonedInstant(date, MIDDAY, timeZone);
  // A day that does not exist, like 2026-11-31, rolls over to another day.
  if (!middayOfDate || formatZonedDate(middayOfDate, timeZone) !== date) {
    throw new CallableFailure(
      "invalid-argument",
      GET_AVAILABILITY_ERROR.INVALID_PAYLOAD,
    );
  }
  const today = formatZonedDate(now, timeZone);
  // Calendar days, not 24-hour periods: a daylight-saving change must not
  // move the last bookable day.
  const lastBookableDay = addCalendarDays(
    today,
    AVAILABILITY.BOOKING_WINDOW_DAYS,
  );
  if (date < today || date > lastBookableDay) {
    throw new CallableFailure(
      "invalid-argument",
      GET_AVAILABILITY_ERROR.INVALID_PAYLOAD,
      { reason: GET_AVAILABILITY_ERROR_REASON.DATE_OUT_OF_WINDOW },
    );
  }

  const readWindowMs =
    AVAILABILITY.READ_WINDOW_HOURS * AVAILABILITY.MS_PER_HOUR;
  const availabilityData = await readAvailabilityData({
    businessReference,
    readQuery: (query) => query.get(),
    serviceId,
    window: {
      from: new Date(middayOfDate.getTime() - readWindowMs),
      to: new Date(middayOfDate.getTime() + readWindowMs),
    },
  });

  if (
    collaboratorId &&
    !availabilityData.activeCollaborators.some(
      (collaborator) => collaborator.id === collaboratorId,
    )
  ) {
    throw failedPrecondition(
      GET_AVAILABILITY_ERROR.COLLABORATOR_UNAVAILABLE,
      GET_AVAILABILITY_ERROR_REASON.COLLABORATOR_UNAVAILABLE,
    );
  }
  if (
    availabilityData.hasAssignedCollaborators &&
    availabilityData.activeCollaborators.length === 0
  ) {
    throw failedPrecondition(
      GET_AVAILABILITY_ERROR.NO_COLLABORATOR,
      GET_AVAILABILITY_ERROR_REASON.NO_COLLABORATOR,
    );
  }

  const { businessBlocks, resources } = buildAvailabilityResources(
    availabilityData,
    collaboratorId ?? null,
  );
  const slots = computeFreeSlots({
    businessBlocks,
    businessHours,
    date,
    durationMinutes: Number(serviceSnapshot.get("durationMinutes")),
    now,
    resources,
    timeZone,
  });

  // The customer cannot book a slot that overlaps one of their own open
  // bookings (AC-KAN-144-06), so it is not offered either.
  const bookableSlots = slots.filter(
    (slot) =>
      !overlapsOwnOpenBooking(availabilityData.bookings, caller.uid, slot),
  );

  return {
    date,
    slots: bookableSlots.map((slot) => ({
      endsAt: slot.endsAt.toISOString(),
      startsAt: slot.startsAt.toISOString(),
    })),
    timeZone,
  };
};
