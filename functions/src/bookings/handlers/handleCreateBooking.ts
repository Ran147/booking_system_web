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
  const {
    businessId,
    collaboratorId,
    expectedDurationMinutes,
    expectedPriceInCents,
    requestId,
    serviceId,
    startsAt,
  } = parseCallablePayload(
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
  const bookingsCollection = businessReference.collection(
    FIRESTORE_COLLECTION.BOOKINGS,
  );
  // S-1: with a requestId every retry of one checkout targets the same
  // document, so a retry after a lost answer never creates a second booking.
  const bookingReference = requestId
    ? bookingsCollection.doc(requestId)
    : bookingsCollection.doc();

  return firestore.runTransaction(async (transaction) => {
    if (requestId) {
      const previousBooking = await transaction.get(bookingReference);
      if (previousBooking.exists) {
        const previousData = previousBooking.data();
        if (previousData?.customerUserId !== customerUserId) {
          throw new CallableFailure(
            "invalid-argument",
            CREATE_BOOKING_ERROR.REQUEST_ID_TAKEN,
          );
        }
        return {
          bookingId: previousBooking.id,
          serviceSnapshot: previousData.serviceSnapshot,
          status: previousData.status,
        } as CreateBookingResponse;
      }
    }

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

    // S-2, AC-KAN-148-08: the price or duration the customer saw changed.
    const hasPriceChanged =
      expectedPriceInCents !== undefined &&
      Number(serviceData?.priceInCents) !== expectedPriceInCents;
    const hasDurationChanged =
      expectedDurationMinutes !== undefined &&
      Number(serviceData?.durationMinutes) !== expectedDurationMinutes;
    if (hasPriceChanged || hasDurationChanged) {
      throw new CallableFailure(
        "failed-precondition",
        CREATE_BOOKING_ERROR.SERVICE_CHANGED,
        { reason: CREATE_BOOKING_ERROR_REASON.SERVICE_CHANGED },
      );
    }

    // The Customer record of this account: stored under the uid, or under any
    // id the business gave it, linked by userId (glossary §3, KAN-88).
    const [customerByIdSnapshot, customersByUserId] = await Promise.all([
      transaction.get(customerReference),
      transaction.get(
        businessReference
          .collection(FIRESTORE_COLLECTION.CUSTOMERS)
          .where("userId", "==", customerUserId)
          .limit(1),
      ),
    ]);
    const existingCustomerData = customerByIdSnapshot.exists
      ? customerByIdSnapshot.data()
      : customersByUserId.docs[0]?.data();

    // A customer the business blocked cannot book there (KAN-148).
    if (existingCustomerData?.status === CUSTOMER_STATUS.BLOCKED) {
      throw new CallableFailure(
        "failed-precondition",
        CREATE_BOOKING_ERROR.CUSTOMER_BLOCKED,
        { reason: CREATE_BOOKING_ERROR_REASON.CUSTOMER_BLOCKED },
      );
    }
    // S-3, AS-4: the first booking at a business creates the Customer record
    // from the account profile. Read here; written with the booking below.
    const profileData = existingCustomerData
      ? null
      : ((
          await transaction.get(
            firestore
              .collection(FIRESTORE_COLLECTION.USERS)
              .doc(customerUserId),
          )
        ).data() ?? {});

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

    if (profileData) {
      transaction.set(customerReference, {
        createdAt: now,
        email: profileData.email ?? null,
        fullName: profileData.fullName ?? null,
        phone: profileData.phone ?? null,
        status: CUSTOMER_STATUS.ACTIVE,
        userId: customerUserId,
      });
    }

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
