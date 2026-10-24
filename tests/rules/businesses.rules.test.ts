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
        .doc("businesses/business-a/subscription/current")
        .set({ planId: "plan-pro", status: "active" });
      await adminFirestore
        .doc("businesses/business-a/collaborators/collaborator-1")
        .set({ permissions: [], status: "active" });
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

  it("KAN-199: lets the owner update only public profile fields", async () => {
    const subscriberA = testEnvironment.authenticatedContext(
      "subscriber-a",
      subscriberOf("business-a"),
    );

    await assertSucceeds(
      subscriberA.firestore().doc("businesses/business-a").update({
        contactEmail: "contact@example.com",
        name: "Updated business",
        socialLinks: [],
      }),
    );
  });

  it("KAN-199: denies changing protected business fields", async () => {
    const subscriberA = testEnvironment.authenticatedContext(
      "subscriber-a",
      subscriberOf("business-a"),
    );

    await assertFails(
      subscriberA
        .firestore()
        .doc("businesses/business-a")
        .update({ slug: "another-slug" }),
    );
  });

  it("KAN-199: denies updating another subscriber's public profile", async () => {
    const subscriberB = testEnvironment.authenticatedContext(
      "subscriber-b",
      subscriberOf("business-b"),
    );

    await assertFails(
      subscriberB
        .firestore()
        .doc("businesses/business-a")
        .update({ name: "Stolen business" }),
    );
  });

  it.each([
    ["an empty name", { name: "" }],
    ["an oversized name", { name: "n".repeat(121) }],
    ["an oversized description", { description: "d".repeat(1_001) }],
    ["an empty optional field instead of null", { description: "" }],
    ["an invalid email", { contactEmail: "invalid-email" }],
    ["an invalid phone", { contactPhone: "123" }],
    [
      "a non-HTTPS social URL",
      {
        socialLinks: [{ network: "facebook", url: "http://example.com" }],
      },
    ],
    [
      "an unsupported social network",
      {
        socialLinks: [{ network: "other", url: "https://example.com" }],
      },
    ],
    [
      "more than five social links",
      {
        socialLinks: Array.from({ length: 6 }, (_, index) => ({
          network: "website",
          url: `https://example.com/${index}`,
        })),
      },
    ],
    ["an invalid profile field type", { description: 42 }],
  ])("KAN-199: denies %s", async (_caseName, invalidUpdate) => {
    const subscriberA = testEnvironment.authenticatedContext(
      "subscriber-a",
      subscriberOf("business-a"),
    );

    await assertFails(
      subscriberA
        .firestore()
        .doc("businesses/business-a")
        .update(invalidUpdate),
    );
  });

  it("KAN-40: lets a subscriber read their own business subscription", async () => {
    const subscriberA = testEnvironment.authenticatedContext(
      "subscriber-a",
      subscriberOf("business-a"),
    );

    await assertSucceeds(
      subscriberA
        .firestore()
        .doc("businesses/business-a/subscription/current")
        .get(),
    );
  });

  it("KAN-40: denies a subscriber reading another business subscription", async () => {
    const subscriberB = testEnvironment.authenticatedContext(
      "subscriber-b",
      subscriberOf("business-b"),
    );

    await assertFails(
      subscriberB
        .firestore()
        .doc("businesses/business-a/subscription/current")
        .get(),
    );
  });

  it("KAN-40: denies a collaborator reading the business subscription (AS-10)", async () => {
    const collaborator = testEnvironment.authenticatedContext(
      "collaborator-1",
      {
        businessId: "business-a",
        collaboratorId: "collaborator-1",
        role: "collaborator",
      },
    );

    await assertFails(
      collaborator
        .firestore()
        .doc("businesses/business-a/subscription/current")
        .get(),
    );
  });

  it("KAN-40: denies client writes to the business subscription", async () => {
    const subscriberA = testEnvironment.authenticatedContext(
      "subscriber-a",
      subscriberOf("business-a"),
    );

    await assertFails(
      subscriberA
        .firestore()
        .doc("businesses/business-a/subscription/current")
        .update({ status: "cancelled" }),
    );
  });

  it("denies a visitor reading a business's bookings", async () => {
    const visitor = testEnvironment.unauthenticatedContext();

    await assertFails(visitor.firestore().doc(BUSINESS_A_BOOKING_PATH).get());
  });

  const validReminderSettings = {
    isEnabled: true,
    leadTimesMinutes: [60, 1440],
  };

  it("KAN-100: lets the active owner update only reminder settings", async () => {
    const owner = testEnvironment.authenticatedContext(
      "subscriber-a",
      subscriberOf("business-a"),
    );
    await assertSucceeds(
      owner
        .firestore()
        .doc("businesses/business-a")
        .update({ reminderSettings: validReminderSettings }),
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
    "KAN-100: denies %s changing reminder settings",
    async (_name, uid, claims) => {
      const actor = testEnvironment.authenticatedContext(uid, claims);
      await assertFails(
        actor
          .firestore()
          .doc("businesses/business-a")
          .update({ reminderSettings: validReminderSettings }),
      );
    },
  );

  it.each(["inactive", "suspended"])(
    "KAN-100: denies a %s business owner",
    async (status) => {
      const owner = testEnvironment.authenticatedContext(
        `subscriber-${status}`,
        subscriberOf(`business-${status}`),
      );
      await assertFails(
        owner
          .firestore()
          .doc(`businesses/business-${status}`)
          .update({ reminderSettings: validReminderSettings }),
      );
    },
  );

  it.each([
    { isEnabled: "yes", leadTimesMinutes: [60] },
    { isEnabled: true, leadTimesMinutes: [60, 120, 720] },
    { isEnabled: true, leadTimesMinutes: [30] },
    { isEnabled: true, leadTimesMinutes: [60, 60] },
    { extra: true, isEnabled: true, leadTimesMinutes: [60] },
  ])("KAN-100: rejects invalid reminder settings", async (reminderSettings) => {
    const owner = testEnvironment.authenticatedContext(
      "subscriber-a",
      subscriberOf("business-a"),
    );
    await assertFails(
      owner
        .firestore()
        .doc("businesses/business-a")
        .update({ reminderSettings }),
    );
  });

  it("KAN-100: rejects changing another business field", async () => {
    const owner = testEnvironment.authenticatedContext(
      "subscriber-a",
      subscriberOf("business-a"),
    );
    await assertFails(
      owner
        .firestore()
        .doc("businesses/business-a")
        .update({ name: "Changed", reminderSettings: validReminderSettings }),
    );
  });
});
