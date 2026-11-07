// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

const PROJECT_ID = "demo-booking-system";
const AUDIT_LOG_ENTRY_PATH = "auditLog/entry-1";

let testEnvironment: RulesTestEnvironment;

describe("firestore.rules: auditLog (AC-KAN-194-07)", () => {
  beforeAll(async () => {
    testEnvironment = await initializeTestEnvironment({
      firestore: { rules: readFileSync("firestore.rules", "utf8") },
      projectId: PROJECT_ID,
    });
  });

  beforeEach(async () => {
    await testEnvironment.clearFirestore();
    await testEnvironment.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc(AUDIT_LOG_ENTRY_PATH).set({
        actionType: "business_approved",
        actorEmail: "admin@platform.com",
        actorUserId: "sa-1",
        createdAt: new Date(),
        targetId: "biz-1",
        targetName: "Barbería Estilo",
        targetType: "business",
      });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("AC-KAN-194-07: allows a super_admin to read an audit log entry", async () => {
    const superAdmin = testEnvironment.authenticatedContext("sa-1", {
      role: "super_admin",
    });

    await assertSucceeds(
      superAdmin.firestore().doc(AUDIT_LOG_ENTRY_PATH).get(),
    );
  });

  it.each(["customer", "subscriber", "collaborator"])(
    "AC-KAN-194-07: denies a signed-in %s from reading an audit log entry",
    async (role) => {
      const user = testEnvironment.authenticatedContext("user-1", { role });

      await assertFails(user.firestore().doc(AUDIT_LOG_ENTRY_PATH).get());
    },
  );

  it("AC-KAN-194-07: denies an unauthenticated visitor from reading an audit log entry", async () => {
    const visitor = testEnvironment.unauthenticatedContext();

    await assertFails(visitor.firestore().doc(AUDIT_LOG_ENTRY_PATH).get());
  });

  it.each(["customer", "subscriber", "collaborator", "super_admin"])(
    "AC-KAN-194-07: denies any client write to auditLog, even for a %s",
    async (role) => {
      const user = testEnvironment.authenticatedContext("user-1", { role });

      await assertFails(
        user.firestore().doc("auditLog/entry-new").set({
          actionType: "business_approved",
          createdAt: new Date(),
        }),
      );
    },
  );
});
