// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

const PROJECT_ID = "demo-booking-system";
const USER_ID = "customer-user";
const USER_PATH = `users/${USER_ID}`;
let testEnvironment: RulesTestEnvironment;

describe("firestore.rules: customer profile (KAN-170)", () => {
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
        email: "ana@example.com",
        fullName: "Ana Rodríguez",
        phone: "+506 8888-8888",
        role: "customer",
      });
    });
  });

  afterAll(async () => testEnvironment.cleanup());

  it("allows a customer to read and update only their name and phone", async () => {
    const firestore = testEnvironment
      .authenticatedContext(USER_ID, {
        role: "customer",
      })
      .firestore();

    await assertSucceeds(firestore.doc(USER_PATH).get());
    await assertSucceeds(
      firestore.doc(USER_PATH).update({
        fullName: "Ana María Rodríguez",
        phone: "+506 7777-7777",
      }),
    );
  });

  it("denies updates to protected fields", async () => {
    const firestore = testEnvironment
      .authenticatedContext(USER_ID, {
        role: "customer",
      })
      .firestore();

    await assertFails(firestore.doc(USER_PATH).update({ role: "subscriber" }));
    await assertFails(
      firestore.doc(USER_PATH).update({ email: "other@example.com" }),
    );
  });

  it("denies another customer and unauthenticated access", async () => {
    const otherCustomer = testEnvironment
      .authenticatedContext("other-user", {
        role: "customer",
      })
      .firestore();
    const unauthenticated = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertFails(otherCustomer.doc(USER_PATH).get());
    await assertFails(
      otherCustomer.doc(USER_PATH).update({ fullName: "Intruso" }),
    );
    await assertFails(unauthenticated.doc(USER_PATH).get());
  });

  it("denies invalid profile values", async () => {
    const firestore = testEnvironment
      .authenticatedContext(USER_ID, {
        role: "customer",
      })
      .firestore();

    await assertFails(firestore.doc(USER_PATH).update({ fullName: "A" }));
    await assertFails(firestore.doc(USER_PATH).update({ phone: "invalid" }));
  });
});
