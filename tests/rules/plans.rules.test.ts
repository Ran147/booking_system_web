// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

// Runs only against the emulator: npm run test:rules.
const PROJECT_ID = "demo-booking-system";
const ACTIVE_PLAN_PATH = "plans/plan-active";
const INACTIVE_PLAN_PATH = "plans/plan-inactive";

let testEnvironment: RulesTestEnvironment;

describe("firestore.rules: plans", () => {
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
        .doc(ACTIVE_PLAN_PATH)
        .set({ name: "Básico", status: "active" });
      await adminFirestore
        .doc(INACTIVE_PLAN_PATH)
        .set({ name: "Antiguo", status: "inactive" });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("KAN-21: lets a visitor read an active plan and list the active plans", async () => {
    const visitorFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertSucceeds(visitorFirestore.doc(ACTIVE_PLAN_PATH).get());
    await assertSucceeds(
      visitorFirestore
        .collection("plans")
        .where("status", "==", "active")
        .get(),
    );
  });

  it("KAN-21: AC-KAN-21-05 denies a visitor reading an inactive plan", async () => {
    const visitorFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertFails(visitorFirestore.doc(INACTIVE_PLAN_PATH).get());
    await assertFails(visitorFirestore.collection("plans").get());
  });

  it("KAN-184: lets the super admin read an inactive plan", async () => {
    const superAdminFirestore = testEnvironment
      .authenticatedContext("super-admin", { role: "super_admin" })
      .firestore();

    await assertSucceeds(superAdminFirestore.doc(INACTIVE_PLAN_PATH).get());
  });

  it("KAN-181: denies writing plans from a client, even the super admin", async () => {
    const superAdminFirestore = testEnvironment
      .authenticatedContext("super-admin", { role: "super_admin" })
      .firestore();

    await assertFails(
      superAdminFirestore.doc(ACTIVE_PLAN_PATH).update({ priceInCents: 0 }),
    );
    await assertFails(
      superAdminFirestore
        .doc("plans/plan-new")
        .set({ name: "Nuevo", status: "active" }),
    );
  });
});
