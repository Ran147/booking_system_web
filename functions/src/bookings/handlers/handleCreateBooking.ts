import { CallableFailure } from "../../shared/CallableFailure.js";
import { BOOKING_CONFIRMATION_MODE } from "../../shared/constants/BookingConfirmationMode.constants.js";
import { BOOKING_STATUS } from "../../shared/constants/BookingStatus.constants.js";
import { BUSINESS_STATUS } from "../../shared/constants/BusinessStatus.constants.js";
import { CUSTOMER_STATUS } from "../../shared/constants/CustomerStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { TIME_CONVERSION } from "../../shared/constants/ServiceDiscount.constants.js";
import { SERVICE_STATUS } from "../../shared/constants/ServiceStatus.constants.js";
import { USER_ROLE } from "../../shared/constants/UserRole.constants.js";
import type { CallableHandlerInput } from "../../shared/models/CallableHandler.model.js";
import { parseCallablePayload } from "../../shared/parseCallablePayload.js";
import type { AvailabilityBusinessHours } from "../availability/models/Availability.model.js";
import {
  CREATE_BOOKING_ERROR,
  CREATE_BOOKING_ERROR_REASON,
} from "../constants/CreateBookingError.constants.js";
import type { CreateBookingResponse } from "../models/CreateBooking.mutation.js";
import { createBookingPayloadSchema } from "../models/CreateBooking.schema.js";
import { buildServiceSnapshot } from "../utils/buildServiceSnapshot.js";
import { resolveBookingResource } from "../utils/resolveBookingResource.js";

const serviceUnavailable = (
  code: "failed-precondition" | "not-found",
): CallableFailure =>
  new CallableFailure(code, CREATE_BOOKING_ERROR.SERVICE_UNAVAILABLE, {
    reason: CREATE_BOOKING_ERROR_REASON.SERVICE_UNAVAILABLE,
  });

/**
 * A customer books a free slot for themselves (KAN-144, KAN-148). Inside one
 * transaction it re-checks the slot with the availability engine, assigns
 * who serves it and writes the booking, so two bookings never collide.
 *
 * Shared by the `createBooking` callable and the Vercel dispatcher (Q8).
 */
export const handleCreateBooking = async ({
  caller,
  payload,
  firestore,
  now,
}: CallableHandlerInput): Promise<CreateBookingResponse> => {
  if (!caller) {
    throw new CallableFailure(
      "unauthenticated",
      CREATE_BOOKING_ERROR.UNAUTHENTICATED,
    );
  }
  if (caller.role !== USER_ROLE.CUSTOMER && caller.role !== USER_ROLE.CLIENT) {
    throw new CallableFailure(
      "permission-denied",
      CREATE_BOOKING_ERROR.PERMISSION_DENIED,
    );
  }

  const customerUserId = caller.uid;

  // `endsAt` and `customerId` in the payload are ignored (spec KAN-139, D-4):
  // the end comes from the service duration and a customer always books for
  // themselves.
  const { businessId, collaboratorId, serviceId, startsAt } =
    parseCallablePayload(
      createBookingPayloadSchema,
      payload,
      CREATE_BOOKING_ERROR.INVALID_PAYLOAD,
    );

  const businessReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(businessId);
  const serviceReference = businessReference
    .collection(FIRESTORE_COLLECTION.SERVICES)
    .doc(serviceId);
  const customerReference = businessReference
    .collection(FIRESTORE_COLLECTION.CUSTOMERS)
    .doc(customerUserId);

  return firestore.runTransaction(async (transaction) => {
    const businessSnapshot = await transaction.get(businessReference);
    const businessData = businessSnapshot.data();
    if (
      !businessSnapshot.exists ||
      businessData?.status !== BUSINESS_STATUS.ACTIVE
    ) {
      throw serviceUnavailable("failed-precondition");
    }

    const serviceSnapshotDoc = await transaction.get(serviceReference);
    if (!serviceSnapshotDoc.exists) {
      throw serviceUnavailable("not-found");
    }
    const serviceData = serviceSnapshotDoc.data();
    if (serviceData?.status !== SERVICE_STATUS.ACTIVE) {
      throw serviceUnavailable("failed-precondition");
    }

    // A customer the business blocked cannot book there (KAN-148).
    const customerSnapshot = await transaction.get(customerReference);
    if (customerSnapshot.data()?.status === CUSTOMER_STATUS.BLOCKED) {
      throw new CallableFailure(
        "failed-precondition",
        CREATE_BOOKING_ERROR.CUSTOMER_BLOCKED,
        { reason: CREATE_BOOKING_ERROR_REASON.CUSTOMER_BLOCKED },
      );
    }

    const timeZone: string = businessData?.timeZone ?? "UTC";
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
        businessHours: (businessData?.businessHours ??
          {}) as AvailabilityBusinessHours,
        businessReference,
        chosenCollaboratorId: collaboratorId ?? null,
        customerUserId,
        durationMinutes: serviceSnapshot.durationMinutes,
        now,
        serviceId,
        startsAt: startsAtDate,
        timeZone,
        transaction,
      });

    // KAN-70: a business that confirms by hand gets the booking as pending.
    const status =
      businessData?.bookingConfirmationMode === BOOKING_CONFIRMATION_MODE.MANUAL
        ? BOOKING_STATUS.PENDING
        : BOOKING_STATUS.CONFIRMED;

    const bookingReference = businessReference
      .collection(FIRESTORE_COLLECTION.BOOKINGS)
      .doc();

    transaction.set(bookingReference, {
      businessId,
      cancellation: null,
      collaboratorId: assignedCollaboratorId,
      collaboratorName,
      // `now`, not a FieldValue sentinel: the dispatcher and the functions
      // package may load different copies of firebase-admin (Q8).
      createdAt: now,
      customerId: customerUserId,
      customerUserId,
      endsAt: endsAtDate,
      id: bookingReference.id,
      rescheduleHistory: [],
      serviceId,
      serviceSnapshot,
      startsAt: startsAtDate,
      status,
      updatedAt: now,
    });

    return {
      bookingId: bookingReference.id,
      serviceSnapshot,
      status,
    };
  });
};
