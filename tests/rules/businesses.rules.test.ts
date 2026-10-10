// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

// Runs only against the emulator: npm run test:rules.
const PROJECT_ID = "demo-booking-system";
const BUSINESS_A_BOOKING_PATH = "businesses/business-a/bookings/booking-1";
const BUSINESS_A_CUSTOMER_PATH = "businesses/business-a/customers/customer-1";

let testEnvironment: RulesTestEnvironment;

const subscriberOf = (
  businessId: string,
): { businessId: string; role: string } => ({
  businessId,
  role: "subscriber",
});

describe("firestore.rules: tenant isolation", () => {
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
        .doc(BUSINESS_A_BOOKING_PATH)
        .set({ customerUserId: "customer-1", status: "confirmed" });
      await adminFirestore
        .doc(BUSINESS_A_CUSTOMER_PATH)
        .set({ status: "active" });
      await adminFirestore
        .doc("businesses/business-pending")
        .set({ ownerUserId: "subscriber-pending", status: "pending" });
      await adminFirestore
        .doc("businesses/business-inactive")
        .set({ ownerUserId: "subscriber-inactive", status: "inactive" });
      await adminFirestore
        .doc("businesses/business-suspended")
        .set({ ownerUserId: "subscriber-suspended", status: "suspended" });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("lets a subscriber read their own business's bookings", async () => {
    const subscriberA = testEnvironment.authenticatedContext(
      "subscriber-a",
      subscriberOf("business-a"),
    );

    await assertSucceeds(
      subscriberA.firestore().doc(BUSINESS_A_BOOKING_PATH).get(),
    );
  });

  it("denies a subscriber reading another business's bookings", async () => {
    const subscriberB = testEnvironment.authenticatedContext(
      "subscriber-b",
      subscriberOf("business-b"),
    );

    await assertFails(
      subscriberB.firestore().doc(BUSINESS_A_BOOKING_PATH).get(),
    );
  });

  it("denies a subscriber reading another business's customers", async () => {
    const subscriberB = testEnvironment.authenticatedContext(
      "subscriber-b",
      subscriberOf("business-b"),
    );

    await assertFails(
      subscriberB.firestore().doc(BUSINESS_A_CUSTOMER_PATH).get(),
    );
  });

  it("KAN-33: denies a subscriber of a pending business creating a service", async () => {
    const pendingSubscriber = testEnvironment.authenticatedContext(
      "subscriber-pending",
      subscriberOf("business-pending"),
    );

    await assertFails(
      pendingSubscriber
        .firestore()
        .doc("businesses/business-pending/services/service-1")
        .set({ name: "Corte", status: "active" }),
    );
  });

  it("PROP-1: denies a subscriber approving their own pending business", async () => {
    const pendingSubscriber = testEnvironment.authenticatedContext(
      "subscriber-pending",
      subscriberOf("business-pending"),
    );

    await assertFails(
      pendingSubscriber
        .firestore()
        .doc("businesses/business-pending")
        .update({ status: "active" }),
    );
  });

  it("denies a visitor reading a business's bookings", async () => {
    const visitor = testEnvironment.unauthenticatedContext();

    await assertFails(visitor.firestore().doc(BUSINESS_A_BOOKING_PATH).get());
  });

  it("KAN-101: lets the active owner update only the exact alert settings", async () => {
    const owner = testEnvironment.authenticatedContext(
      "subscriber-a",
      subscriberOf("business-a"),
    );
    await assertSucceeds(
      owner
        .firestore()
        .doc("businesses/business-a")
        .update({
          alertSettings: {
            bookingCancelledByCustomer: true,
            bookingCreated: false,
            subscriptionEnding: true,
          },
        }),
    );
  });

  it.each([
    ["another subscriber", "subscriber-b", subscriberOf("business-b")],
    [
      "collaborator",
      "collaborator-a",
      {
        businessId: "business-a",
        collaboratorId: "collaborator-a",
        role: "collaborator",
      },
    ],
    ["customer", "customer-a", { role: "customer" }],
    ["super admin", "admin-a", { role: "super_admin" }],
  ])(
    "KAN-101: denies %s changing alert settings",
    async (_name, uid, claims) => {
      const actor = testEnvironment.authenticatedContext(uid, claims);
      await assertFails(
        actor
          .firestore()
          .doc("businesses/business-a")
          .update({
            alertSettings: {
              bookingCancelledByCustomer: true,
              bookingCreated: false,
              subscriptionEnding: true,
            },
          }),
      );
    },
  );

  it("KAN-101: denies changes for a non-active business", async () => {
    const owner = testEnvironment.authenticatedContext(
      "subscriber-inactive",
      subscriberOf("business-inactive"),
    );
    await assertFails(
      owner
        .firestore()
        .doc("businesses/business-inactive")
        .update({
          alertSettings: {
            bookingCancelledByCustomer: true,
            bookingCreated: true,
            subscriptionEnding: true,
          },
        }),
    );
  });

  it("KAN-101: denies changes for a suspended business", async () => {
    const owner = testEnvironment.authenticatedContext(
      "subscriber-suspended",
      subscriberOf("business-suspended"),
    );
    await assertFails(
      owner
        .firestore()
        .doc("businesses/business-suspended")
        .update({
          alertSettings: {
            bookingCancelledByCustomer: true,
            bookingCreated: true,
            subscriptionEnding: true,
          },
        }),
    );
  });

  it.each([
    {
      bookingCancelledByCustomer: true,
      bookingCreated: "yes",
      subscriptionEnding: true,
    },
    {
      bookingCancelledByCustomer: true,
      bookingCreated: true,
      extra: true,
      subscriptionEnding: true,
    },
  ])(
    "KAN-101: rejects an invalid alert settings map",
    async (alertSettings) => {
      const owner = testEnvironment.authenticatedContext(
        "subscriber-a",
        subscriberOf("business-a"),
      );
      await assertFails(
        owner
          .firestore()
          .doc("businesses/business-a")
          .update({ alertSettings }),
      );
    },
  );

  it("KAN-101: denies changing another business field", async () => {
    const owner = testEnvironment.authenticatedContext(
      "subscriber-a",
      subscriberOf("business-a"),
    );
    await assertFails(
      owner
        .firestore()
        .doc("businesses/business-a")
        .update({ name: "Changed" }),
    );
  });
});
