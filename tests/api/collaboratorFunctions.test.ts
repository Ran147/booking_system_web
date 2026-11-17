// @vitest-environment node
import { createHash } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { COLLABORATOR_FUNCTION_NAME } from "../../api/_collaborators";
import handler from "../../api/callFunction";
import type { NullableUndefined } from "../../src/types/Nullable";

const MOCK_COLLABORATOR_ID_TOKEN = "collaborator-token";
const QUERY_OPERATOR = Object.freeze({
  EQUAL: "==",
  IN: "in",
} as const);

const adminFake = vi.hoisted(() => {
  interface FakeAccount {
    customClaims?: Record<string, unknown>;
    disabled?: boolean;
    displayName: string;
    email: string;
    password: string;
    tokensRevoked?: boolean;
  }

  interface FakeDocumentSnapshot {
    ["data"]: () => NullableUndefined<Record<string, unknown>>;
    exists: boolean;
    id: string;
    ref: FakeDocumentReference;
  }

  interface FakeQuerySnapshot {
    docs: FakeDocumentSnapshot[];
    empty: boolean;
  }

  interface FakeQuery {
    get: () => Promise<FakeQuerySnapshot>;
    limit: (limitCount: number) => FakeQuery;
    where: (field: string, operator: string, value: unknown) => FakeQuery;
  }

  interface FakeDocumentReference {
    collection: (name: string) => FakeCollectionReference;
    create: (value: Record<string, unknown>) => Promise<void>;
    delete: () => Promise<void>;
    get: () => Promise<FakeDocumentSnapshot>;
    id: string;
    path: string;
    set: (
      value: Record<string, unknown>,
      options?: { merge?: boolean },
    ) => Promise<void>;
    update: (value: Record<string, unknown>) => Promise<void>;
  }

  interface FakeCollectionReference extends FakeQuery {
    doc: (documentId?: string) => FakeDocumentReference;
  }

  const accounts = new Map<string, FakeAccount>();
  const documents = new Map<string, Record<string, unknown>>();
  const failingPaths = new Set<string>();
  let createdAccountCount = 0;
  let generatedDocumentCount = 0;

  const createCodedError = (code: number | string): Error =>
    Object.assign(new Error(String(code)), { code });

  const assertWritable = (path: string): void => {
    if (failingPaths.has(path)) {
      throw new Error(`Write failed: ${path}`);
    }
  };

  const getDocumentId = (path: string): string => {
    const parts = path.split("/");
    return parts[parts.length - 1] ?? "";
  };

  const createDocumentSnapshot = (path: string): FakeDocumentSnapshot => {
    const record = documents.get(path);
    return {
      ["data"]: () => record,
      exists: record !== undefined,
      id: getDocumentId(path),
      ref: createDocumentReference(path),
    };
  };

  const buildQuery = (
    collectionPath: string,
    filters: Array<{ field: string; operator: string; value: unknown }>,
    limitCount?: number,
  ): FakeQuery => ({
    get: async (): Promise<FakeQuerySnapshot> => {
      const prefix = `${collectionPath}/`;
      const matchingDocs: FakeDocumentSnapshot[] = [];

      for (const [docPath, record] of documents.entries()) {
        if (!docPath.startsWith(prefix)) {
          continue;
        }
        const remainder = docPath.slice(prefix.length);
        if (remainder.includes("/")) {
          continue;
        }
        const matches = filters.every((filter) => {
          const fieldValue = record[filter.field];
          if (filter.operator === QUERY_OPERATOR.EQUAL) {
            return fieldValue === filter.value;
          }
          if (
            filter.operator === QUERY_OPERATOR.IN &&
            Array.isArray(filter.value)
          ) {
            return filter.value.includes(fieldValue);
          }
          return true;
        });
        if (matches) {
          matchingDocs.push(createDocumentSnapshot(docPath));
        }
      }

      const limited =
        limitCount !== undefined
          ? matchingDocs.slice(0, limitCount)
          : matchingDocs;
      return {
        docs: limited,
        empty: limited.length === 0,
      };
    },
    limit: (nextLimit: number): FakeQuery =>
      buildQuery(collectionPath, filters, nextLimit),
    where: (field: string, operator: string, value: unknown): FakeQuery =>
      buildQuery(
        collectionPath,
        [...filters, { field, operator, value }],
        limitCount,
      ),
  });

  const createDocumentReference = (path: string): FakeDocumentReference => ({
    collection: (name: string): FakeCollectionReference =>
      createCollectionReference(`${path}/${name}`),
    create: async (value: Record<string, unknown>): Promise<void> => {
      assertWritable(path);
      if (documents.has(path)) {
        throw createCodedError(6);
      }
      documents.set(path, { ...value });
    },
    delete: async (): Promise<void> => {
      documents.delete(path);
    },
    get: async (): Promise<FakeDocumentSnapshot> =>
      createDocumentSnapshot(path),
    id: getDocumentId(path),
    path,
    set: async (
      value: Record<string, unknown>,
      options?: { merge?: boolean },
    ): Promise<void> => {
      assertWritable(path);
      documents.set(
        path,
        options?.merge ? { ...documents.get(path), ...value } : { ...value },
      );
    },
    update: async (value: Record<string, unknown>): Promise<void> => {
      assertWritable(path);
      const existing = documents.get(path);
      if (!existing) {
        throw createCodedError(5);
      }
      documents.set(path, { ...existing, ...value });
    },
  });

  const createCollectionReference = (
    path: string,
  ): FakeCollectionReference => ({
    ...buildQuery(path, []),
    doc: (documentId?: string): FakeDocumentReference => {
      if (documentId) {
        return createDocumentReference(`${path}/${documentId}`);
      }
      generatedDocumentCount += 1;
      return createDocumentReference(`${path}/doc-${generatedDocumentCount}`);
    },
  });

  const auth = {
    createUser: async (properties: {
      displayName: string;
      email: string;
      password: string;
    }): Promise<{ uid: string }> => {
      const normalized = properties.email.toLowerCase();
      const taken = [...accounts.values()].some(
        (account) => account.email.toLowerCase() === normalized,
      );
      if (taken) {
        throw createCodedError("auth/email-already-exists");
      }
      createdAccountCount += 1;
      const uid = `user-${createdAccountCount}`;
      accounts.set(uid, { ...properties, disabled: false });
      return { uid };
    },
    deleteUser: async (uid: string): Promise<void> => {
      accounts.delete(uid);
    },
    getUserByEmail: async (email: string): Promise<{ uid: string }> => {
      const normalized = email.toLowerCase();
      for (const [uid, account] of accounts.entries()) {
        if (account.email.toLowerCase() === normalized) {
          return { uid };
        }
      }
      throw createCodedError("auth/user-not-found");
    },
    revokeRefreshTokens: async (uid: string): Promise<void> => {
      const account = accounts.get(uid);
      if (account) {
        account.tokensRevoked = true;
      }
    },
    setCustomUserClaims: async (
      uid: string,
      customClaims: Record<string, unknown>,
    ): Promise<void> => {
      const account = accounts.get(uid);
      if (account) {
        account.customClaims = customClaims;
      }
    },
    updateUser: async (
      uid: string,
      properties: { disabled?: boolean },
    ): Promise<void> => {
      const account = accounts.get(uid);
      if (account && properties.disabled !== undefined) {
        account.disabled = properties.disabled;
      }
    },
    verifyIdToken: async (token: string): Promise<Record<string, unknown>> => {
      if (token === MOCK_COLLABORATOR_ID_TOKEN) {
        return {
          businessId: "business-123",
          collaboratorId: "collab-1",
          role: "collaborator",
          uid: "collab-user-1",
        };
      }
      throw new Error("Invalid token");
    },
  };

  const firestore = {
    collection: createCollectionReference,
    runTransaction: async <T>(
      callback: (transaction: {
        create: (
          documentReference: FakeDocumentReference,
          value: Record<string, unknown>,
        ) => void;
        get: <Q extends FakeDocumentReference | FakeQuery>(
          target: Q,
        ) => Promise<
          Q extends FakeDocumentReference
            ? FakeDocumentSnapshot
            : FakeQuerySnapshot
        >;
        set: (
          documentReference: FakeDocumentReference,
          value: Record<string, unknown>,
          options?: { merge?: boolean },
        ) => void;
        update: (
          documentReference: FakeDocumentReference,
          value: Record<string, unknown>,
        ) => void;
      }) => Promise<T>,
    ): Promise<T> => {
      const pendingOperations: Array<() => Promise<void>> = [];
      const transaction = {
        create: (
          documentReference: FakeDocumentReference,
          value: Record<string, unknown>,
        ): void => {
          pendingOperations.push(() => documentReference.create(value));
        },
        get: <Q extends FakeDocumentReference | FakeQuery>(
          target: Q,
        ): Promise<
          Q extends FakeDocumentReference
            ? FakeDocumentSnapshot
            : FakeQuerySnapshot
        > =>
          target.get() as Promise<
            Q extends FakeDocumentReference
              ? FakeDocumentSnapshot
              : FakeQuerySnapshot
          >,
        set: (
          documentReference: FakeDocumentReference,
          value: Record<string, unknown>,
          options?: { merge?: boolean },
        ): void => {
          pendingOperations.push(() => documentReference.set(value, options));
        },
        update: (
          documentReference: FakeDocumentReference,
          value: Record<string, unknown>,
        ): void => {
          pendingOperations.push(() => documentReference.update(value));
        },
      };

      const result = await callback(transaction);
      const snapshotBackup = new Map(documents);
      try {
        for (const operation of pendingOperations) {
          await operation();
        }
      } catch (error) {
        documents.clear();
        for (const [key, value] of snapshotBackup.entries()) {
          documents.set(key, value);
        }
        throw error;
      }
      return result;
    },
  };

  const createTimestamp = (date: Date): { toDate: () => Date } => ({
    toDate: () => date,
  });

  const reset = (): void => {
    accounts.clear();
    documents.clear();
    failingPaths.clear();
    createdAccountCount = 0;
    generatedDocumentCount = 0;
  };

  return {
    accounts,
    auth,
    createTimestamp,
    documents,
    failingPaths,
    firestore,
    reset,
  };
});

vi.mock("firebase-admin/app", () => ({
  cert: vi.fn(),
  getApps: (): object[] => [{}],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: (): typeof adminFake.auth => adminFake.auth,
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: (): typeof adminFake.firestore => adminFake.firestore,
  Timestamp: {
    fromDate: adminFake.createTimestamp,
    fromMillis: (milliseconds: number): { toDate: () => Date } =>
      adminFake.createTimestamp(new Date(milliseconds)),
    now: (): { toDate: () => Date } => adminFake.createTimestamp(new Date()),
  },
}));

const BUSINESS_ID = "business-123";
const BUSINESS_PATH = `businesses/${BUSINESS_ID}`;

const callEndpoint = async (
  functionName: string,
  payload: Record<string, unknown>,
  token = "test-subscriber-token",
): Promise<{ body: Record<string, unknown>; statusCode: number }> => {
  let statusCode = 0;
  let responseContent = "";
  const request = {
    body: { functionName, payload },
    headers: token ? { authorization: `Bearer ${token}` } : {},
    method: "POST",
  } as unknown as IncomingMessage;
  const response = {
    end: (content?: string): void => {
      responseContent = content ?? "";
    },
    setHeader: vi.fn(),
    set statusCode(code: number) {
      statusCode = code;
    },
  } as unknown as ServerResponse;

  await handler(request, response);
  return {
    body: JSON.parse(responseContent) as Record<string, unknown>,
    statusCode,
  };
};

const seedActiveBusiness = (maxCollaborators = 3): void => {
  adminFake.documents.set(BUSINESS_PATH, {
    id: BUSINESS_ID,
    name: "Barberia Central",
    ownerUserId: "subscriber-1",
    status: "active",
  });
  adminFake.documents.set(`${BUSINESS_PATH}/subscription/current`, {
    planId: "plan-pro",
    status: "active",
  });
  adminFake.documents.set("plans/plan-pro", {
    limits: { maxBookings: 200, maxCollaborators },
    name: "Profesional",
    status: "active",
  });
  adminFake.documents.set("plans/plan-scale", {
    limits: { maxBookings: 1000, maxCollaborators: 10 },
    name: "Escala",
    status: "active",
  });
  adminFake.documents.set(`${BUSINESS_PATH}/services/service-1`, {
    name: "Corte",
    status: "active",
  });
  adminFake.documents.set(`${BUSINESS_PATH}/services/service-2`, {
    name: "Barba",
    status: "active",
  });
  // Legacy owner document created on sign-up should be excluded from counts.
  adminFake.documents.set(`${BUSINESS_PATH}/collaborators/subscriber-1`, {
    email: "owner@example.com",
    fullName: "Owner",
    is_owner: true,
    status: "active",
  });
};

describe("api collaborator functions (KAN-78..KAN-86)", () => {
  beforeEach(() => {
    adminFake.reset();
    seedActiveBusiness();
  });

  it("KAN-78: registers an invited collaborator with services, permissions, and hashed invitation", async () => {
    const result = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.REGISTER_COLLABORATOR,
      {
        businessId: BUSINESS_ID,
        email: "Carlos@Example.com",
        fullName: "Carlos Mendez",
        permissions: ["manage_bookings", "view_reports"],
        phone: "+506 8888 9999",
        serviceIds: ["service-1"],
        specialty: "Barberia",
      },
    );

    expect(result.statusCode).toBe(200);
    expect(result.body.status).toBe("invited");
    expect(typeof result.body.invitationToken).toBe("string");
    expect(String(result.body.invitationToken).length).toBeGreaterThan(10);
    const collaboratorId = String(result.body.collaboratorId);
    const saved = adminFake.documents.get(
      `${BUSINESS_PATH}/collaborators/${collaboratorId}`,
    );
    expect(saved).toMatchObject({
      email: "carlos@example.com",
      fullName: "Carlos Mendez",
      permissions: ["manage_bookings", "view_reports"],
      searchName: "carlos mendez",
      serviceIds: ["service-1"],
      specialty: "Barberia",
      status: "invited",
      userId: null,
    });

    const invitationKeys = [...adminFake.documents.keys()].filter((key) =>
      key.startsWith("collaboratorInvitations/"),
    );
    expect(invitationKeys).toHaveLength(1);

    const validationResult = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.VALIDATE_COLLABORATOR_INVITATION,
      { invitationToken: result.body.invitationToken },
      "",
    );
    expect(validationResult.statusCode).toBe(200);
    expect(validationResult.body.email).toBe("carlos@example.com");
  });

  it("KAN-78 & KAN-85: enforces Auth/business email uniqueness and plan maxCollaborators (ignoring owner doc)", async () => {
    seedActiveBusiness(1);

    const firstResult = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.REGISTER_COLLABORATOR,
      {
        businessId: BUSINESS_ID,
        email: "uno@example.com",
        fullName: "Uno Colaborador",
        permissions: [],
        phone: "88881111",
        serviceIds: ["service-1"],
      },
    );
    expect(firstResult.statusCode).toBe(200);

    const limitResult = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.REGISTER_COLLABORATOR,
      {
        businessId: BUSINESS_ID,
        email: "dos@example.com",
        fullName: "Dos Colaborador",
        permissions: [],
        phone: "88882222",
        serviceIds: ["service-1"],
      },
    );
    expect(limitResult.statusCode).toBe(412);
    expect(limitResult.body.details).toEqual({
      hasHigherPlan: true,
      limit: 1,
      reason: "limit_reached",
    });

    seedActiveBusiness(3);
    const duplicateEmailResult = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.REGISTER_COLLABORATOR,
      {
        businessId: BUSINESS_ID,
        email: "uno@example.com",
        fullName: "Duplicado",
        permissions: [],
        phone: "88883333",
        serviceIds: ["service-1"],
      },
    );
    expect(duplicateEmailResult.statusCode).toBe(409);
  });

  it("KAN-79: validates invitation, accepts invitation creating Auth user + claims + active status, and rolls back Auth on Firestore error", async () => {
    const rawToken = "valid-invitation-token-123";
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");

    adminFake.documents.set(`${BUSINESS_PATH}/collaborators/collab-1`, {
      businessId: BUSINESS_ID,
      email: "ana@example.com",
      fullName: "Ana Lopez",
      permissions: ["manage_services"],
      phone: "88887777",
      serviceIds: ["service-1"],
      status: "invited",
      userId: null,
    });
    adminFake.documents.set(`collaboratorInvitations/${tokenHash}`, {
      businessId: BUSINESS_ID,
      collaboratorId: "collab-1",
      email: "ana@example.com",
      expiresAt: new Date(Date.now() + 86_400_000),
      usedAt: null,
    });

    const validationResult = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.VALIDATE_COLLABORATOR_INVITATION,
      { invitationToken: rawToken },
      "",
    );
    expect(validationResult).toEqual({
      body: {
        businessName: "Barberia Central",
        email: "ana@example.com",
      },
      statusCode: 200,
    });

    // Simulate failure writing user profile -> Auth user must be rolled back
    adminFake.failingPaths.add("users/user-1");
    const failedAccept = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.ACCEPT_COLLABORATOR_INVITATION,
      {
        invitationToken: rawToken,
        password: "Password123!",
        recaptchaToken: "token-ok",
      },
      "",
    );
    expect(failedAccept.statusCode).toBe(500);
    expect(adminFake.accounts.size).toBe(0);

    // Clear failure and accept cleanly
    adminFake.failingPaths.clear();
    const acceptResult = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.ACCEPT_COLLABORATOR_INVITATION,
      {
        invitationToken: rawToken,
        password: "Password123!",
        recaptchaToken: "token-ok",
      },
      "",
    );
    expect(acceptResult).toEqual({
      body: { email: "ana@example.com", status: "active" },
      statusCode: 200,
    });
    expect(adminFake.accounts.get("user-2")?.customClaims).toEqual({
      businessId: BUSINESS_ID,
      collaboratorId: "collab-1",
      role: "collaborator",
    });

    // Second use fails
    const replayResult = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.VALIDATE_COLLABORATOR_INVITATION,
      { invitationToken: rawToken },
      "",
    );
    expect(replayResult.statusCode).toBe(412);
  });

  it("KAN-80: edits collaborator, allows email update only while invited, checks optimistic concurrency, and counts affected bookings", async () => {
    const updatedAtIso = "2026-11-10T10:00:00.000Z";
    adminFake.documents.set(`${BUSINESS_PATH}/collaborators/collab-1`, {
      businessId: BUSINESS_ID,
      email: "old@example.com",
      fullName: "Nombre Viejo",
      permissions: [],
      phone: "88881111",
      serviceIds: ["service-1", "service-2"],
      status: "invited",
      updatedAt: updatedAtIso,
      userId: null,
    });
    adminFake.documents.set(`${BUSINESS_PATH}/bookings/booking-1`, {
      collaboratorId: "collab-1",
      serviceId: "service-2",
      startsAt: new Date(Date.now() + 86_400_000),
      status: "confirmed",
    });

    const conflictResult = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.UPDATE_COLLABORATOR,
      {
        businessId: BUSINESS_ID,
        collaboratorId: "collab-1",
        expectedUpdatedAt: "2026-11-01T00:00:00.000Z",
        fullName: "Nombre Nuevo",
        phone: "88889999",
        serviceIds: ["service-1"],
      },
    );
    expect(conflictResult.statusCode).toBe(409);

    const editResult = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.UPDATE_COLLABORATOR,
      {
        businessId: BUSINESS_ID,
        collaboratorId: "collab-1",
        email: "new@example.com",
        expectedUpdatedAt: updatedAtIso,
        fullName: "Nombre Nuevo",
        phone: "88889999",
        serviceIds: ["service-1"],
      },
    );
    expect(editResult.statusCode).toBe(200);
    expect(editResult.body).toMatchObject({
      collaboratorId: "collab-1",
      emailChanged: true,
      upcomingAffectedBookingsCount: 1,
    });
    expect(typeof editResult.body.invitationToken).toBe("string");
    expect(String(editResult.body.invitationToken).length).toBeGreaterThan(10);
  });

  it("KAN-81 & KAN-82: deactivates active collaborator revoking Auth, rejects invited deactivation, and checks limit on reactivation", async () => {
    await adminFake.auth.createUser({
      displayName: "Carlos",
      email: "carlos@example.com",
      password: "Password123!",
    });
    adminFake.documents.set(`${BUSINESS_PATH}/collaborators/collab-active`, {
      businessId: BUSINESS_ID,
      email: "carlos@example.com",
      fullName: "Carlos",
      status: "active",
      userId: "user-1",
    });
    adminFake.documents.set(`${BUSINESS_PATH}/collaborators/collab-invited`, {
      businessId: BUSINESS_ID,
      email: "invited@example.com",
      fullName: "Invitado",
      status: "invited",
      userId: null,
    });

    const invalidDeactivate = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.UPDATE_COLLABORATOR_STATUS,
      {
        businessId: BUSINESS_ID,
        collaboratorId: "collab-invited",
        targetStatus: "inactive",
      },
    );
    expect(invalidDeactivate.statusCode).toBe(412);

    const invalidActivate = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.UPDATE_COLLABORATOR_STATUS,
      {
        businessId: BUSINESS_ID,
        collaboratorId: "collab-invited",
        targetStatus: "active",
      },
    );
    expect(invalidActivate.statusCode).toBe(412);

    const deactivateResult = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.UPDATE_COLLABORATOR_STATUS,
      {
        businessId: BUSINESS_ID,
        collaboratorId: "collab-active",
        targetStatus: "inactive",
      },
    );
    expect(deactivateResult).toEqual({
      body: { collaboratorId: "collab-active", status: "inactive" },
      statusCode: 200,
    });
    expect(adminFake.accounts.get("user-1")?.disabled).toBe(true);
    expect(adminFake.accounts.get("user-1")?.tokensRevoked).toBe(true);

    // Lower plan limit to 1 so reactivation hits limit (collab-invited counts as 1)
    seedActiveBusiness(1);
    const blockedReactivate = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.UPDATE_COLLABORATOR_STATUS,
      {
        businessId: BUSINESS_ID,
        collaboratorId: "collab-active",
        targetStatus: "active",
      },
    );
    expect(blockedReactivate.statusCode).toBe(412);

    // Restore higher limit -> reactivation succeeds and enables Auth user
    seedActiveBusiness(3);
    const reactivateResult = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.UPDATE_COLLABORATOR_STATUS,
      {
        businessId: BUSINESS_ID,
        collaboratorId: "collab-active",
        targetStatus: "active",
      },
    );
    expect(reactivateResult.statusCode).toBe(200);
    expect(adminFake.accounts.get("user-1")?.disabled).toBe(false);
  });

  it("KAN-84 & KAN-86: enforces resend cooldown/status rules, validates permissions, and blocks collaborator callers", async () => {
    adminFake.documents.set(`${BUSINESS_PATH}/collaborators/collab-1`, {
      businessId: BUSINESS_ID,
      email: "carlos@example.com",
      fullName: "Carlos",
      lastEmailSentAt: new Date(Date.now() - 10_000),
      permissions: [],
      status: "invited",
    });

    const cooldownResult = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.RESEND_COLLABORATOR_EMAIL,
      { businessId: BUSINESS_ID, collaboratorId: "collab-1" },
    );
    expect(cooldownResult.statusCode).toBe(429);

    adminFake.documents.set(`${BUSINESS_PATH}/collaborators/collab-1`, {
      businessId: BUSINESS_ID,
      email: "carlos@example.com",
      fullName: "Carlos",
      lastEmailSentAt: new Date(Date.now() - 120_000),
      permissions: [],
      status: "invited",
    });
    const resendOk = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.RESEND_COLLABORATOR_EMAIL,
      { businessId: BUSINESS_ID, collaboratorId: "collab-1" },
    );
    expect(resendOk.statusCode).toBe(200);
    expect(resendOk.body).toMatchObject({
      collaboratorId: "collab-1",
      kind: "invitation",
    });
    expect(typeof resendOk.body.invitationToken).toBe("string");

    const previousFirebaseWebKey = process.env.FIREBASE_WEB_API_KEY;
    const previousViteWebKey = process.env.VITE_FIREBASE_API_KEY;
    delete process.env.FIREBASE_WEB_API_KEY;
    delete process.env.VITE_FIREBASE_API_KEY;
    adminFake.documents.set(
      `${BUSINESS_PATH}/collaborators/collab-active-key`,
      {
        businessId: BUSINESS_ID,
        email: "active@example.com",
        fullName: "Activo",
        lastEmailSentAt: new Date(Date.now() - 120_000),
        permissions: [],
        status: "active",
        userId: "user-active",
      },
    );

    try {
      const missingKeyResult = await callEndpoint(
        COLLABORATOR_FUNCTION_NAME.RESEND_COLLABORATOR_EMAIL,
        { businessId: BUSINESS_ID, collaboratorId: "collab-active-key" },
      );
      expect(missingKeyResult.statusCode).toBe(500);

      process.env.VITE_FIREBASE_API_KEY = "test-public-web-key";
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValueOnce(new Response("{}", { status: 200 }));
      const resetOk = await callEndpoint(
        COLLABORATOR_FUNCTION_NAME.RESEND_COLLABORATOR_EMAIL,
        { businessId: BUSINESS_ID, collaboratorId: "collab-active-key" },
      );
      expect(resetOk).toEqual({
        body: {
          collaboratorId: "collab-active-key",
          invitationToken: null,
          kind: "password_reset",
        },
        statusCode: 200,
      });
      expect(fetchSpy).toHaveBeenCalledTimes(1);
      fetchSpy.mockRestore();
    } finally {
      if (previousFirebaseWebKey === undefined) {
        delete process.env.FIREBASE_WEB_API_KEY;
      } else {
        process.env.FIREBASE_WEB_API_KEY = previousFirebaseWebKey;
      }
      if (previousViteWebKey === undefined) {
        delete process.env.VITE_FIREBASE_API_KEY;
      } else {
        process.env.VITE_FIREBASE_API_KEY = previousViteWebKey;
      }
    }

    const badPermission = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.UPDATE_COLLABORATOR_PERMISSIONS,
      {
        businessId: BUSINESS_ID,
        collaboratorId: "collab-1",
        permissions: ["manage_subscription"],
      },
    );
    expect(badPermission.statusCode).toBe(400);

    const collaboratorBlocked = await callEndpoint(
      COLLABORATOR_FUNCTION_NAME.UPDATE_COLLABORATOR_PERMISSIONS,
      {
        businessId: BUSINESS_ID,
        collaboratorId: "collab-1",
        permissions: ["view_reports"],
      },
      "collaborator-token",
    );
    expect(collaboratorBlocked.statusCode).toBe(403);
  });
});
