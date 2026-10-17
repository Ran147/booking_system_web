// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

// Runs only against the emulator: npm run test:rules.
// Sign-in reads the user's own profile for User.language (US-33, P-2).
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
      await adminFirestore
        .doc(CUSTOMER_PROFILE_PATH)
        .set({ email: "cliente@demo.test", language: "en" });
      await adminFirestore
        .doc(OTHER_PROFILE_PATH)
        .set({ email: "otro@demo.test", language: "es" });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("AC-KAN-129-02: lets a signed-in user read their own profile", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertSucceeds(customer.firestore().doc(CUSTOMER_PROFILE_PATH).get());
  });

  it("AC-KAN-129-02: denies reading another user's profile", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertFails(customer.firestore().doc(OTHER_PROFILE_PATH).get());
  });

  it("AC-KAN-129-02: denies reading a profile without signing in", async () => {
    const visitor = testEnvironment.unauthenticatedContext();

    await assertFails(visitor.firestore().doc(CUSTOMER_PROFILE_PATH).get());
  });

  it("denies writing a profile from the client", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertFails(
      customer
        .firestore()
        .doc(CUSTOMER_PROFILE_PATH)
        .set({ email: "cliente@demo.test", language: "es" }),
    );
  });
});
