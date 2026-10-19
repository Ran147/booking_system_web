// Bookings of the test customer (KAN-150), called from seed-emulator.ts:
// upcoming (pending, confirmed, rescheduled), past (completed, no show) and
// cancelled (by the customer before its date, by the business after it), plus
// one booking of another customer to check isolation. Fixed ids: running the
// seed twice leaves the same data.
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import {
  SEED_BOOKING_CUSTOMER_ID,
  SEED_BOOKING_DAYS_FROM_NOW,
  SEED_BOOKING_ID,
  SEED_BOOKING_RESCHEDULE_SHIFT_DAYS,
  SEED_BOOKING_START_HOUR,
  SEED_BOOKING_TIME,
  SEED_CANCELLATION_NOTE,
  SEED_OTHER_CUSTOMER,
} from "./constants/SeedCustomerBookings.constants";
import {
  SEED_DOCUMENT_ID,
  SEED_SERVICE,
  SEED_USER,
} from "./constants/SeedEmulator.constants";
import { FIRESTORE_COLLECTION } from "../src/constants/firestore/FirestoreCollection.constants";
import {
  BOOKING_STATUS,
  CANCELLATION_ACTOR,
  type BookingStatus,
  type CancellationActor,
} from "../src/domain/booking/BookingStatus.constants";

interface SeedServiceSnapshot {
  DURATION_MINUTES: number;
  NAME: string;
  PRICE_IN_CENTS: number;
}

interface SeedBooking {
  cancelledBy?: CancellationActor;
  customerId: string;
  customerUserId: string;
  daysFromNow: number;
  id: string;
  isPenalized?: boolean;
  isRescheduled?: boolean;
  service: SeedServiceSnapshot;
  serviceId: string;
  status: BookingStatus;
}

const buildStartsAt = (daysFromNow: number): Date => {
  const startsAt = new Date(
    Date.now() + daysFromNow * SEED_BOOKING_TIME.MS_PER_DAY,
  );
  startsAt.setUTCHours(SEED_BOOKING_START_HOUR, 0, 0, 0);
  return startsAt;
};

const buildEndsAt = (startsAt: Date, durationMinutes: number): Date =>
  new Date(
    startsAt.getTime() + durationMinutes * SEED_BOOKING_TIME.MS_PER_MINUTE,
  );

const buildBookingDocument = (
  seedBooking: SeedBooking,
): Record<string, unknown> => {
  const { DURATION_MINUTES, NAME, PRICE_IN_CENTS } = seedBooking.service;
  const startsAt = buildStartsAt(seedBooking.daysFromNow);
  const previousStartsAt = buildStartsAt(
    seedBooking.daysFromNow - SEED_BOOKING_RESCHEDULE_SHIFT_DAYS,
  );

  return {
    businessId: SEED_DOCUMENT_ID.BUSINESS,
    cancellation: seedBooking.cancelledBy
      ? {
          cancelledBy: seedBooking.cancelledBy,
          isPenalized: seedBooking.isPenalized ?? false,
          note: SEED_CANCELLATION_NOTE,
        }
      : null,
    collaboratorId: SEED_DOCUMENT_ID.COLLABORATOR,
    collaboratorName: SEED_USER.COLLABORATOR.FULL_NAME,
    customerId: seedBooking.customerId,
    customerUserId: seedBooking.customerUserId,
    endsAt: Timestamp.fromDate(buildEndsAt(startsAt, DURATION_MINUTES)),
    rescheduleHistory: seedBooking.isRescheduled
      ? [
          {
            changedAt: Timestamp.now(),
            previousEndsAt: Timestamp.fromDate(
              buildEndsAt(previousStartsAt, DURATION_MINUTES),
            ),
            previousStartsAt: Timestamp.fromDate(previousStartsAt),
          },
        ]
      : [],
    serviceId: seedBooking.serviceId,
    serviceSnapshot: {
      durationMinutes: DURATION_MINUTES,
      name: NAME,
      priceInCents: PRICE_IN_CENTS,
    },
    startsAt: Timestamp.fromDate(startsAt),
    status: seedBooking.status,
  };
};

const buildSeedBookings = (): SeedBooking[] => {
  const testCustomer = {
    customerId: SEED_BOOKING_CUSTOMER_ID,
    customerUserId: SEED_USER.CUSTOMER.UID,
  };
  const haircut = {
    service: SEED_SERVICE.HAIRCUT,
    serviceId: SEED_DOCUMENT_ID.SERVICE_HAIRCUT,
  };
  const beard = {
    service: SEED_SERVICE.BEARD,
    serviceId: SEED_DOCUMENT_ID.SERVICE_BEARD,
  };

  return [
    {
      ...testCustomer,
      ...haircut,
      daysFromNow: SEED_BOOKING_DAYS_FROM_NOW.CONFIRMED_TOMORROW,
      id: SEED_BOOKING_ID.CONFIRMED_TOMORROW,
      status: BOOKING_STATUS.CONFIRMED,
    },
    {
      ...testCustomer,
      ...beard,
      daysFromNow: SEED_BOOKING_DAYS_FROM_NOW.RESCHEDULED,
      id: SEED_BOOKING_ID.RESCHEDULED,
      isRescheduled: true,
      status: BOOKING_STATUS.CONFIRMED,
    },
    {
      ...testCustomer,
      ...haircut,
      daysFromNow: SEED_BOOKING_DAYS_FROM_NOW.CONFIRMED_NEXT_WEEK,
      id: SEED_BOOKING_ID.CONFIRMED_NEXT_WEEK,
      status: BOOKING_STATUS.CONFIRMED,
    },
    {
      ...testCustomer,
      ...beard,
      daysFromNow: SEED_BOOKING_DAYS_FROM_NOW.PENDING_NEXT_MONTH,
      id: SEED_BOOKING_ID.PENDING_NEXT_MONTH,
      status: BOOKING_STATUS.PENDING,
    },
    {
      ...testCustomer,
      ...haircut,
      cancelledBy: CANCELLATION_ACTOR.CUSTOMER,
      daysFromNow: SEED_BOOKING_DAYS_FROM_NOW.CANCELLED_BY_CUSTOMER_FUTURE,
      id: SEED_BOOKING_ID.CANCELLED_BY_CUSTOMER_FUTURE,
      isPenalized: true,
      status: BOOKING_STATUS.CANCELLED,
    },
    {
      ...testCustomer,
      ...haircut,
      daysFromNow: SEED_BOOKING_DAYS_FROM_NOW.COMPLETED,
      id: SEED_BOOKING_ID.COMPLETED,
      status: BOOKING_STATUS.COMPLETED,
    },
    {
      ...testCustomer,
      ...beard,
      daysFromNow: SEED_BOOKING_DAYS_FROM_NOW.NO_SHOW,
      id: SEED_BOOKING_ID.NO_SHOW,
      status: BOOKING_STATUS.NO_SHOW,
    },
    {
      ...testCustomer,
      ...beard,
      cancelledBy: CANCELLATION_ACTOR.BUSINESS,
      daysFromNow: SEED_BOOKING_DAYS_FROM_NOW.CANCELLED_BY_BUSINESS_PAST,
      id: SEED_BOOKING_ID.CANCELLED_BY_BUSINESS_PAST,
      status: BOOKING_STATUS.CANCELLED,
    },
    {
      ...haircut,
      customerId: SEED_OTHER_CUSTOMER.CUSTOMER_ID,
      customerUserId: SEED_OTHER_CUSTOMER.USER_ID,
      daysFromNow: SEED_BOOKING_DAYS_FROM_NOW.OTHER_CUSTOMER,
      id: SEED_BOOKING_ID.OTHER_CUSTOMER,
      status: BOOKING_STATUS.CONFIRMED,
    },
  ];
};

export const seedCustomerBookings = async (
  firestore: Firestore,
): Promise<void> => {
  const businessDocument = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(SEED_DOCUMENT_ID.BUSINESS);

  await businessDocument
    .collection(FIRESTORE_COLLECTION.CUSTOMERS)
    .doc(SEED_BOOKING_CUSTOMER_ID)
    .set({
      email: SEED_USER.CUSTOMER.EMAIL,
      fullName: SEED_USER.CUSTOMER.FULL_NAME,
      phone: SEED_USER.CUSTOMER.PHONE,
      userId: SEED_USER.CUSTOMER.UID,
    });

  const bookingsCollection = businessDocument.collection(
    FIRESTORE_COLLECTION.BOOKINGS,
  );
  await Promise.all(
    buildSeedBookings().map((seedBooking) =>
      bookingsCollection
        .doc(seedBooking.id)
        .set(buildBookingDocument(seedBooking)),
    ),
  );
};
