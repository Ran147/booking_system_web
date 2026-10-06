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

describe("firestore.rules: user theme", () => {
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
        fullName: "Subscriber A",
        theme: "system",
      });
      await context.firestore().doc(COLLABORATOR_USER_PATH).set({
        fullName: "Collaborator A",
        theme: "system",
      });
      await context
        .firestore()
        .doc("businesses/business-a/collaborators/collaborator-a")
        .set({ status: "active" });
    });
  });

  it("KAN-52: lets an active collaborator update their own theme", async () => {
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
        .update({ theme: "dark" }),
    );
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("KAN-52: lets a subscriber update only their own theme", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-inactive",
      role: "subscriber",
    });

    await assertSucceeds(
      subscriber.firestore().doc(USER_PATH).update({ theme: "dark" }),
    );
  });

  it("KAN-52: denies updating another user's theme", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-b", {
      businessId: "business-b",
      role: "subscriber",
    });

    await assertFails(
      subscriber.firestore().doc(USER_PATH).update({ theme: "dark" }),
    );
  });

  it("KAN-52: denies an unauthenticated theme update", async () => {
    await assertFails(
      testEnvironment
        .unauthenticatedContext()
        .firestore()
        .doc(USER_PATH)
        .update({ theme: "dark" }),
    );
  });

  it("KAN-52: denies an unsupported theme", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-a",
      role: "subscriber",
    });

    await assertFails(
      subscriber.firestore().doc(USER_PATH).update({ theme: "sepia" }),
    );
  });

  it("KAN-52: denies changing another user field with the theme", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-a",
      role: "subscriber",
    });

    await assertFails(
      subscriber
        .firestore()
        .doc(USER_PATH)
        .update({ fullName: "Changed", theme: "light" }),
    );
  });
});
