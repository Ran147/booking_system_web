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
const ACTIVE_PLAN_PATH = "plans/plan-active";
const INACTIVE_PLAN_PATH = "plans/plan-inactive";
const SUBSCRIBED_BUSINESS_ID = "business-subscribed";
const OTHER_BUSINESS_ID = "business-other";

let testEnvironment: RulesTestEnvironment;

describe("firestore.rules: plans", () => {
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
        .doc(ACTIVE_PLAN_PATH)
        .set({ name: "Básico", status: "active" });
      await adminFirestore
        .doc(INACTIVE_PLAN_PATH)
        .set({ name: "Antiguo", status: "inactive" });
      await adminFirestore
        .doc(`businesses/${SUBSCRIBED_BUSINESS_ID}/subscription/current`)
        .set({ planId: "plan-inactive" });
      await adminFirestore.doc(`businesses/${SUBSCRIBED_BUSINESS_ID}`).set({
        ownerUserId: "subscriber-owner",
      });
      await adminFirestore
        .doc(`businesses/${OTHER_BUSINESS_ID}/subscription/current`)
        .set({ planId: "plan-active" });
      await adminFirestore.doc(`businesses/${OTHER_BUSINESS_ID}`).set({
        ownerUserId: "subscriber-other",
      });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("KAN-21: lets a visitor read an active plan and list the active plans", async () => {
    const visitorFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertSucceeds(visitorFirestore.doc(ACTIVE_PLAN_PATH).get());
    await assertSucceeds(
      visitorFirestore
        .collection("plans")
        .where("status", "==", "active")
        .get(),
    );
  });

  it("KAN-21: AC-KAN-21-05 denies a visitor reading an inactive plan", async () => {
    const visitorFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertFails(visitorFirestore.doc(INACTIVE_PLAN_PATH).get());
    await assertFails(visitorFirestore.collection("plans").get());
  });

  it("KAN-184: lets the super admin read an inactive plan", async () => {
    const superAdminFirestore = testEnvironment
      .authenticatedContext("super-admin", { role: "super_admin" })
      .firestore();

    await assertSucceeds(superAdminFirestore.doc(INACTIVE_PLAN_PATH).get());
  });

  it("KAN-40: lets a subscriber read the inactive plan of their own subscription (AC-KAN-176-06)", async () => {
    const subscriberFirestore = testEnvironment
      .authenticatedContext("subscriber-owner", {
        businessId: SUBSCRIBED_BUSINESS_ID,
        role: "subscriber",
      })
      .firestore();

    await assertSucceeds(subscriberFirestore.doc(INACTIVE_PLAN_PATH).get());
  });

  it("KAN-40: denies a subscriber reading an inactive plan they are not subscribed to", async () => {
    const otherSubscriberFirestore = testEnvironment
      .authenticatedContext("subscriber-other", {
        businessId: OTHER_BUSINESS_ID,
        role: "subscriber",
      })
      .firestore();
    const subscriberWithoutSubscriptionFirestore = testEnvironment
      .authenticatedContext("subscriber-new", {
        businessId: "business-without-subscription",
        role: "subscriber",
      })
      .firestore();

    await assertFails(otherSubscriberFirestore.doc(INACTIVE_PLAN_PATH).get());
    await assertFails(
      subscriberWithoutSubscriptionFirestore.doc(INACTIVE_PLAN_PATH).get(),
    );
  });

  it("KAN-40: denies a collaborator reading the inactive plan of their business (AS-10)", async () => {
    const collaboratorFirestore = testEnvironment
      .authenticatedContext("collaborator-1", {
        businessId: SUBSCRIBED_BUSINESS_ID,
        collaboratorId: "collaborator-1",
        role: "collaborator",
      })
      .firestore();

    await assertFails(collaboratorFirestore.doc(INACTIVE_PLAN_PATH).get());
  });

  it("KAN-181: denies writing plans from a client, even the super admin", async () => {
    const superAdminFirestore = testEnvironment
      .authenticatedContext("super-admin", { role: "super_admin" })
      .firestore();

    await assertFails(
      superAdminFirestore.doc(ACTIVE_PLAN_PATH).update({ priceInCents: 0 }),
    );
    await assertFails(
      superAdminFirestore
        .doc("plans/plan-new")
        .set({ name: "Nuevo", status: "active" }),
    );
  });
});
