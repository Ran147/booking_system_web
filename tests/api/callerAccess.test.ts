// @vitest-environment node
import { callApiFunction } from "./callApiFunction";
import { firebaseAdminFake } from "./firebaseAdminFake";

// Who may call each protected action of the Vercel backend (KAN-59 spec §4),
// with the same conditions as functions/ and firestore.rules.
vi.mock("firebase-admin/app", () => ({
  cert: vi.fn(),
  getApps: (): object[] => [{}],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/auth", async () => {
  const { firebaseAdminFake: fake } = await import("./firebaseAdminFake");
  return { getAuth: (): typeof fake.auth => fake.auth };
});

vi.mock("firebase-admin/firestore", async () => {
  const { firebaseAdminFake: fake } = await import("./firebaseAdminFake");
  return {
    getFirestore: (): typeof fake.firestore => fake.firestore,
    Timestamp: {
      fromMillis: fake.createTimestamp,
      now: (): ReturnType<typeof fake.createTimestamp> =>
        fake.createTimestamp(Date.now()),
    },
  };
});

const BUSINESS_ID = "business-a";
const BUSINESS_PATH = `businesses/${BUSINESS_ID}`;
const INACTIVE_SERVICE_PATH = `${BUSINESS_PATH}/services/service-inactive`;
const ACTIVE_SERVICE_PATH = `${BUSINESS_PATH}/services/service-active`;
const COLLABORATOR_PATH = `${BUSINESS_PATH}/collaborators/collaborator-a`;

const ID_TOKEN = Object.freeze({
  COLLABORATOR: "token-collaborator",
  CUSTOMER: "token-customer",
  OTHER_OWNER: "token-other-owner",
  OWNER: "token-owner",
  OWNER_WITHOUT_CLAIMS: "token-owner-without-claims",
  UNKNOWN: "token-unknown",
});

const FORM_VALUES = { durationMinutes: 30, name: "Corte", price: 10 };

const PROTECTED_CALLS = Object.freeze({
  createBooking: {
    businessId: BUSINESS_ID,
    customerId: "customer-a",
    serviceId: "service-active",
    startsAt: "2026-11-02T15:00:00.000Z",
  },
  createService: { businessId: BUSINESS_ID, formValues: FORM_VALUES },
  deleteService: { businessId: BUSINESS_ID, serviceId: "service-inactive" },
  updateService: {
    businessId: BUSINESS_ID,
    formValues: { ...FORM_VALUES, name: "Corte editado" },
    serviceId: "service-inactive",
  },
  updateServiceCollaborators: {
    businessId: BUSINESS_ID,
    collaboratorIds: [],
    serviceId: "service-inactive",
  },
});

const seedBusiness = (): void => {
  firebaseAdminFake.documents.set(BUSINESS_PATH, {
    ownerUserId: "owner-a",
    status: "active",
  });
  firebaseAdminFake.documents.set("businesses/business-b", {
    ownerUserId: "owner-b",
    status: "active",
  });
  firebaseAdminFake.documents.set(INACTIVE_SERVICE_PATH, {
    name: "Servicio inactivo",
    status: "inactive",
  });
  firebaseAdminFake.documents.set(ACTIVE_SERVICE_PATH, {
    durationMinutes: 30,
    name: "Servicio activo",
    status: "active",
  });
  firebaseAdminFake.documents.set(COLLABORATOR_PATH, {
    permissions: ["manage_services"],
    status: "active",
  });
  firebaseAdminFake.signIn(ID_TOKEN.OWNER, {
    businessId: BUSINESS_ID,
    role: "subscriber",
    uid: "owner-a",
  });
  firebaseAdminFake.signIn(ID_TOKEN.OWNER_WITHOUT_CLAIMS, { uid: "owner-a" });
  firebaseAdminFake.signIn(ID_TOKEN.OTHER_OWNER, {
    businessId: "business-b",
    role: "subscriber",
    uid: "owner-b",
  });
  firebaseAdminFake.signIn(ID_TOKEN.COLLABORATOR, {
    businessId: BUSINESS_ID,
    collaboratorId: "collaborator-a",
    role: "collaborator",
    uid: "collaborator-user-a",
  });
  firebaseAdminFake.signIn(ID_TOKEN.CUSTOMER, {
    role: "customer",
    uid: "customer-a",
  });
};

const readDocumentsCopy = (): Map<string, Record<string, unknown>> =>
  new Map(firebaseAdminFake.documents);

describe("api callFunction: caller access (KAN-59)", () => {
  beforeEach(() => {
    firebaseAdminFake.reset();
    seedBusiness();
  });

  it.each(Object.entries(PROTECTED_CALLS))(
    "KAN-59: %s without a session answers unauthenticated and writes nothing",
    async (functionName, payload) => {
      const documentsBefore = readDocumentsCopy();

      const result = await callApiFunction(functionName, payload);

      expect(result).toMatchObject({
        body: { error: "unauthenticated" },
        statusCode: 401,
      });
      expect(firebaseAdminFake.documents).toEqual(documentsBefore);
    },
  );

  it("KAN-59: a token that does not verify answers unauthenticated", async () => {
    const result = await callApiFunction(
      "createService",
      PROTECTED_CALLS.createService,
      ID_TOKEN.UNKNOWN,
    );

    expect(result.statusCode).toBe(401);
  });

  it("AC-KAN-54-01, AC-KAN-56-01, AC-KAN-59-01: the owner creates, edits and deletes the services of their business", async () => {
    const createResult = await callApiFunction(
      "createService",
      PROTECTED_CALLS.createService,
      ID_TOKEN.OWNER,
    );
    const updateResult = await callApiFunction(
      "updateService",
      PROTECTED_CALLS.updateService,
      ID_TOKEN.OWNER,
    );
    const deleteResult = await callApiFunction(
      "deleteService",
      PROTECTED_CALLS.deleteService,
      ID_TOKEN.OWNER,
    );

    expect(createResult.statusCode).toBe(200);
    expect(updateResult.statusCode).toBe(200);
    expect(deleteResult.statusCode).toBe(200);
    expect(firebaseAdminFake.documents.has(INACTIVE_SERVICE_PATH)).toBe(false);
  });

  it("KAN-59: an owner without claims is recognized by the ownerUserId of the business, as in firestore.rules", async () => {
    const result = await callApiFunction(
      "createService",
      PROTECTED_CALLS.createService,
      ID_TOKEN.OWNER_WITHOUT_CLAIMS,
    );

    expect(result.statusCode).toBe(200);
  });

  it("KAN-59: the owner of another business is denied and the service is left as it is", async () => {
    const serviceBefore = firebaseAdminFake.documents.get(
      INACTIVE_SERVICE_PATH,
    );

    const result = await callApiFunction(
      "updateService",
      PROTECTED_CALLS.updateService,
      ID_TOKEN.OTHER_OWNER,
    );

    expect(result).toMatchObject({
      body: { error: "permission-denied" },
      statusCode: 403,
    });
    expect(firebaseAdminFake.documents.get(INACTIVE_SERVICE_PATH)).toEqual(
      serviceBefore,
    );
  });

  it("AC-KAN-61-07: an active collaborator with manage_services may manage services", async () => {
    const result = await callApiFunction(
      "updateServiceCollaborators",
      PROTECTED_CALLS.updateServiceCollaborators,
      ID_TOKEN.COLLABORATOR,
    );

    expect(result.statusCode).toBe(200);
  });

  it.each([
    {
      collaborator: { permissions: [], status: "active" },
      label: "without manage_services",
    },
    {
      collaborator: { permissions: ["manage_services"], status: "inactive" },
      label: "inactive",
    },
  ])(
    "AC-KAN-61-07: a collaborator $label is denied",
    async ({ collaborator }) => {
      firebaseAdminFake.documents.set(COLLABORATOR_PATH, collaborator);

      const result = await callApiFunction(
        "updateService",
        PROTECTED_CALLS.updateService,
        ID_TOKEN.COLLABORATOR,
      );

      expect(result.statusCode).toBe(403);
    },
  );

  it("KAN-59: only the owner deletes a service, not a collaborator", async () => {
    const result = await callApiFunction(
      "deleteService",
      PROTECTED_CALLS.deleteService,
      ID_TOKEN.COLLABORATOR,
    );

    expect(result.statusCode).toBe(403);
    expect(firebaseAdminFake.documents.has(INACTIVE_SERVICE_PATH)).toBe(true);
  });

  it("KAN-59: a customer books for themself", async () => {
    const result = await callApiFunction(
      "createBooking",
      PROTECTED_CALLS.createBooking,
      ID_TOKEN.CUSTOMER,
    );

    expect(result.statusCode).toBe(200);
  });

  it.each([
    {
      idToken: ID_TOKEN.CUSTOMER,
      label: "for another customer",
      customerId: "customer-b",
    },
    {
      idToken: ID_TOKEN.OWNER,
      label: "without the customer role",
      customerId: "owner-a",
    },
  ])("KAN-59: a booking $label is denied", async ({ customerId, idToken }) => {
    const result = await callApiFunction(
      "createBooking",
      { ...PROTECTED_CALLS.createBooking, customerId },
      idToken,
    );

    expect(result.statusCode).toBe(403);
  });

  it("KAN-59: a public action still works without a session", async () => {
    const result = await callApiFunction("checkBusinessSlug", {
      slug: "libre",
    });

    expect(result).toEqual({ body: { isAvailable: true }, statusCode: 200 });
  });

  it("KAN-59: an action that is not declared is denied by default", async () => {
    const result = await callApiFunction(
      "exportCollection",
      {},
      ID_TOKEN.OWNER,
    );

    expect(result.statusCode).toBe(403);
  });
});
