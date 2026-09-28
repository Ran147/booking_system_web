// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

// Runs only against the emulator: npm run test:rules.
// Collaborator reads inside their own business (Q1, KAN-86).
const PROJECT_ID = "demo-booking-system";
const BUSINESS_A_PATH = "businesses/business-a";
const OWN_BOOKING_PATH = `${BUSINESS_A_PATH}/bookings/booking-own`;
const OTHER_BOOKING_PATH = `${BUSINESS_A_PATH}/bookings/booking-other`;
const INACTIVE_SERVICE_PATH = `${BUSINESS_A_PATH}/services/service-inactive`;
const CUSTOMER_PATH = `${BUSINESS_A_PATH}/customers/customer-1`;
const BARBER_RECORD_PATH = `${BUSINESS_A_PATH}/collaborators/collaborator-barber`;
const MANAGER_RECORD_PATH = `${BUSINESS_A_PATH}/collaborators/collaborator-manager`;
const FORMER_RECORD_PATH = `${BUSINESS_A_PATH}/collaborators/collaborator-former`;
const BUSINESS_B_BOOKING_PATH = "businesses/business-b/bookings/booking-b";

let testEnvironment: RulesTestEnvironment;

const collaboratorClaims = (
  businessId: string,
  collaboratorId: string,
): { businessId: string; collaboratorId: string; role: string } => ({
  businessId,
  collaboratorId,
  role: "collaborator",
});

const signInAsBarber = (): ReturnType<
  RulesTestEnvironment["authenticatedContext"]
> =>
  testEnvironment.authenticatedContext(
    "user-barber",
    collaboratorClaims("business-a", "collaborator-barber"),
  );

const signInAsManager = (): ReturnType<
  RulesTestEnvironment["authenticatedContext"]
> =>
  testEnvironment.authenticatedContext(
    "user-manager",
    collaboratorClaims("business-a", "collaborator-manager"),
  );

describe("firestore.rules: collaborators", () => {
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
        .doc(BUSINESS_A_PATH)
        .set({ ownerUserId: "subscriber-a", status: "active" });
      await adminFirestore.doc(BARBER_RECORD_PATH).set({
        permissions: [],
        status: "active",
        userId: "user-barber",
      });
      await adminFirestore.doc(MANAGER_RECORD_PATH).set({
        permissions: ["manage_bookings", "manage_customers"],
        status: "active",
        userId: "user-manager",
      });
      await adminFirestore.doc(FORMER_RECORD_PATH).set({
        permissions: ["manage_bookings"],
        status: "inactive",
        userId: "user-former",
      });
      await adminFirestore.doc(OWN_BOOKING_PATH).set({
        collaboratorId: "collaborator-barber",
        status: "confirmed",
      });
      await adminFirestore.doc(OTHER_BOOKING_PATH).set({
        collaboratorId: "collaborator-manager",
        status: "confirmed",
      });
      await adminFirestore
        .doc(INACTIVE_SERVICE_PATH)
        .set({ status: "inactive" });
      await adminFirestore.doc(CUSTOMER_PATH).set({ status: "active" });
      await adminFirestore
        .doc(BUSINESS_B_BOOKING_PATH)
        .set({ collaboratorId: "collaborator-barber", status: "confirmed" });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("KAN-86: lets a collaborator read their own bookings", async () => {
    await assertSucceeds(
      signInAsBarber().firestore().doc(OWN_BOOKING_PATH).get(),
    );
  });

  it("KAN-86: denies reading another collaborator's booking without manage_bookings", async () => {
    await assertFails(
      signInAsBarber().firestore().doc(OTHER_BOOKING_PATH).get(),
    );
  });

  it("KAN-86: lets a collaborator with manage_bookings read every booking of the business", async () => {
    await assertSucceeds(
      signInAsManager().firestore().doc(OWN_BOOKING_PATH).get(),
    );
  });

  it("KAN-81: denies every read to a deactivated collaborator", async () => {
    const formerCollaborator = testEnvironment.authenticatedContext(
      "user-former",
      collaboratorClaims("business-a", "collaborator-former"),
    );

    await assertFails(
      formerCollaborator.firestore().doc(OWN_BOOKING_PATH).get(),
    );
    await assertFails(
      formerCollaborator.firestore().doc(FORMER_RECORD_PATH).get(),
    );
  });

  it("KAN-86: denies a collaborator reading another business's bookings", async () => {
    await assertFails(
      signInAsBarber().firestore().doc(BUSINESS_B_BOOKING_PATH).get(),
    );
  });

  it("KAN-86: lets a collaborator read the inactive services of their business", async () => {
    await assertSucceeds(
      signInAsBarber().firestore().doc(INACTIVE_SERVICE_PATH).get(),
    );
  });

  it("KAN-86: gates customer reads behind manage_customers", async () => {
    await assertFails(signInAsBarber().firestore().doc(CUSTOMER_PATH).get());
    await assertSucceeds(
      signInAsManager().firestore().doc(CUSTOMER_PATH).get(),
    );
  });

  it("KAN-83: lets a collaborator read only their own collaborator record", async () => {
    await assertSucceeds(
      signInAsBarber().firestore().doc(BARBER_RECORD_PATH).get(),
    );
    await assertFails(
      signInAsBarber().firestore().doc(MANAGER_RECORD_PATH).get(),
    );
  });

  it("KAN-83: lets the subscriber read their business's collaborators", async () => {
    const subscriberA = testEnvironment.authenticatedContext("subscriber-a", {
      businessId: "business-a",
      role: "subscriber",
    });

    await assertSucceeds(
      subscriberA.firestore().doc(MANAGER_RECORD_PATH).get(),
    );
  });

  it("KAN-86: denies a collaborator changing their own permissions", async () => {
    await assertFails(
      signInAsBarber()
        .firestore()
        .doc(BARBER_RECORD_PATH)
        .update({ permissions: ["manage_bookings"] }),
    );
  });

  it("KAN-83: denies a customer reading a business's collaborators", async () => {
    const customer = testEnvironment.authenticatedContext("customer-1", {
      role: "customer",
    });

    await assertFails(customer.firestore().doc(BARBER_RECORD_PATH).get());
  });
});
