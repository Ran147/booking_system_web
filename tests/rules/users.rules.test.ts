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

describe("firestore.rules: KAN-203 booking reminders", () => {
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
        bookingRemindersEnabled: true,
        email: "customer@example.com",
        role: "customer",
        updatedAt: new Date(),
      });
    });
  });

  afterAll(async () => testEnvironment.cleanup());

  it("AC-KAN-203-02: lets a customer update only their own reminder preference", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertSucceeds(customer.firestore().doc(USER_PATH).get());
    await assertSucceeds(
      customer.firestore().doc(USER_PATH).update({
        bookingRemindersEnabled: false,
        updatedAt: new Date(),
      }),
    );
  });

  it("AC-KAN-203-05: denies access to another user's preference", async () => {
    const otherCustomer = testEnvironment.authenticatedContext("customer-2", {
      role: "customer",
    });

    await assertFails(otherCustomer.firestore().doc(USER_PATH).get());
    await assertFails(
      otherCustomer.firestore().doc(USER_PATH).update({
        bookingRemindersEnabled: false,
        updatedAt: new Date(),
      }),
    );
  });

  it("AC-KAN-203-02: denies changes to protected user fields", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertFails(
      customer.firestore().doc(USER_PATH).update({ role: "super_admin" }),
    );
  });

  it("AC-KAN-203-02: denies a non-boolean reminder preference", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertFails(
      customer.firestore().doc(USER_PATH).update({
        bookingRemindersEnabled: "yes",
        updatedAt: new Date(),
      }),
    );
  });
});
