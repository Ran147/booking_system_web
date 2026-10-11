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

describe("firestore.rules: KAN-173 user theme", () => {
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
        role: "customer",
        theme: "system",
        updatedAt: new Date(),
      });
    });
  });

  afterAll(async () => testEnvironment.cleanup());

  it("AC-KAN-173-01: lets a customer read and update their own valid theme", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertSucceeds(customer.firestore().doc(USER_PATH).get());
    await assertSucceeds(
      customer
        .firestore()
        .doc(USER_PATH)
        .update({ theme: "dark", updatedAt: new Date() }),
    );
  });

  it("AC-KAN-173-01: denies changes to protected user fields", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertFails(
      customer.firestore().doc(USER_PATH).update({ role: "super_admin" }),
    );
  });

  it("AC-KAN-173-02: denies reading or updating another user", async () => {
    const otherCustomer = testEnvironment.authenticatedContext("customer-2", {
      role: "customer",
    });

    await assertFails(otherCustomer.firestore().doc(USER_PATH).get());
    await assertFails(
      otherCustomer
        .firestore()
        .doc(USER_PATH)
        .update({ theme: "light", updatedAt: new Date() }),
    );
  });

  it("AC-KAN-173-01: denies an unsupported theme", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertFails(
      customer
        .firestore()
        .doc(USER_PATH)
        .update({ theme: "custom", updatedAt: new Date() }),
    );
  });
});
