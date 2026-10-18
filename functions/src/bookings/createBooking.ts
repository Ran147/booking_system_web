import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  CREATE_BOOKING_ERROR,
  CREATE_BOOKING_ERROR_REASON,
} from "./constants/CreateBookingError.constants.js";
import type {
  CreateBookingPayload,
  CreateBookingResponse,
  ServiceSnapshot,
} from "./models/CreateBooking.mutation.js";
import { createBookingPayloadSchema } from "./models/CreateBooking.schema.js";
import { BOOKING_STATUS } from "../shared/constants/BookingStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import {
  DISCOUNT_TYPE,
  TIME_CONVERSION,
} from "../shared/constants/ServiceDiscount.constants.js";
import { SERVICE_STATUS } from "../shared/constants/ServiceStatus.constants.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { readPayload } from "../shared/readPayload.js";
import type { Nullable } from "../shared/types/Nullable.js";

const parseDate = (value: unknown): Nullable<Date> => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof (value as { toDate?: () => Date }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === "string") {
    return new Date(value);
  }
  return null;
};

export const createBooking = onCall<
  CreateBookingPayload,
  Promise<CreateBookingResponse>
>(async (request) => {
  const {
    businessId,
    collaboratorId,
    customerId,
    customerUserId,
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

    // Evaluate discounts active right now (AC-KAN-60-03)
    const now = Date.now();
    let finalPriceInCents = Number(serviceData.priceInCents ?? 0);

    const discounts: unknown[] = Array.isArray(serviceData.discounts)
      ? serviceData.discounts
      : [];

    for (const discountItem of discounts) {
      if (!discountItem || typeof discountItem !== "object") {
        continue;
      }
      const discount = discountItem as {
        endsAt: unknown;
        startsAt: unknown;
        type: string;
        value: number;
      };

      const startDate = parseDate(discount.startsAt);
      const endDate = parseDate(discount.endsAt);

      if (startDate && endDate) {
        // Set end of day for endDate if time is 00:00:00
        const endTime = new Date(endDate);
        if (
          endTime.getHours() === 0 &&
          endTime.getMinutes() === 0 &&
          endTime.getSeconds() === 0
        ) {
          endTime.setHours(
            TIME_CONVERSION.END_OF_DAY_HOUR,
            TIME_CONVERSION.END_OF_DAY_MINUTE,
            TIME_CONVERSION.END_OF_DAY_SECOND,
            TIME_CONVERSION.END_OF_DAY_MILLISECOND,
          );
        }

        if (now >= startDate.getTime() && now <= endTime.getTime()) {
          if (discount.type === DISCOUNT_TYPE.PERCENTAGE) {
            finalPriceInCents = Math.round(
              finalPriceInCents *
                (1 - discount.value / TIME_CONVERSION.PERCENTAGE_BASE),
            );
          } else if (discount.type === DISCOUNT_TYPE.FIXED_AMOUNT) {
            finalPriceInCents = Math.max(0, finalPriceInCents - discount.value);
          }
          break;
        }
      }
    }

    const serviceSnapshot: ServiceSnapshot = {
      durationMinutes: Number(serviceData.durationMinutes ?? 0),
      name: String(serviceData.name ?? ""),
      priceInCents: finalPriceInCents,
    };

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
      customerUserId: customerUserId ?? null,
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
