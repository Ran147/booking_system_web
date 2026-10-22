import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { BUSINESS_STATUS } from "../../shared/constants/BusinessStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { SERVICE_STATUS } from "../../shared/constants/ServiceStatus.constants.js";
import { USER_ROLE } from "../../shared/constants/UserRole.constants.js";
import { firestore } from "../../shared/firebaseAdmin.js";
import {
  assertEmulatorsRunning,
  buildAuthenticatedCallableRequest,
  buildCallableRequest,
  captureHttpsError,
  clearEmulators,
  functionsTestEnvironment,
} from "../../shared/tests/emulatorTestHelpers.js";
import { updateServiceCollaborators } from "../updateServiceCollaborators.js";

const callUpdateServiceCollaborators = functionsTestEnvironment.wrap(
  updateServiceCollaborators,
);

const TEST_BUSINESS_ID = "business-123";
const OTHER_BUSINESS_ID = "business-999";
const TEST_SERVICE_ID = "service-456";
const TEST_SUBSCRIBER_UID = "user-subscriber-123";

const SUBSCRIBER_AUTH = {
  token: {
    businessId: TEST_BUSINESS_ID,
    role: USER_ROLE.SUBSCRIBER,
  },
  uid: TEST_SUBSCRIBER_UID,
};

describe("updateServiceCollaborators", () => {
  beforeAll(assertEmulatorsRunning);

  beforeEach(async () => {
    await clearEmulators();

    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .set({
        name: "Barbería Don Juan",
        status: BUSINESS_STATUS.ACTIVE,
      });

    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .set({
        description: "Servicio de prueba",
        durationMinutes: 30,
        name: "Corte clásico",
        priceInCents: 15000,
        status: SERVICE_STATUS.ACTIVE,
      });
  });

  const seedCollaborator = async (
    collaboratorId: string,
    collaboratorParams: {
      fullName: string;
      permissions?: string[];
      serviceIds?: string[];
      status?: string;
    },
  ): Promise<void> => {
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.COLLABORATORS)
      .doc(collaboratorId)
      .set({
        email: `${collaboratorId}@test.com`,
        fullName: collaboratorParams.fullName,
        permissions: collaboratorParams.permissions ?? [],
        serviceIds: collaboratorParams.serviceIds ?? [],
        status: collaboratorParams.status ?? "active",
      });
  };

  it("AC-KAN-61-01 & AC-KAN-61-02: updates serviceIds in collaborators and collaboratorSelection in service", async () => {
    await seedCollaborator("collab-1", {
      fullName: "Ana Barber",
      serviceIds: [],
    });
    await seedCollaborator("collab-2", {
      fullName: "Carlos Barber",
      serviceIds: [TEST_SERVICE_ID],
    });

    const response = await callUpdateServiceCollaborators(
      buildAuthenticatedCallableRequest(
        {
          businessId: TEST_BUSINESS_ID,
          collaboratorIds: ["collab-1"],
          collaboratorSelection: "customer_choice",
          serviceId: TEST_SERVICE_ID,
        },
        SUBSCRIBER_AUTH,
      ),
    );

    expect(response).toEqual({ updatedServiceId: TEST_SERVICE_ID });

    // Verify service selection
    const serviceDoc = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .get();
    expect(serviceDoc.data()?.collaboratorSelection).toBe("customer_choice");

    // Collab 1 was assigned
    const collab1Doc = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.COLLABORATORS)
      .doc("collab-1")
      .get();
    expect(collab1Doc.data()?.serviceIds).toContain(TEST_SERVICE_ID);

    // Collab 2 was unassigned
    const collab2Doc = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.COLLABORATORS)
      .doc("collab-2")
      .get();
    expect(collab2Doc.data()?.serviceIds).not.toContain(TEST_SERVICE_ID);
  });

  it("AC-KAN-61-03: sets collaboratorSelection to null when no collaborator is selected", async () => {
    await seedCollaborator("collab-1", {
      fullName: "Ana Barber",
      serviceIds: [TEST_SERVICE_ID],
    });

    await callUpdateServiceCollaborators(
      buildAuthenticatedCallableRequest(
        {
          businessId: TEST_BUSINESS_ID,
          collaboratorIds: [],
          collaboratorSelection: "customer_choice",
          serviceId: TEST_SERVICE_ID,
        },
        SUBSCRIBER_AUTH,
      ),
    );

    const serviceDoc = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .collection(FIRESTORE_COLLECTION.SERVICES)
      .doc(TEST_SERVICE_ID)
      .get();
    expect(serviceDoc.data()?.collaboratorSelection).toBeNull();
  });

  it("AC-KAN-61-05: rejects when business is inactive or suspended", async () => {
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(TEST_BUSINESS_ID)
      .update({ status: BUSINESS_STATUS.INACTIVE });

    const error = await captureHttpsError(
      callUpdateServiceCollaborators(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            collaboratorIds: [],
            serviceId: TEST_SERVICE_ID,
          },
          SUBSCRIBER_AUTH,
        ),
      ),
    );

    expect(error.code).toBe("failed-precondition");
  });

  it("AC-KAN-61-07: permits collaborator with manage_services permission", async () => {
    await seedCollaborator("collab-manager", {
      fullName: "Manager Collab",
      permissions: ["manage_services"],
    });

    const response = await callUpdateServiceCollaborators(
      buildAuthenticatedCallableRequest(
        {
          businessId: TEST_BUSINESS_ID,
          collaboratorIds: ["collab-manager"],
          collaboratorSelection: "automatic",
          serviceId: TEST_SERVICE_ID,
        },
        {
          token: {
            businessId: TEST_BUSINESS_ID,
            collaboratorId: "collab-manager",
            role: USER_ROLE.COLLABORATOR,
          },
          uid: "manager-uid",
        },
      ),
    );

    expect(response).toEqual({ updatedServiceId: TEST_SERVICE_ID });
  });

  it("AC-KAN-61-07: rejects collaborator without manage_services with permission-denied", async () => {
    await seedCollaborator("collab-basic", {
      fullName: "Basic Collab",
      permissions: ["manage_bookings"],
    });

    const error = await captureHttpsError(
      callUpdateServiceCollaborators(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            collaboratorIds: [],
            serviceId: TEST_SERVICE_ID,
          },
          {
            token: {
              businessId: TEST_BUSINESS_ID,
              collaboratorId: "collab-basic",
              role: USER_ROLE.COLLABORATOR,
            },
            uid: "basic-uid",
          },
        ),
      ),
    );

    expect(error.code).toBe("permission-denied");
  });

  it("rejects unauthenticated caller", async () => {
    const error = await captureHttpsError(
      callUpdateServiceCollaborators(
        buildCallableRequest({
          businessId: TEST_BUSINESS_ID,
          collaboratorIds: [],
          serviceId: TEST_SERVICE_ID,
        }),
      ),
    );

    expect(error.code).toBe("unauthenticated");
  });

  it("rejects caller of another business", async () => {
    const error = await captureHttpsError(
      callUpdateServiceCollaborators(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            collaboratorIds: [],
            serviceId: TEST_SERVICE_ID,
          },
          {
            token: {
              businessId: OTHER_BUSINESS_ID,
              role: USER_ROLE.SUBSCRIBER,
            },
            uid: "other-user",
          },
        ),
      ),
    );

    expect(error.code).toBe("permission-denied");
  });

  it("rejects unknown collaborator IDs with invalid-argument", async () => {
    const error = await captureHttpsError(
      callUpdateServiceCollaborators(
        buildAuthenticatedCallableRequest(
          {
            businessId: TEST_BUSINESS_ID,
            collaboratorIds: ["non-existent-collaborator"],
            serviceId: TEST_SERVICE_ID,
          },
          SUBSCRIBER_AUTH,
        ),
      ),
    );

    expect(error.code).toBe("invalid-argument");
  });
});
