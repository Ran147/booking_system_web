// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

// Runs only against the emulator: npm run test:rules.
// The sign-up documents (KAN-25) are written only by Cloud Functions with the
// Admin SDK: no client may read or write them, not even the new owner.
const PROJECT_ID = "demo-booking-system";
const PLAN_CHECKOUT_PATH = "planCheckouts/checkout-1";
const BUSINESS_SLUG_PATH = "businessSlugs/barberia-centro";
const USER_PATH = "users/subscriber-a";

let testEnvironment: RulesTestEnvironment;

describe("firestore.rules: subscriber sign-up documents", () => {
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
      await adminFirestore.doc(PLAN_CHECKOUT_PATH).set({
        email: "owner@example.com",
        signUpCompletedAt: null,
        signUpTokenHash: "hash",
      });
      await adminFirestore
        .doc(BUSINESS_SLUG_PATH)
        .set({ businessId: "business-a" });
      await adminFirestore
        .doc(USER_PATH)
        .set({ email: "owner@example.com", fullName: "Ana Pérez" });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("KAN-25: denies a visitor reading or querying plan checkouts", async () => {
    const visitorFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertFails(visitorFirestore.doc(PLAN_CHECKOUT_PATH).get());
    await assertFails(
      visitorFirestore
        .collection("planCheckouts")
        .where("signUpTokenHash", "==", "hash")
        .get(),
    );
  });

  it("KAN-25: denies a visitor marking a plan checkout as used", async () => {
    const visitorFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertFails(
      visitorFirestore
        .doc(PLAN_CHECKOUT_PATH)
        .update({ signUpCompletedAt: new Date() }),
    );
  });

  it("KAN-25: denies a visitor reading or taking a business slug", async () => {
    const visitorFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertFails(visitorFirestore.doc(BUSINESS_SLUG_PATH).get());
    await assertFails(
      visitorFirestore
        .doc("businessSlugs/nuevo-negocio")
        .set({ businessId: "business-b" }),
    );
  });

  it("KAN-25: denies a visitor creating a business without the sign-up function", async () => {
    const visitorFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertFails(
      visitorFirestore
        .doc("businesses/business-b")
        .set({ ownerUserId: "visitor", status: "active" }),
    );
  });

  it("KAN-25: denies a subscriber reading or writing user profiles and plan checkouts", async () => {
    const subscriberFirestore = testEnvironment
      .authenticatedContext("subscriber-a", {
        businessId: "business-a",
        role: "subscriber",
      })
      .firestore();

    await assertFails(subscriberFirestore.doc(USER_PATH).get());
    await assertFails(
      subscriberFirestore.doc(USER_PATH).update({ fullName: "Otra Persona" }),
    );
    await assertFails(subscriberFirestore.doc(PLAN_CHECKOUT_PATH).get());
  });
});
