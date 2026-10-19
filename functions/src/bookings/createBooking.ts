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
import { BOOKING_STATUS } from "../shared/constants/BookingStatus.constants.js";
import { BUSINESS_STATUS } from "../shared/constants/BusinessStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { TIME_CONVERSION } from "../shared/constants/ServiceDiscount.constants.js";
import { SERVICE_STATUS } from "../shared/constants/ServiceStatus.constants.js";
import { USER_ROLE } from "../shared/constants/UserRole.constants.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { readPayload } from "../shared/readPayload.js";
import type { Nullable } from "../shared/types/Nullable.js";

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

  if (request.auth.token.role !== USER_ROLE.CUSTOMER) {
    throw new HttpsError(
      "permission-denied",
      CREATE_BOOKING_ERROR.PERMISSION_DENIED,
    );
  }

  const authenticatedUserId = request.auth.uid;

  const {
    businessId,
    collaboratorId,
    customerId,
    endsAt,
    serviceId,
    startsAt,
  } = readPayload(
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

    let collaboratorName: Nullable<string> = null;
    if (collaboratorId) {
      const collaboratorDoc = await transaction.get(
        businessReference
          .collection(FIRESTORE_COLLECTION.COLLABORATORS)
          .doc(collaboratorId),
      );
      if (collaboratorDoc.exists) {
        collaboratorName = collaboratorDoc.data()?.fullName ?? null;
      }
    }

    const serviceSnapshot = buildServiceSnapshot({
      serviceData: {
        discounts: serviceData?.discounts,
        durationMinutes: serviceData?.durationMinutes,
        name: serviceData?.name,
        priceInCents: serviceData?.priceInCents,
      },
      timeZone: businessSnapshot.data()?.timeZone ?? "UTC",
    });

    const startsAtDate = new Date(startsAt);
    const durationMilliseconds =
      serviceSnapshot.durationMinutes *
      TIME_CONVERSION.SECONDS_PER_MINUTE *
      TIME_CONVERSION.MILLISECONDS_PER_SECOND;

    const endsAtDate = endsAt
      ? new Date(endsAt)
      : new Date(startsAtDate.getTime() + durationMilliseconds);

    const bookingReference = businessReference
      .collection(FIRESTORE_COLLECTION.BOOKINGS)
      .doc();

    transaction.set(bookingReference, {
      businessId,
      cancellation: null,
      collaboratorId: collaboratorId ?? null,
      collaboratorName,
      customerId,
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
