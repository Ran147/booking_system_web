// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

// Runs only against the emulator: npm run test:rules.
// A customer reads their own bookings across businesses (KAN-150, AS-1).
const PROJECT_ID = "demo-booking-system";
const BOOKINGS_COLLECTION = "bookings";
const CUSTOMER_UID = "customer-a";
const OTHER_CUSTOMER_UID = "customer-b";
const BUSINESS_A_BOOKING_PATH = "businesses/business-a/bookings/booking-a";
const BUSINESS_B_BOOKING_PATH = "businesses/business-b/bookings/booking-b";
const OTHER_BOOKING_PATH = "businesses/business-a/bookings/booking-other";

let testEnvironment: RulesTestEnvironment;

type TestFirestore = ReturnType<
  ReturnType<RulesTestEnvironment["authenticatedContext"]>["firestore"]
>;

const bookingsOf = (
  userId: string,
  firestore: TestFirestore,
): ReturnType<ReturnType<TestFirestore["collectionGroup"]>["get"]> =>
  firestore
    .collectionGroup(BOOKINGS_COLLECTION)
    .where("customerUserId", "==", userId)
    .get();

describe("firestore.rules: customer bookings across businesses", () => {
  beforeAll(async () => {
    testEnvironment = await initializeTestEnvironment({
      firestore: { rules: readFileSync("firestore.rules", "utf8") },
      projectId: PROJECT_ID,
    });
  });

  beforeEach(async () => {
    await testEnvironment.clearFirestore();
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const adminFirestore = context.firestore();
      await adminFirestore
        .doc("businesses/business-a")
        .set({ ownerUserId: "subscriber-a", status: "active" });
      await adminFirestore
        .doc("businesses/business-b")
        .set({ ownerUserId: "subscriber-b", status: "active" });
      await adminFirestore
        .doc(BUSINESS_A_BOOKING_PATH)
        .set({ customerUserId: CUSTOMER_UID, status: "confirmed" });
      await adminFirestore
        .doc(BUSINESS_B_BOOKING_PATH)
        .set({ customerUserId: CUSTOMER_UID, status: "pending" });
      await adminFirestore
        .doc(OTHER_BOOKING_PATH)
        .set({ customerUserId: OTHER_CUSTOMER_UID, status: "confirmed" });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("lets a customer list their own bookings from every business", async () => {
    const customerFirestore = testEnvironment
      .authenticatedContext(CUSTOMER_UID, { role: "customer" })
      .firestore();

    const snapshot = await assertSucceeds(
      bookingsOf(CUSTOMER_UID, customerFirestore),
    );

    expect(
      snapshot.docs.map((bookingDocument) => bookingDocument.ref.path),
    ).toEqual(
      expect.arrayContaining([
        BUSINESS_A_BOOKING_PATH,
        BUSINESS_B_BOOKING_PATH,
      ]),
    );
    expect(snapshot.size).toBe(2);
  });

  it("denies a customer listing another customer's bookings", async () => {
    const customerFirestore = testEnvironment
      .authenticatedContext(CUSTOMER_UID, { role: "customer" })
      .firestore();

    await assertFails(bookingsOf(OTHER_CUSTOMER_UID, customerFirestore));
  });

  it("denies listing every booking without the customerUserId filter", async () => {
    const customerFirestore = testEnvironment
      .authenticatedContext(CUSTOMER_UID, { role: "customer" })
      .firestore();

    await assertFails(
      customerFirestore.collectionGroup(BOOKINGS_COLLECTION).get(),
    );
  });

  it("gives no collection group access to visitors", async () => {
    const visitorFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertFails(bookingsOf(CUSTOMER_UID, visitorFirestore));
  });

  it("gives no collection group access to a subscriber or a super admin", async () => {
    const subscriberFirestore = testEnvironment
      .authenticatedContext("subscriber-a", {
        businessId: "business-a",
        role: "subscriber",
      })
      .firestore();
    const superAdminFirestore = testEnvironment
      .authenticatedContext("admin-1", { role: "super_admin" })
      .firestore();

    await assertFails(bookingsOf(CUSTOMER_UID, subscriberFirestore));
    await assertFails(bookingsOf(CUSTOMER_UID, superAdminFirestore));
  });

  it("denies every write to a booking, even to its customer", async () => {
    const customerFirestore = testEnvironment
      .authenticatedContext(CUSTOMER_UID, { role: "customer" })
      .firestore();

    await assertFails(
      customerFirestore
        .doc(BUSINESS_A_BOOKING_PATH)
        .update({ status: "cancelled" }),
    );
  });
});
