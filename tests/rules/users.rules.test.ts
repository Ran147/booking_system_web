// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

// Runs only against the emulator: npm run test:rules.
// KAN-169: a customer can read only their own user profile.
const PROJECT_ID = "demo-booking-system";
const CUSTOMER_PROFILE_PATH = "users/customer-1";
const OTHER_PROFILE_PATH = "users/customer-2";

let testEnvironment: RulesTestEnvironment;

describe("firestore.rules: users", () => {
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

      await adminFirestore.doc(CUSTOMER_PROFILE_PATH).set({
        email: "cliente@demo.test",
        fullName: "Ana Morales",
        language: "en",
        phone: "+506 8888-7777",
      });

      await adminFirestore.doc(OTHER_PROFILE_PATH).set({
        email: "otro@demo.test",
        fullName: "Otro Cliente",
        language: "es",
        phone: "+506 8777-6666",
      });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("KAN-169: lets an authenticated customer read their own profile", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertSucceeds(
      customer.firestore().doc(CUSTOMER_PROFILE_PATH).get(),
    );
  });

  it("KAN-169: denies an authenticated customer reading another profile", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertFails(
      customer.firestore().doc(OTHER_PROFILE_PATH).get(),
    );
  });

  it("KAN-169: denies a visitor reading a customer profile", async () => {
    const visitor = testEnvironment.unauthenticatedContext();

    await assertFails(
      visitor.firestore().doc(CUSTOMER_PROFILE_PATH).get(),
    );
  });

  it("KAN-169: keeps the profile read-only", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertFails(
      customer
        .firestore()
        .doc(CUSTOMER_PROFILE_PATH)
        .update({ fullName: "Nuevo nombre" }),
    );
  });
});