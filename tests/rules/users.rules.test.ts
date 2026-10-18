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
// KAN-170 allows customers to update only editable profile fields.
const PROJECT_ID = "demo-booking-system";
const CUSTOMER_ID = "customer-1";
const OTHER_CUSTOMER_ID = "customer-2";

const CUSTOMER_PROFILE_PATH = `users/${CUSTOMER_ID}`;
const OTHER_PROFILE_PATH = `users/${OTHER_CUSTOMER_ID}`;

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
        fullName: "Ana Rodríguez",
        language: "en",
        phone: "+506 8888-8888",
        role: "customer",
      });

      await adminFirestore.doc(OTHER_PROFILE_PATH).set({
        email: "otro@demo.test",
        fullName: "Otro Cliente",
        language: "es",
        phone: "+506 7777-7777",
        role: "customer",
      });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("AC-KAN-129-02: lets a signed-in user read their own profile", async () => {
    const customer = testEnvironment.authenticatedContext(CUSTOMER_ID, {
      role: "customer",
    });

    await assertSucceeds(
      customer.firestore().doc(CUSTOMER_PROFILE_PATH).get(),
    );
  });

  it("AC-KAN-129-02: denies reading another user's profile", async () => {
    const customer = testEnvironment.authenticatedContext(CUSTOMER_ID, {
      role: "customer",
    });

    await assertFails(
      customer.firestore().doc(OTHER_PROFILE_PATH).get(),
    );
  });

  it("AC-KAN-129-02: denies reading a profile without signing in", async () => {
    const visitor = testEnvironment.unauthenticatedContext();

    await assertFails(
      visitor.firestore().doc(CUSTOMER_PROFILE_PATH).get(),
    );
  });

  it("KAN-170: allows a customer to update their name and phone", async () => {
    const customer = testEnvironment.authenticatedContext(CUSTOMER_ID, {
      role: "customer",
    });

    await assertSucceeds(
      customer.firestore().doc(CUSTOMER_PROFILE_PATH).update({
        fullName: "Ana María Rodríguez",
        phone: "+506 7777-7777",
      }),
    );
  });

  it("KAN-170: denies updates to protected fields", async () => {
    const customer = testEnvironment.authenticatedContext(CUSTOMER_ID, {
      role: "customer",
    });

    await assertFails(
      customer.firestore().doc(CUSTOMER_PROFILE_PATH).update({
        role: "subscriber",
      }),
    );

    await assertFails(
      customer.firestore().doc(CUSTOMER_PROFILE_PATH).update({
        email: "other@example.com",
      }),
    );

    await assertFails(
      customer.firestore().doc(CUSTOMER_PROFILE_PATH).update({
        language: "es",
      }),
    );
  });

  it("KAN-170: denies another customer from updating the profile", async () => {
    const otherCustomer = testEnvironment.authenticatedContext(
      OTHER_CUSTOMER_ID,
      {
        role: "customer",
      },
    );

    await assertFails(
      otherCustomer.firestore().doc(CUSTOMER_PROFILE_PATH).update({
        fullName: "Intruso",
      }),
    );
  });

  it("KAN-170: denies invalid profile values", async () => {
    const customer = testEnvironment.authenticatedContext(CUSTOMER_ID, {
      role: "customer",
    });

    await assertFails(
      customer.firestore().doc(CUSTOMER_PROFILE_PATH).update({
        fullName: "A",
      }),
    );

    await assertFails(
      customer.firestore().doc(CUSTOMER_PROFILE_PATH).update({
        phone: "invalid",
      }),
    );
  });

  it("denies creating or replacing a profile from the client", async () => {
    const customer = testEnvironment.authenticatedContext(CUSTOMER_ID, {
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