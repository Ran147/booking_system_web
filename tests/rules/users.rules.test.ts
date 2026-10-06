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

describe("firestore.rules: language preference (KAN-172)", () => {
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
        language: "es",
        role: "customer",
      });
    });
  });

  afterAll(async () => testEnvironment.cleanup());

  it("allows a customer to read and update their own language", async () => {
    const firestore = testEnvironment
      .authenticatedContext(USER_ID, {
        role: "customer",
      })
      .firestore();

    await assertSucceeds(firestore.doc(USER_PATH).get());
    await assertSucceeds(firestore.doc(USER_PATH).update({ language: "en" }));
  });

  it("denies unsupported languages and protected-field changes", async () => {
    const firestore = testEnvironment
      .authenticatedContext(USER_ID, {
        role: "customer",
      })
      .firestore();

    await assertFails(firestore.doc(USER_PATH).update({ language: "fr" }));
    await assertFails(firestore.doc(USER_PATH).update({ role: "subscriber" }));
  });

  it("denies access to another customer's user document", async () => {
    const otherCustomer = testEnvironment
      .authenticatedContext("other-user", {
        role: "customer",
      })
      .firestore();

    await assertFails(otherCustomer.doc(USER_PATH).get());
    await assertFails(otherCustomer.doc(USER_PATH).update({ language: "en" }));
  });

  it("denies unauthenticated access", async () => {
    const firestore = testEnvironment.unauthenticatedContext().firestore();

    await assertFails(firestore.doc(USER_PATH).get());
    await assertFails(firestore.doc(USER_PATH).update({ language: "en" }));
  });
});
