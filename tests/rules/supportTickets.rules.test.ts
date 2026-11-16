// @vitest-environment node
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";

// Runs only against the emulator: npm run test:rules.
// Security rules for support tickets (AC-KAN-202-07, AC-KAN-190-07).
const PROJECT_ID = "demo-booking-system";
const BUSINESS_OWNED_IDENTIFIER = "business-owned";
const BUSINESS_OTHER_IDENTIFIER = "business-other";
const TICKET_OWNED_PATH = "supportTickets/ticket-owned";
const TICKET_OTHER_PATH = "supportTickets/ticket-other";
const TICKET_NEW_PATH = "supportTickets/ticket-new";

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
      const administratorFirestore = context.firestore();
      await administratorFirestore
        .doc(`businesses/${BUSINESS_OWNED_IDENTIFIER}`)
        .set({
          name: "Negocio Propio",
          ownerUserId: "subscriber-user-identifier",
          status: "active",
        });
      await administratorFirestore
        .doc(`businesses/${BUSINESS_OTHER_IDENTIFIER}`)
        .set({
          name: "Otro Negocio",
          ownerUserId: "other-user-identifier",
          status: "active",
        });
      await administratorFirestore
        .doc(
          `businesses/${BUSINESS_OWNED_IDENTIFIER}/collaborators/collaborator-user-identifier`,
        )
        .set({
          permissions: ["manage_bookings"],
          status: "active",
        });
      await administratorFirestore.doc(TICKET_OWNED_PATH).set({
        businessId: BUSINESS_OWNED_IDENTIFIER,
        createdAt: "2026-11-15T00:00:00.000Z",
        message: "Necesito asistencia técnica con la configuración.",
        replies: [],
        status: "open",
        subject: "Problema de configuración",
      });
      await administratorFirestore.doc(TICKET_OTHER_PATH).set({
        businessId: BUSINESS_OTHER_IDENTIFIER,
        createdAt: "2026-11-15T00:00:00.000Z",
        message: "Consulta sobre facturación.",
        replies: [],
        status: "open",
        subject: "Facturación pendiente",
      });
    });
  });

  afterAll(async () => {
    await testEnvironment.cleanup();
  });

  it("permits a super admin to read any support ticket", async () => {
    const superAdminFirestore = testEnvironment
      .authenticatedContext("super-admin-user", { role: "super_admin" })
      .firestore();

    await assertSucceeds(superAdminFirestore.doc(TICKET_OWNED_PATH).get());
    await assertSucceeds(superAdminFirestore.doc(TICKET_OTHER_PATH).get());
  });

  it("permits a subscriber to read a support ticket belonging to their own business", async () => {
    const subscriberFirestore = testEnvironment
      .authenticatedContext("subscriber-user-identifier", {
        businessId: BUSINESS_OWNED_IDENTIFIER,
        role: "subscriber",
      })
      .firestore();

    await assertSucceeds(subscriberFirestore.doc(TICKET_OWNED_PATH).get());
  });

  it("denies a subscriber reading a support ticket belonging to another business", async () => {
    const subscriberFirestore = testEnvironment
      .authenticatedContext("subscriber-user-identifier", {
        businessId: BUSINESS_OWNED_IDENTIFIER,
        role: "subscriber",
      })
      .firestore();

    await assertFails(subscriberFirestore.doc(TICKET_OTHER_PATH).get());
  });

  it("denies an unauthenticated visitor reading any support ticket", async () => {
    const visitorFirestore = testEnvironment
      .unauthenticatedContext()
      .firestore();

    await assertFails(visitorFirestore.doc(TICKET_OWNED_PATH).get());
    await assertFails(visitorFirestore.doc(TICKET_OTHER_PATH).get());
  });

  it("denies collaborators and customers reading support tickets", async () => {
    const collaboratorFirestore = testEnvironment
      .authenticatedContext("collaborator-user-identifier", {
        businessId: BUSINESS_OWNED_IDENTIFIER,
        collaboratorId: "collaborator-user-identifier",
        role: "collaborator",
      })
      .firestore();

    const customerFirestore = testEnvironment
      .authenticatedContext("customer-user-identifier", {
        role: "customer",
      })
      .firestore();

    await assertFails(collaboratorFirestore.doc(TICKET_OWNED_PATH).get());
    await assertFails(customerFirestore.doc(TICKET_OWNED_PATH).get());
  });

  it.each(["subscriber", "super_admin"])(
    "denies direct client writes (create, update, delete) for %s",
    async (role) => {
      const userFirestore = testEnvironment
        .authenticatedContext("test-user-identifier", {
          businessId: BUSINESS_OWNED_IDENTIFIER,
          role,
        })
        .firestore();

      // Attempt create
      await assertFails(
        userFirestore.doc(TICKET_NEW_PATH).set({
          businessId: BUSINESS_OWNED_IDENTIFIER,
          createdAt: "2026-11-15T00:00:00.000Z",
          message: "Creación directa no permitida.",
          replies: [],
          status: "open",
          subject: "Ticket no autorizado",
        }),
      );

      // Attempt update
      await assertFails(
        userFirestore.doc(TICKET_OWNED_PATH).update({
          status: "resolved",
        }),
      );

      // Attempt delete
      await assertFails(userFirestore.doc(TICKET_OWNED_PATH).delete());
    },
  );
});
