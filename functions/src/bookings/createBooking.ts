import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  CREATE_BOOKING_ERROR,
  CREATE_BOOKING_ERROR_REASON,
} from "./constants/CreateBookingError.constants.js";
import type {
  CreateBookingPayload,
  CreateBookingResponse,
} from "./models/CreateBooking.mutation.js";
import { createBookingPayloadSchema } from "./models/CreateBooking.schema.js";
import { buildServiceSnapshot } from "./utils/buildServiceSnapshot.js";
import { resolveBookingResource } from "./utils/resolveBookingResource.js";
import { BOOKING_STATUS } from "../shared/constants/BookingStatus.constants.js";
import { BUSINESS_STATUS } from "../shared/constants/BusinessStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { TIME_CONVERSION } from "../shared/constants/ServiceDiscount.constants.js";
import { SERVICE_STATUS } from "../shared/constants/ServiceStatus.constants.js";
import { USER_ROLE } from "../shared/constants/UserRole.constants.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { readPayload } from "../shared/readPayload.js";
import type { AvailabilityBusinessHours } from "./availability/models/Availability.model.js";

export const createBooking = onCall<
  CreateBookingPayload,
  Promise<CreateBookingResponse>
>(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      CREATE_BOOKING_ERROR.UNAUTHENTICATED,
    );
  }

  if (
    request.auth.token.role !== USER_ROLE.CUSTOMER &&
    request.auth.token.role !== USER_ROLE.CLIENT
  ) {
    throw new HttpsError(
      "permission-denied",
      CREATE_BOOKING_ERROR.PERMISSION_DENIED,
    );
  }

  const authenticatedUserId = request.auth.uid;

  // `endsAt` and `customerId` in the payload are ignored (spec KAN-139, D-4):
  // the end comes from the service duration and a customer always books for
  // themselves.
  const { businessId, collaboratorId, serviceId, startsAt } = readPayload(
    createBookingPayloadSchema,
    request.data,
    CREATE_BOOKING_ERROR.INVALID_PAYLOAD,
  );

  const businessReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(businessId);
  const serviceReference = businessReference
    .collection(FIRESTORE_COLLECTION.SERVICES)
    .doc(serviceId);

  return firestore.runTransaction(async (transaction) => {
    const businessSnapshot = await transaction.get(businessReference);
    if (
      !businessSnapshot.exists ||
      businessSnapshot.data()?.status !== BUSINESS_STATUS.ACTIVE
    ) {
      throw new HttpsError(
        "failed-precondition",
        CREATE_BOOKING_ERROR.SERVICE_UNAVAILABLE,
        { reason: CREATE_BOOKING_ERROR_REASON.SERVICE_UNAVAILABLE },
      );
    }

    const serviceSnapshotDoc = await transaction.get(serviceReference);
    if (!serviceSnapshotDoc.exists) {
      throw new HttpsError(
        "not-found",
        CREATE_BOOKING_ERROR.SERVICE_UNAVAILABLE,
        { reason: CREATE_BOOKING_ERROR_REASON.SERVICE_UNAVAILABLE },
      );
    }

    const serviceData = serviceSnapshotDoc.data();
    if (serviceData?.status !== SERVICE_STATUS.ACTIVE) {
      throw new HttpsError(
        "failed-precondition",
        CREATE_BOOKING_ERROR.SERVICE_UNAVAILABLE,
        { reason: CREATE_BOOKING_ERROR_REASON.SERVICE_UNAVAILABLE },
      );
    }

    const timeZone: string = businessSnapshot.data()?.timeZone ?? "UTC";
    const serviceSnapshot = buildServiceSnapshot({
      serviceData: {
        discounts: serviceData?.discounts,
        durationMinutes: serviceData?.durationMinutes,
        name: serviceData?.name,
        priceInCents: serviceData?.priceInCents,
      },
      timeZone,
    });

    const startsAtDate = new Date(startsAt);
    const durationMilliseconds =
      serviceSnapshot.durationMinutes *
      TIME_CONVERSION.SECONDS_PER_MINUTE *
      TIME_CONVERSION.MILLISECONDS_PER_SECOND;
    const endsAtDate = new Date(startsAtDate.getTime() + durationMilliseconds);

    const { collaboratorId: assignedCollaboratorId, collaboratorName } =
      await resolveBookingResource({
        businessHours: (businessSnapshot.data()?.businessHours ??
          {}) as AvailabilityBusinessHours,
        businessReference,
        chosenCollaboratorId: collaboratorId ?? null,
        customerUserId: authenticatedUserId,
        durationMinutes: serviceSnapshot.durationMinutes,
        now: new Date(),
        serviceId,
        startsAt: startsAtDate,
        timeZone,
        transaction,
      });

    const bookingReference = businessReference
      .collection(FIRESTORE_COLLECTION.BOOKINGS)
      .doc();

    transaction.set(bookingReference, {
      businessId,
      cancellation: null,
      collaboratorId: assignedCollaboratorId,
      collaboratorName,
      customerId: authenticatedUserId,
      customerUserId: authenticatedUserId,
      endsAt: endsAtDate,
      id: bookingReference.id,
      rescheduleHistory: [],
      serviceId,
      serviceSnapshot,
      startsAt: startsAtDate,
      status: BOOKING_STATUS.CONFIRMED,
    });

    return {
      bookingId: bookingReference.id,
      serviceSnapshot,
    };
  });
});
