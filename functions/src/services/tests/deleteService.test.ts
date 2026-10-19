import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BOOKING_STATUS } from "../../shared/constants/BookingStatus.constants.js";
import { BUSINESS_STATUS } from "../../shared/constants/BusinessStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { SERVICE_STATUS } from "../../shared/constants/ServiceStatus.constants.js";
import { USER_ROLE } from "../../shared/constants/UserRole.constants.js";
import { firestore } from "../../shared/firebaseAdmin.js";
import {
  assertEmulatorsRunning,
  buildAuthenticatedCallableRequest,
  buildCallableRequest,
  captureHttpsError,
  clearEmulators,
  functionsTestEnvironment,
  readErrorReason,
} from "../../shared/tests/emulatorTestHelpers.js";
import { DELETE_SERVICE_ERROR_REASON } from "../constants/DeleteServiceError.constants.js";
import { deleteService } from "../deleteService.js";

const callDeleteService = functionsTestEnvironment.wrap(deleteService);

const TEST_BUSINESS_ID = "business-123";
const OTHER_BUSINESS_ID = "business-999";
const TEST_SERVICE_ID = "service-456";
const TEST_SUBSCRIBER_UID = "user-subscriber-123";

const PROMISE_SETTLED_STATUS = Object.freeze({
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
} as const);

const SUBSCRIBER_AUTH = {
  token: {
    businessId: TEST_BUSINESS_ID,
    role: USER_ROLE.SUBSCRIBER,
  },
  uid: TEST_SUBSCRIBER_UID,
};

describe("deleteService", () => {
  beforeAll(assertEmulatorsRunning);

  beforeEach(async () => {
    await clearEmulators();

    // Seed business document
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .set({
        name: "Barbería Don Juan",
        status: "active",
      });
  });

  const seedService = async (
    status: "active" | "inactive" = SERVICE_STATUS.INACTIVE,
    serviceId: string = TEST_SERVICE_ID,
  ): Promise<void> => {
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(serviceId)
      .set({
        description: "Servicio de prueba",
        durationMinutes: 30,
        name: "Corte clásico",
        priceInCents: 15000,
        status,
      });
  };

  const seedBooking = async (
    bookingId: string,
    status: string,
    serviceId: string = TEST_SERVICE_ID,
  ): Promise<void> => {
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.BOOKINGS)
      .doc(bookingId)
      .set({
        serviceId,
        serviceSnapshot: {
          durationMinutes: 30,
          name: "Corte clásico",
          priceInCents: 15000,
        },
        status,
      });
  };

  it("KAN-59: deletes an inactive service without bookings (AC-KAN-59-01)", async () => {
    await seedService(SERVICE_STATUS.INACTIVE);

    const deleteResponse = await callDeleteService(
      buildAuthenticatedCallableRequest(
        {
          businessId: TEST_BUSINESS_ID,
          serviceId: TEST_SERVICE_ID,
        },
        SUBSCRIBER_AUTH,
      ),
    );

    expect(deleteResponse).toEqual({
      deletedServiceId: TEST_SERVICE_ID,
    });

    const serviceDoc = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .get();

    expect(serviceDoc.exists).toBe(false);
  });

  it("KAN-59: rejects deletion if service has a pending booking (AC-KAN-59-02)", async () => {
    await seedService(SERVICE_STATUS.INACTIVE);
    await seedBooking("booking-pending", BOOKING_STATUS.PENDING);

    const error = await captureHttpsError(
      callDeleteService(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            serviceId: TEST_SERVICE_ID,
          },
          SUBSCRIBER_AUTH,
        ),
      ),
    );

    expect(error.code).toBe("failed-precondition");
    expect(readErrorReason(error)).toBe(
      DELETE_SERVICE_ERROR_REASON.HAS_ACTIVE_BOOKINGS,
    );

    const serviceDoc = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .get();
    expect(serviceDoc.exists).toBe(true);
  });

  it("KAN-59: rejects deletion if service has a confirmed booking (AC-KAN-59-02)", async () => {
    await seedService(SERVICE_STATUS.INACTIVE);
    await seedBooking("booking-confirmed", BOOKING_STATUS.CONFIRMED);

    const error = await captureHttpsError(
      callDeleteService(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            serviceId: TEST_SERVICE_ID,
          },
          SUBSCRIBER_AUTH,
        ),
      ),
    );

    expect(error.code).toBe("failed-precondition");
    expect(readErrorReason(error)).toBe(
      DELETE_SERVICE_ERROR_REASON.HAS_ACTIVE_BOOKINGS,
    );
  });

  it("KAN-59: rejects deletion of an active service with must_be_inactive (AC-KAN-59-03)", async () => {
    await seedService(SERVICE_STATUS.ACTIVE);

    const error = await captureHttpsError(
      callDeleteService(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            serviceId: TEST_SERVICE_ID,
          },
          SUBSCRIBER_AUTH,
        ),
      ),
    );

    expect(error.code).toBe("failed-precondition");
    expect(readErrorReason(error)).toBe(
      DELETE_SERVICE_ERROR_REASON.MUST_BE_INACTIVE,
    );

    const serviceDoc = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .get();
    expect(serviceDoc.exists).toBe(true);
  });

  it("KAN-59: deletes inactive service whose bookings are only completed, cancelled, or no_show (AC-KAN-59-06)", async () => {
    await seedService(SERVICE_STATUS.INACTIVE);
    await seedBooking("booking-1", BOOKING_STATUS.COMPLETED);
    await seedBooking("booking-2", BOOKING_STATUS.CANCELLED);
    await seedBooking("booking-3", BOOKING_STATUS.NO_SHOW);

    const deleteResponse = await callDeleteService(
      buildAuthenticatedCallableRequest(
        {
          businessId: TEST_BUSINESS_ID,
          serviceId: TEST_SERVICE_ID,
        },
        SUBSCRIBER_AUTH,
      ),
    );

    expect(deleteResponse).toEqual({
      deletedServiceId: TEST_SERVICE_ID,
    });

    const serviceDoc = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .get();
    expect(serviceDoc.exists).toBe(false);

    // Bookings snapshots remain intact
    const completedBookingDoc = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.BOOKINGS)
      .doc("booking-1")
      .get();
    expect(completedBookingDoc.data()?.serviceSnapshot).toEqual({
      durationMinutes: 30,
      name: "Corte clásico",
      priceInCents: 15000,
    });
  });

  it("KAN-59: rejects unauthenticated caller with unauthenticated", async () => {
    await seedService(SERVICE_STATUS.INACTIVE);

    const error = await captureHttpsError(
      callDeleteService(
        buildCallableRequest({
          businessId: TEST_BUSINESS_ID,
          serviceId: TEST_SERVICE_ID,
        }),
      ),
    );

    expect(error.code).toBe("unauthenticated");
  });

  it("KAN-59: rejects caller from a different business with permission-denied", async () => {
    await seedService(SERVICE_STATUS.INACTIVE);

    const error = await captureHttpsError(
      callDeleteService(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            serviceId: TEST_SERVICE_ID,
          },
          {
            token: {
              businessId: OTHER_BUSINESS_ID,
              role: USER_ROLE.SUBSCRIBER,
            },
            uid: "other-user",
          },
        ),
      ),
    );

    expect(error.code).toBe("permission-denied");
  });

  it("KAN-59: rejects caller with customer role with permission-denied", async () => {
    await seedService(SERVICE_STATUS.INACTIVE);

    const error = await captureHttpsError(
      callDeleteService(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            serviceId: TEST_SERVICE_ID,
          },
          {
            token: {
              businessId: TEST_BUSINESS_ID,
              role: USER_ROLE.CUSTOMER,
            },
            uid: "customer-uid",
          },
        ),
      ),
    );

    expect(error.code).toBe("permission-denied");
  });

  it("KAN-59: throws not-found when the service does not exist", async () => {
    const error = await captureHttpsError(
      callDeleteService(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            serviceId: "non-existent-service",
          },
          SUBSCRIBER_AUTH,
        ),
      ),
    );

    expect(error.code).toBe("not-found");
  });

  it("KAN-59: throws invalid-argument when businessId or serviceId is empty", async () => {
    const error = await captureHttpsError(
      callDeleteService(
        buildAuthenticatedCallableRequest(
          {
            businessId: "",
            serviceId: TEST_SERVICE_ID,
          },
          SUBSCRIBER_AUTH,
        ),
      ),
    );

    expect(error.code).toBe("invalid-argument");
  });

  it("KAN-59: rejects deletion when business is inactive (AC-KAN-59-04)", async () => {
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .update({ status: BUSINESS_STATUS.INACTIVE });

    await seedService(SERVICE_STATUS.INACTIVE);

    const error = await captureHttpsError(
      callDeleteService(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            serviceId: TEST_SERVICE_ID,
          },
          SUBSCRIBER_AUTH,
        ),
      ),
    );

    expect(error.code).toBe("failed-precondition");
    expect(readErrorReason(error)).toBe(
      DELETE_SERVICE_ERROR_REASON.BUSINESS_NOT_ACTIVE,
    );

    const serviceDoc = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .get();
    expect(serviceDoc.exists).toBe(true);
  });

  it("KAN-59: rejects deletion when business is suspended (AC-KAN-59-04)", async () => {
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .update({ status: BUSINESS_STATUS.SUSPENDED });

    await seedService(SERVICE_STATUS.INACTIVE);

    const error = await captureHttpsError(
      callDeleteService(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            serviceId: TEST_SERVICE_ID,
          },
          SUBSCRIBER_AUTH,
        ),
      ),
    );

    expect(error.code).toBe("failed-precondition");
    expect(readErrorReason(error)).toBe(
      DELETE_SERVICE_ERROR_REASON.BUSINESS_NOT_ACTIVE,
    );
  });

  it("KAN-59: handles concurrent delete requests safely (AC-KAN-59-07)", async () => {
    await seedService(SERVICE_STATUS.INACTIVE);

    const deleteResults = await Promise.allSettled([
      callDeleteService(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            serviceId: TEST_SERVICE_ID,
          },
          SUBSCRIBER_AUTH,
        ),
      ),
      callDeleteService(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            serviceId: TEST_SERVICE_ID,
          },
          SUBSCRIBER_AUTH,
        ),
      ),
    ]);

    const fulfilledResults = deleteResults.filter(
      (result) => result.status === PROMISE_SETTLED_STATUS.FULFILLED,
    );
    const rejectedResults = deleteResults.filter(
      (result) => result.status === PROMISE_SETTLED_STATUS.REJECTED,
    );

    expect(fulfilledResults).toHaveLength(1);
    expect(rejectedResults).toHaveLength(1);

    const serviceDoc = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .get();
    expect(serviceDoc.exists).toBe(false);
  });

  it("KAN-59: ensures deletion is safely coordinated with concurrent bookings (AC-KAN-59-07)", async () => {
    await seedService(SERVICE_STATUS.INACTIVE);

    const operations = await Promise.allSettled([
      seedBooking("booking-concurrent", BOOKING_STATUS.PENDING),
      callDeleteService(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            serviceId: TEST_SERVICE_ID,
          },
          SUBSCRIBER_AUTH,
        ),
      ),
    ]);

    const serviceDoc = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .get();

    const deleteOperation = operations[1];
    if (deleteOperation?.status === PROMISE_SETTLED_STATUS.REJECTED) {
      expect(readErrorReason(deleteOperation.reason)).toBe(
        DELETE_SERVICE_ERROR_REASON.HAS_ACTIVE_BOOKINGS,
      );
      expect(serviceDoc.exists).toBe(true);
    } else {
      expect(serviceDoc.exists).toBe(false);
    }
  });
});
