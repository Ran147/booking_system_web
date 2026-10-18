import { beforeAll, beforeEach, describe, expect, it } from "vitest";
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
} from "../../shared/tests/emulatorTestHelpers.js";
import { createBooking } from "../createBooking.js";

const callCreateBooking = functionsTestEnvironment.wrap(createBooking);

const TEST_BUSINESS_ID = "business-123";
const TEST_SERVICE_ID = "service-456";
const TEST_CUSTOMER_ID = "customer-789";

const CALLER_AUTH = {
  token: {
    role: USER_ROLE.CUSTOMER,
  },
  uid: "customer-uid-1",
};

describe("createBooking", () => {
  beforeAll(assertEmulatorsRunning);

  beforeEach(async () => {
    await clearEmulators();

    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .set({
        name: "Barbería Don Juan",
        status: "active",
      });

    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .set({
        description: "Servicio de prueba",
        durationMinutes: 45,
        name: "Corte y peinado",
        priceInCents: 20000,
        status: SERVICE_STATUS.ACTIVE,
      });
  });

  it("AC-KAN-62-01: stores snapshot of name, priceInCents, and durationMinutes valid at booking moment", async () => {
    const startsAt = new Date().toISOString();

    const response = await callCreateBooking(
      buildAuthenticatedCallableRequest(
        {
          businessId: TEST_BUSINESS_ID,
          customerId: TEST_CUSTOMER_ID,
          serviceId: TEST_SERVICE_ID,
          startsAt,
        },
        CALLER_AUTH,
      ),
    );

    expect(response.bookingId).toBeTruthy();
    expect(response.serviceSnapshot).toEqual({
      durationMinutes: 45,
      name: "Corte y peinado",
      priceInCents: 20000,
    });

    const bookingDoc = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.BOOKINGS)
      .doc(response.bookingId)
      .get();

    expect(bookingDoc.exists).toBe(true);
    expect(bookingDoc.data()?.serviceSnapshot).toEqual({
      durationMinutes: 45,
      name: "Corte y peinado",
      priceInCents: 20000,
    });
  });

  it("AC-KAN-60-03: applies active percentage discount to booking price snapshot", async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .update({
        discounts: [
          {
            endsAt: tomorrow.toISOString(),
            startsAt: yesterday.toISOString(),
            type: "percentage",
            value: 20, // 20% off 20000 = 16000
          },
        ],
      });

    const response = await callCreateBooking(
      buildAuthenticatedCallableRequest(
        {
          businessId: TEST_BUSINESS_ID,
          customerId: TEST_CUSTOMER_ID,
          serviceId: TEST_SERVICE_ID,
          startsAt: now.toISOString(),
        },
        CALLER_AUTH,
      ),
    );

    expect(response.serviceSnapshot.priceInCents).toBe(16000);
  });

  it("AC-KAN-60-03: applies active fixed-amount discount to booking price snapshot", async () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .update({
        discounts: [
          {
            endsAt: tomorrow.toISOString(),
            startsAt: yesterday.toISOString(),
            type: "fixed_amount",
            value: 5000, // 5000 cents off 20000 = 15000
          },
        ],
      });

    const response = await callCreateBooking(
      buildAuthenticatedCallableRequest(
        {
          businessId: TEST_BUSINESS_ID,
          customerId: TEST_CUSTOMER_ID,
          serviceId: TEST_SERVICE_ID,
          startsAt: now.toISOString(),
        },
        CALLER_AUTH,
      ),
    );

    expect(response.serviceSnapshot.priceInCents).toBe(15000);
  });

  it("AC-KAN-62-03: rejects booking when service is inactive with serviceUnavailableError", async () => {
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .update({
        status: SERVICE_STATUS.INACTIVE,
      });

    const error = await captureHttpsError(
      callCreateBooking(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            customerId: TEST_CUSTOMER_ID,
            serviceId: TEST_SERVICE_ID,
            startsAt: new Date().toISOString(),
          },
          CALLER_AUTH,
        ),
      ),
    );

    expect(error.code).toBe("failed-precondition");
    expect(error.message).toBe(
      "business:services.snapshot.serviceUnavailableError",
    );
  });

  it("AC-KAN-62-03: rejects booking when service does not exist with not-found", async () => {
    const error = await captureHttpsError(
      callCreateBooking(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            customerId: TEST_CUSTOMER_ID,
            serviceId: "non-existent-service",
            startsAt: new Date().toISOString(),
          },
          CALLER_AUTH,
        ),
      ),
    );

    expect(error.code).toBe("not-found");
    expect(error.message).toBe(
      "business:services.snapshot.serviceUnavailableError",
    );
  });

  it("rejects unauthenticated caller with unauthenticated", async () => {
    const error = await captureHttpsError(
      callCreateBooking(
        buildCallableRequest({
          businessId: TEST_BUSINESS_ID,
          customerId: TEST_CUSTOMER_ID,
          serviceId: TEST_SERVICE_ID,
          startsAt: new Date().toISOString(),
        }),
      ),
    );

    expect(error.code).toBe("unauthenticated");
  });

  it("rejects caller without customer role with permission-denied", async () => {
    const error = await captureHttpsError(
      callCreateBooking(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            customerId: TEST_CUSTOMER_ID,
            serviceId: TEST_SERVICE_ID,
            startsAt: new Date().toISOString(),
          },
          {
            token: {
              role: USER_ROLE.SUBSCRIBER,
            },
            uid: "subscriber-uid-1",
          },
        ),
      ),
    );

    expect(error.code).toBe("permission-denied");
  });

  it("rejects booking when business is not active", async () => {
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .update({ status: "inactive" });

    const error = await captureHttpsError(
      callCreateBooking(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            customerId: TEST_CUSTOMER_ID,
            serviceId: TEST_SERVICE_ID,
            startsAt: new Date().toISOString(),
          },
          CALLER_AUTH,
        ),
      ),
    );

    expect(error.code).toBe("failed-precondition");
  });

  it("always records authenticated caller uid as customerUserId ignoring payload value", async () => {
    const response = await callCreateBooking(
      buildAuthenticatedCallableRequest(
        {
          businessId: TEST_BUSINESS_ID,
          customerId: TEST_CUSTOMER_ID,
          customerUserId: "spoofed-user-id",
          serviceId: TEST_SERVICE_ID,
          startsAt: new Date().toISOString(),
        },
        CALLER_AUTH,
      ),
    );

    const bookingDoc = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.BOOKINGS)
      .doc(response.bookingId)
      .get();

    expect(bookingDoc.data()?.customerUserId).toBe(CALLER_AUTH.uid);
  });
});
