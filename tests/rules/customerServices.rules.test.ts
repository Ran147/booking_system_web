// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, type Firestore } from "firebase/firestore";

// Runs only against the emulator: npm run test:rules.
// The booking flow reads one service by id (KAN-140-03).
const PROJECT_ID = "demo-booking-system";
const SERVICES_PATH = "businesses/business-a/services";

let testEnvironment: RulesTestEnvironment;

const customerFirestore = (): Firestore =>
  testEnvironment
    .authenticatedContext("customer-a", { role: "customer" })
    .firestore() as unknown as Firestore;

describe("firestore.rules: a customer reading a service of the booking flow", () => {
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
        .doc("businesses/business-a")
        .set({ ownerUserId: "subscriber-a", status: "active" });
      await adminFirestore
        .doc(`${SERVICES_PATH}/service-active`)
        .set({ name: "Corte", status: "active" });
      await adminFirestore
        .doc(`${SERVICES_PATH}/service-inactive`)
        .set({ name: "Barba", status: "inactive" });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("AC-KAN-140-03: a customer reads an active service of the booking flow", async () => {
    await assertSucceeds(
      getDoc(doc(customerFirestore(), SERVICES_PATH, "service-active")),
    );
  });

  // The booking flow treats this denial as "service unavailable".
  it("AC-KAN-140-03: a deactivated or missing service is denied to a customer", async () => {
    await assertFails(
      getDoc(doc(customerFirestore(), SERVICES_PATH, "service-inactive")),
    );
    await assertFails(
      getDoc(doc(customerFirestore(), SERVICES_PATH, "service-missing")),
    );
  });
});
