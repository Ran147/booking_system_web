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
// Sign-in reads the user's own profile for User.language (US-33, P-2), and
// KAN-51 lets business portal users update only their own language.
const PROJECT_ID = "demo-booking-system";
const COLLABORATOR_PROFILE_PATH = "users/collaborator-user-a";
const CUSTOMER_PROFILE_PATH = "users/customer-1";
const OTHER_PROFILE_PATH = "users/customer-2";
const SUBSCRIBER_PROFILE_PATH = "users/subscriber-a";

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

      await adminFirestore.doc(SUBSCRIBER_PROFILE_PATH).set({
        fullName: "Subscriber A",
        language: "es",
        theme: "system",
      });

      await adminFirestore.doc(COLLABORATOR_PROFILE_PATH).set({
        fullName: "Collaborator A",
        language: "es",
        theme: "system",
      });

      await adminFirestore.doc("businesses/business-inactive").set({
        ownerUserId: "subscriber-a",
        status: "inactive",
      });

      await adminFirestore
        .doc("businesses/business-a/collaborators/collaborator-a")
        .set({ status: "active" });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("KAN-169: lets an authenticated customer read their own profile", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertSucceeds(customer.firestore().doc(CUSTOMER_PROFILE_PATH).get());
  });

  it("KAN-169: denies an authenticated customer reading another profile", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertFails(customer.firestore().doc(OTHER_PROFILE_PATH).get());
  });

  it("KAN-169: denies a visitor reading a customer profile", async () => {
    const visitor = testEnvironment.unauthenticatedContext();

    await assertFails(visitor.firestore().doc(CUSTOMER_PROFILE_PATH).get());
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

  it("US-33: denies creating a profile from the client", async () => {
    const customer = testEnvironment.authenticatedContext("customer-3", {
      role: "customer",
    });

    await assertFails(
      customer
        .firestore()
        .doc("users/customer-3")
        .set({ email: "nuevo@demo.test", language: "es" }),
    );
  });

  it("KAN-51: lets a subscriber update their own language", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-a",
      role: "subscriber",
    });

    await assertSucceeds(
      subscriber
        .firestore()
        .doc(SUBSCRIBER_PROFILE_PATH)
        .update({ language: "en" }),
    );
  });

  it("KAN-51: lets an inactive business subscriber update their language", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-inactive",
      role: "subscriber",
    });

    await assertSucceeds(
      subscriber
        .firestore()
        .doc(SUBSCRIBER_PROFILE_PATH)
        .update({ language: "en" }),
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
        .doc(COLLABORATOR_PROFILE_PATH)
        .update({ language: "en" }),
    );
  });

  it("KAN-51: denies updating another user's language", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-b", {
      businessId: "business-b",
      role: "subscriber",
    });

    await assertFails(
      subscriber
        .firestore()
        .doc(SUBSCRIBER_PROFILE_PATH)
        .update({ language: "en" }),
    );
  });

  it("KAN-51: denies an unauthenticated language update", async () => {
    const visitor = testEnvironment.unauthenticatedContext();

    await assertFails(
      visitor
        .firestore()
        .doc(SUBSCRIBER_PROFILE_PATH)
        .update({ language: "en" }),
    );
  });

  it("KAN-51: does not add customer language writes before KAN-172", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertFails(
      customer
        .firestore()
        .doc(CUSTOMER_PROFILE_PATH)
        .update({ language: "es" }),
    );
  });

  it("KAN-51: denies an unsupported language", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-a",
      role: "subscriber",
    });

    await assertFails(
      subscriber
        .firestore()
        .doc(SUBSCRIBER_PROFILE_PATH)
        .update({ language: "fr" }),
    );
  });

  it("KAN-51: denies changing other user fields", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-a",
      role: "subscriber",
    });

    await assertFails(
      subscriber
        .firestore()
        .doc(SUBSCRIBER_PROFILE_PATH)
        .update({ fullName: "Changed" }),
    );
  });

  it("KAN-52: lets a subscriber update their own theme", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-a",
      role: "subscriber",
    });

    await assertSucceeds(
      subscriber
        .firestore()
        .doc(SUBSCRIBER_PROFILE_PATH)
        .update({ theme: "dark" }),
    );
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
        .doc(COLLABORATOR_PROFILE_PATH)
        .update({ theme: "dark" }),
    );
  });

  it("KAN-51/KAN-52: lets a subscriber update language and theme together", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-a",
      role: "subscriber",
    });

    await assertSucceeds(
      subscriber
        .firestore()
        .doc(SUBSCRIBER_PROFILE_PATH)
        .update({ language: "en", theme: "light" }),
    );
  });

  it("KAN-52: denies updating another user's theme", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-b", {
      businessId: "business-b",
      role: "subscriber",
    });

    await assertFails(
      subscriber
        .firestore()
        .doc(SUBSCRIBER_PROFILE_PATH)
        .update({ theme: "dark" }),
    );
  });

  it("KAN-52: denies unauthenticated theme updates", async () => {
    const visitor = testEnvironment.unauthenticatedContext();

    await assertFails(
      visitor
        .firestore()
        .doc(SUBSCRIBER_PROFILE_PATH)
        .update({ theme: "dark" }),
    );
  });

  it("KAN-52: denies an unsupported theme", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-a",
      role: "subscriber",
    });

    await assertFails(
      subscriber
        .firestore()
        .doc(SUBSCRIBER_PROFILE_PATH)
        .update({ theme: "sepia" }),
    );
  });

  it("KAN-51/KAN-52: denies preference updates with arbitrary fields", async () => {
    const subscriber = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-a",
      role: "subscriber",
    });

    await assertFails(
      subscriber
        .firestore()
        .doc(SUBSCRIBER_PROFILE_PATH)
        .update({ fullName: "Changed", language: "en", theme: "dark" }),
    );
  });
});
