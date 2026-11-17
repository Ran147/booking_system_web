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
import {
  formatZonedDate,
  resolveZonedInstant,
} from "../../shared/zonedTime.js";
import { createBooking } from "../createBooking.js";

const callCreateBooking = functionsTestEnvironment.wrap(createBooking);

const TEST_BUSINESS_ID = "business-123";
const TEST_SERVICE_ID = "service-456";
const TEST_CUSTOMER_ID = "customer-789";

const COSTA_RICA_TIME_ZONE = "America/Costa_Rica";
const MS_PER_DAY = 86_400_000;
const BOOKING_DAYS_AHEAD = 2;
// A day two days from now in the business time zone, open 08:00 to 18:00.
const BOOKING_DATE = formatZonedDate(
  new Date(Date.now() + BOOKING_DAYS_AHEAD * MS_PER_DAY),
  COSTA_RICA_TIME_ZONE,
);
const OPEN_EVERY_DAY = Object.fromEntries(
  [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ].map((weekday) => [weekday, [{ closesAt: "18:00", opensAt: "08:00" }]]),
);

const slotAt = (time: string): Date =>
  resolveZonedInstant(BOOKING_DATE, time, COSTA_RICA_TIME_ZONE) as Date;

const FREE_SLOT_START = slotAt("10:00").toISOString();

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
        businessHours: OPEN_EVERY_DAY,
        name: "Barbería Don Juan",
        status: "active",
        timeZone: COSTA_RICA_TIME_ZONE,
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
    const startsAt = FREE_SLOT_START;

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
          startsAt: FREE_SLOT_START,
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
          startsAt: FREE_SLOT_START,
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
            startsAt: FREE_SLOT_START,
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
            startsAt: FREE_SLOT_START,
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
          startsAt: FREE_SLOT_START,
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
            startsAt: FREE_SLOT_START,
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
            startsAt: FREE_SLOT_START,
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
          startsAt: FREE_SLOT_START,
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

  const bookFreeSlot = (): ReturnType<typeof callCreateBooking> =>
    callCreateBooking(
      buildAuthenticatedCallableRequest(
        {
          businessId: TEST_BUSINESS_ID,
          serviceId: TEST_SERVICE_ID,
          startsAt: FREE_SLOT_START,
        },
        CALLER_AUTH,
      ),
    );

  it("KAN-70: a business that confirms by hand gets the booking as pending", async () => {
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .update({ bookingConfirmationMode: "manual" });

    const response = await bookFreeSlot();

    expect(response.status).toBe("pending");
  });

  it("KAN-70: with automatic confirmation the booking is confirmed", async () => {
    const response = await bookFreeSlot();

    expect(response.status).toBe("confirmed");
  });

  it("KAN-148: a customer the business blocked cannot book there", async () => {
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.CUSTOMERS)
      .doc(CALLER_AUTH.uid)
      .set({ status: "blocked" });

    const error = await captureHttpsError(bookFreeSlot());

    expect(error.code).toBe("failed-precondition");
    expect(error.message).toBe(
      "customer:bookingCheckout.confirm.customerBlockedError",
    );
  });

  const REQUEST_ID = "5f0c8a52-3b0e-4c1d-9a51-6f1e2b7c9d10";

  const bookWith = (
    extra: Record<string, unknown>,
    auth: typeof CALLER_AUTH = CALLER_AUTH,
  ): ReturnType<typeof callCreateBooking> =>
    callCreateBooking(
      buildAuthenticatedCallableRequest(
        {
          businessId: TEST_BUSINESS_ID,
          serviceId: TEST_SERVICE_ID,
          startsAt: FREE_SLOT_START,
          ...extra,
        },
        auth,
      ),
    );

  const businessBookings = (): ReturnType<
    ReturnType<typeof firestore.collection>["get"]
  > =>
    firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.BOOKINGS)
      .get();

  it("AC-KAN-148-06: retrying with the same requestId returns the same booking", async () => {
    const first = await bookWith({ requestId: REQUEST_ID });
    const retry = await bookWith({ requestId: REQUEST_ID });

    expect(first.bookingId).toBe(REQUEST_ID);
    expect(retry).toEqual(first);
    expect((await businessBookings()).size).toBe(1);
  });

  it("AC-KAN-148-06: a requestId of another customer's booking is rejected", async () => {
    await bookWith({ requestId: REQUEST_ID });

    const error = await captureHttpsError(
      bookWith(
        { requestId: REQUEST_ID },
        { token: { role: USER_ROLE.CUSTOMER }, uid: "customer-uid-2" },
      ),
    );

    expect(error.code).toBe("invalid-argument");
  });

  it("AC-KAN-148-08: a price or duration different from what the customer saw is rejected", async () => {
    const priceChanged = await captureHttpsError(
      bookWith({ expectedDurationMinutes: 45, expectedPriceInCents: 19_000 }),
    );
    const durationChanged = await captureHttpsError(
      bookWith({ expectedDurationMinutes: 30, expectedPriceInCents: 20_000 }),
    );

    expect(priceChanged.message).toBe(
      "customer:bookingCheckout.confirm.serviceChangedError",
    );
    expect(durationChanged.details).toEqual({ reason: "service_changed" });
    expect((await businessBookings()).size).toBe(0);
  });

  it("AC-KAN-148-08: the same price and duration book normally", async () => {
    const response = await bookWith({
      expectedDurationMinutes: 45,
      expectedPriceInCents: 20_000,
    });

    expect(response.bookingId).toBeTruthy();
  });

  it("AC-KAN-148-08: the customer sees the discounted price, so that is the price compared", async () => {
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .update({
        discounts: [
          {
            endsAt: new Date(Date.now() + MS_PER_DAY).toISOString(),
            startsAt: new Date(Date.now() - MS_PER_DAY).toISOString(),
            type: "percentage",
            value: 20,
          },
        ],
      });

    // The base price no longer matches what the customer saw (16 000).
    const basePrice = await captureHttpsError(
      bookWith({ expectedDurationMinutes: 45, expectedPriceInCents: 20_000 }),
    );
    const response = await bookWith({
      expectedDurationMinutes: 45,
      expectedPriceInCents: 16_000,
    });

    expect(basePrice.details).toEqual({ reason: "service_changed" });
    expect(response.serviceSnapshot.priceInCents).toBe(16_000);
  });

  it("AC-KAN-148-09 and AC-KAN-148-11: the first booking creates the Customer record from the account", async () => {
    await firestore
      .collection(FIRESTORE_COLLECTION.USERS)
      .doc(CALLER_AUTH.uid)
      .set({
        email: "carla@demo.test",
        fullName: "Carla Cliente",
        phone: "+506 8888 0000",
      });

    await bookFreeSlot();

    const customer = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.CUSTOMERS)
      .doc(CALLER_AUTH.uid)
      .get();
    expect(customer.data()).toMatchObject({
      email: "carla@demo.test",
      fullName: "Carla Cliente",
      phone: "+506 8888 0000",
      status: "active",
      userId: CALLER_AUTH.uid,
    });
  });

  it("AS-4: a Customer record stored under another id is found by userId: no duplicate, and blocking applies", async () => {
    const customersCollection = firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.CUSTOMERS);
    await customersCollection
      .doc("added-by-the-business")
      .set({ status: "active", userId: CALLER_AUTH.uid });

    await bookFreeSlot();
    expect((await customersCollection.get()).size).toBe(1);

    await customersCollection
      .doc("added-by-the-business")
      .update({ status: "blocked" });
    const error = await captureHttpsError(
      bookWith({ startsAt: slotAt("15:00").toISOString() }),
    );
    expect(error.details).toEqual({ reason: "customer_blocked" });
  });

  it("AS-4: the booking points to the Customer record the business already has", async () => {
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.CUSTOMERS)
      .doc("added-by-the-business")
      .set({ status: "active", userId: CALLER_AUTH.uid });

    await bookWith({});
    const booking = (await businessBookings()).docs[0]?.data();

    expect(booking?.customerId).toBe("added-by-the-business");
    expect(booking?.customerUserId).toBe(CALLER_AUTH.uid);
  });

  it("AS-4: an existing Customer record is left as it is", async () => {
    const customerReference = firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.CUSTOMERS)
      .doc(CALLER_AUTH.uid);
    await customerReference.set({
      fullName: "Nombre del negocio",
      status: "active",
    });

    await bookFreeSlot();

    expect((await customerReference.get()).data()).toEqual({
      fullName: "Nombre del negocio",
      status: "active",
    });
  });
});
