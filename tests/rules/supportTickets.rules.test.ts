// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

// Runs only against the emulator: npm run test:rules.
// Support tickets (KAN-189, KAN-190, KAN-192).
// Super admin reads any ticket; subscribers read only tickets belonging to
// their own business (AC-KAN-190-07). Writes are forbidden from clients
// (AC-KAN-192-06) because mutations run server-side via Cloud Functions.
const PROJECT_ID = "demo-booking-system";
const BUSINESS_A_ID = "business-a";
const BUSINESS_B_ID = "business-b";
const TICKET_A_PATH = "supportTickets/ticket-a";
const TICKET_B_PATH = "supportTickets/ticket-b";

let testEnvironment: RulesTestEnvironment;

describe("firestore.rules: supportTickets", () => {
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
      await adminFirestore.doc(`businesses/${BUSINESS_A_ID}`).set({
        name: "Business A",
        ownerUserId: "subscriber-a",
        status: "active",
      });
      await adminFirestore.doc(`businesses/${BUSINESS_B_ID}`).set({
        name: "Business B",
        ownerUserId: "subscriber-b",
        status: "active",
      });
      await adminFirestore.doc(TICKET_A_PATH).set({
        businessId: BUSINESS_A_ID,
        createdByUserId: "subscriber-a",
        message: "Consulta sobre facturación",
        status: "open",
        subject: "Factura",
      });
      await adminFirestore.doc(TICKET_B_PATH).set({
        businessId: BUSINESS_B_ID,
        createdByUserId: "subscriber-b",
        message: "Error de configuración",
        status: "open",
        subject: "Configuración",
      });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("AC-KAN-190-07: lets a super admin read any support ticket", async () => {
    const superAdminFirestore = testEnvironment
      .authenticatedContext("super-admin-uid", { role: "super_admin" })
      .firestore();

    await assertSucceeds(superAdminFirestore.doc(TICKET_A_PATH).get());
    await assertSucceeds(superAdminFirestore.doc(TICKET_B_PATH).get());
  });

  it("AC-KAN-190-07: lets a subscriber read a ticket of their own business", async () => {
    const subscriberFirestore = testEnvironment
      .authenticatedContext("subscriber-a", {
        businessId: BUSINESS_A_ID,
        role: "subscriber",
      })
      .firestore();

    await assertSucceeds(subscriberFirestore.doc(TICKET_A_PATH).get());
  });

  it("AC-KAN-190-07: denies a subscriber reading a ticket of another business", async () => {
    const subscriberFirestore = testEnvironment
      .authenticatedContext("subscriber-a", {
        businessId: BUSINESS_A_ID,
        role: "subscriber",
      })
      .firestore();

    await assertFails(subscriberFirestore.doc(TICKET_B_PATH).get());
  });

  it("AC-KAN-190-07: denies an unauthenticated visitor reading any support ticket", async () => {
    const visitorFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertFails(visitorFirestore.doc(TICKET_A_PATH).get());
  });

  it("AC-KAN-190-07: denies collaborators and customers reading support tickets", async () => {
    const collaboratorFirestore = testEnvironment
      .authenticatedContext("collab-uid", {
        businessId: BUSINESS_A_ID,
        collaboratorId: "collab-1",
        role: "collaborator",
      })
      .firestore();
    const customerFirestore = testEnvironment
      .authenticatedContext("customer-uid", { role: "customer" })
      .firestore();

    await assertFails(collaboratorFirestore.doc(TICKET_A_PATH).get());
    await assertFails(customerFirestore.doc(TICKET_A_PATH).get());
  });

  it("AC-KAN-192-06: denies clients creating a support ticket directly", async () => {
    const subscriberFirestore = testEnvironment
      .authenticatedContext("subscriber-a", {
        businessId: BUSINESS_A_ID,
        role: "subscriber",
      })
      .firestore();
    const superAdminFirestore = testEnvironment
      .authenticatedContext("super-admin-uid", { role: "super_admin" })
      .firestore();

    await assertFails(
      subscriberFirestore.doc("supportTickets/ticket-new").set({
        businessId: BUSINESS_A_ID,
        createdByUserId: "subscriber-a",
        message: "Direct client write",
        status: "open",
        subject: "Direct write",
      }),
    );
    await assertFails(
      superAdminFirestore.doc("supportTickets/ticket-new").set({
        businessId: BUSINESS_A_ID,
        createdByUserId: "super-admin-uid",
        message: "Direct super admin write",
        status: "open",
        subject: "Super admin write",
      }),
    );
  });

  it("AC-KAN-192-06: denies clients updating or deleting a support ticket", async () => {
    const subscriberFirestore = testEnvironment
      .authenticatedContext("subscriber-a", {
        businessId: BUSINESS_A_ID,
        role: "subscriber",
      })
      .firestore();
    const superAdminFirestore = testEnvironment
      .authenticatedContext("super-admin-uid", { role: "super_admin" })
      .firestore();

    await assertFails(
      subscriberFirestore.doc(TICKET_A_PATH).update({ status: "resolved" }),
    );
    await assertFails(
      superAdminFirestore.doc(TICKET_A_PATH).update({ status: "resolved" }),
    );
    await assertFails(subscriberFirestore.doc(TICKET_A_PATH).delete());
    await assertFails(superAdminFirestore.doc(TICKET_A_PATH).delete());
  });
});
