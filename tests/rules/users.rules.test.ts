// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

const PROJECT_ID = "demo-booking-system";
const COLLABORATOR_USER_PATH = "users/collaborator-user-a";
const USER_PATH = "users/subscriber-a";

let testEnvironment: RulesTestEnvironment;

describe("firestore.rules: user language", () => {
  beforeAll(async () => {
    testEnvironment = await initializeTestEnvironment({
      firestore: { rules: readFileSync("firestore.rules", "utf8") },
      projectId: PROJECT_ID,
    });
  });

  beforeEach(async () => {
    await testEnvironment.clearFirestore();
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore();
      await firestore.doc(USER_PATH).set({
        fullName: "Subscriber A",
        language: "es",
      });
      await firestore.doc(COLLABORATOR_USER_PATH).set({
        fullName: "Collaborator A",
        language: "es",
      });
      await firestore.doc("businesses/business-inactive").set({
        ownerUserId: "subscriber-a",
        status: "inactive",
      });
      await firestore
        .doc("businesses/business-a/collaborators/collaborator-a")
        .set({
          status: "active",
        });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("KAN-51: lets a subscriber update their own language", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-a",
      role: "subscriber",
    });

    await assertSucceeds(
      subscriber.firestore().doc(USER_PATH).update({ language: "en" }),
    );
  });

  it("KAN-51: lets an inactive business subscriber update their language", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-inactive",
      role: "subscriber",
    });

    await assertSucceeds(
      subscriber.firestore().doc(USER_PATH).update({ language: "en" }),
    );
  });

  it("KAN-51: lets an active collaborator update their own language", async () => {
    const collaborator = testEnvironment.authenticatedContext(
      "collaborator-user-a",
      {
        businessId: "business-a",
        collaboratorId: "collaborator-a",
        role: "collaborator",
      },
    );

    await assertSucceeds(
      collaborator
        .firestore()
        .doc(COLLABORATOR_USER_PATH)
        .update({ language: "en" }),
    );
  });

  it("KAN-51: denies updating another user's language", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-b", {
      businessId: "business-b",
      role: "subscriber",
    });

    await assertFails(
      subscriber.firestore().doc(USER_PATH).update({ language: "en" }),
    );
  });

  it("KAN-51: denies an unauthenticated language update", async () => {
    const unauthenticated = testEnvironment.unauthenticatedContext();

    await assertFails(
      unauthenticated.firestore().doc(USER_PATH).update({ language: "en" }),
    );
  });

  it("KAN-51: denies an unsupported language", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-a",
      role: "subscriber",
    });

    await assertFails(
      subscriber.firestore().doc(USER_PATH).update({ language: "fr" }),
    );
  });

  it("KAN-51: denies changing other user fields", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-a",
      role: "subscriber",
    });

    await assertFails(
      subscriber.firestore().doc(USER_PATH).update({ fullName: "Changed" }),
    );
  });
});
