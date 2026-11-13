import { HttpsError, onCall } from "firebase-functions/v2/https";
import { buildAvailabilityResources } from "./availability/buildAvailabilityResources.js";
import { computeFreeSlots } from "./availability/computeFreeSlots.js";
import { AVAILABILITY } from "./availability/constants/Availability.constants.js";
import type {
  AvailabilityBusinessHours,
  AvailabilityTimeRange,
} from "./availability/models/Availability.model.js";
import { readAvailabilityData } from "./availability/readAvailabilityData.js";
import {
  GET_AVAILABILITY_ERROR,
  GET_AVAILABILITY_ERROR_REASON,
} from "./constants/GetAvailabilityError.constants.js";
import type {
  GetAvailabilityPayload,
  GetAvailabilityResponse,
} from "./models/GetAvailability.query.js";
import { getAvailabilityPayloadSchema } from "./models/GetAvailability.schema.js";
import { BUSINESS_STATUS } from "../shared/constants/BusinessStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { SERVICE_STATUS } from "../shared/constants/ServiceStatus.constants.js";
import { USER_ROLE } from "../shared/constants/UserRole.constants.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { readPayload } from "../shared/readPayload.js";
import { formatZonedDate, resolveZonedInstant } from "../shared/zonedTime.js";

const MIDDAY = "12:00";
const MS_PER_DAY = 86_400_000;

const failedPrecondition = (message: string, reason: string): HttpsError =>
  new HttpsError("failed-precondition", message, { reason });

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
 */
export const getAvailability = onCall<
  GetAvailabilityPayload,
  Promise<GetAvailabilityResponse>
>(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      GET_AVAILABILITY_ERROR.UNAUTHENTICATED,
    );
  }
  if (
    request.auth.token.role !== USER_ROLE.CUSTOMER &&
    request.auth.token.role !== USER_ROLE.CLIENT
  ) {
    throw new HttpsError(
      "permission-denied",
      GET_AVAILABILITY_ERROR.PERMISSION_DENIED,
    );
  }

  const { businessId, collaboratorId, date, serviceId } = readPayload(
    getAvailabilityPayloadSchema,
    request.data,
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
  const now = new Date();
  const today = formatZonedDate(now, timeZone);
  const lastBookableDay = formatZonedDate(
    new Date(now.getTime() + AVAILABILITY.BOOKING_WINDOW_DAYS * MS_PER_DAY),
    timeZone,
  );
  const middayOfDate = resolveZonedInstant(date, MIDDAY, timeZone);
  if (date < today || date > lastBookableDay || !middayOfDate) {
    throw new HttpsError(
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

  return {
    date,
    slots: slots.map((slot) => ({
      endsAt: slot.endsAt.toISOString(),
      startsAt: slot.startsAt.toISOString(),
    })),
    timeZone,
  };
});
