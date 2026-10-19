// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

// Runs only against the emulator: npm run test:rules.
// The idle timeout is read by every signed-in user (US-38, P-2); only the
// admin stories (KAN-182) will write it.
const PROJECT_ID = "demo-booking-system";
const SETTINGS_PATH = "platformSettings/current";

let testEnvironment: RulesTestEnvironment;

describe("firestore.rules: platformSettings", () => {
  beforeAll(async () => {
    testEnvironment = await initializeTestEnvironment({
      firestore: { rules: readFileSync("firestore.rules", "utf8") },
      projectId: PROJECT_ID,
    });
  });

  beforeEach(async () => {
    await testEnvironment.clearFirestore();
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await context
        .firestore()
        .doc(SETTINGS_PATH)
        .set({ idleTimeoutMinutes: 15 });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it.each(["subscriber", "collaborator", "customer", "super_admin"])(
    "AC-KAN-38-01: lets a signed-in %s read the settings",
    async (role) => {
      const user = testEnvironment.authenticatedContext("user-1", { role });

      await assertSucceeds(user.firestore().doc(SETTINGS_PATH).get());
    },
  );

  it("denies a visitor without a session", async () => {
    const visitor = testEnvironment.unauthenticatedContext();

    await assertFails(visitor.firestore().doc(SETTINGS_PATH).get());
  });

  it.each(["subscriber", "super_admin"])(
    "denies a client write, even from a %s",
    async (role) => {
      const user = testEnvironment.authenticatedContext("user-1", { role });

      await assertFails(
        user.firestore().doc(SETTINGS_PATH).set({ idleTimeoutMinutes: 1 }),
      );
    },
  );
});
