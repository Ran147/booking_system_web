// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

const PROJECT_ID = "demo-booking-system-users";
const USER_PATH = "users/customer-1";

let testEnvironment: RulesTestEnvironment;

describe("firestore.rules: user profiles", () => {
  beforeAll(async () => {
    testEnvironment = await initializeTestEnvironment({
      firestore: { rules: readFileSync("firestore.rules", "utf8") },
      projectId: PROJECT_ID,
    });
  });

  beforeEach(async () => {
    await testEnvironment.clearFirestore();
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc(USER_PATH).set({
        email: "customer@example.com",
        fullName: "Ana Morales",
        phone: "+506 8888-7777",
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

    await assertSucceeds(customer.firestore().doc(USER_PATH).get());
  });

  it("KAN-169: denies an authenticated customer reading another profile", async () => {
    const otherCustomer = testEnvironment.authenticatedContext("customer-2", {
      role: "customer",
    });

    await assertFails(otherCustomer.firestore().doc(USER_PATH).get());
  });

  it("KAN-169: denies a visitor reading a customer profile", async () => {
    const visitor = testEnvironment.unauthenticatedContext();

    await assertFails(visitor.firestore().doc(USER_PATH).get());
  });

  it("KAN-169: keeps the profile read-only", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertFails(
      customer.firestore().doc(USER_PATH).update({ fullName: "Nuevo nombre" }),
    );
  });
});
