// @vitest-environment node
import { createHash } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { beforeEach, describe, expect, it, vi } from "vitest";
import handler from "../../api/callFunction";

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
    readonly ["data"]: () => Record<string, unknown> | undefined;
    readonly exists: boolean;
    readonly id: string;
    readonly ref: FakeDocumentReference;
  }

  interface FakeQuerySnapshot {
    readonly docs: FakeDocumentSnapshot[];
    readonly empty: boolean;
  }

  interface FakeDocumentReference {
    readonly collection: (name: string) => FakeCollectionReference;
    readonly delete: () => Promise<void>;
    readonly get: () => Promise<FakeDocumentSnapshot>;
    readonly id: string;
    readonly path: string;
    readonly set: (
      value: Record<string, unknown>,
      options?: { readonly merge?: boolean },
    ) => Promise<void>;
    readonly update: (value: Record<string, unknown>) => Promise<void>;
  }

  interface FakeQuery {
    readonly get: () => Promise<FakeQuerySnapshot>;
    readonly limit: (count: number) => FakeQuery;
    readonly where: (field: string, operator: string, value: unknown) => FakeQuery;
  }

  interface FakeCollectionReference extends FakeQuery {
    readonly doc: (documentId?: string) => FakeDocumentReference;
  }

  const accounts = new Map<string, FakeAccount>();
  const documents = new Map<string, Record<string, unknown>>();
  const failingPaths = new Set<string>();
  let autoDocumentCounter = 0;
  let createdAccountCount = 0;

  const createCodedError = (code: string): Error =>
    Object.assign(new Error(code), { code });

  const createDocumentSnapshot = (
    path: string,
    reference: FakeDocumentReference,
  ): FakeDocumentSnapshot => {
    const stored = documents.get(path);
    return {
      ["data"]: (): Record<string, unknown> | undefined => stored,
      exists: stored !== undefined,
      id: reference.id,
      ref: reference,
    };
  };

  const createDocumentReference = (path: string): FakeDocumentReference => {
    const segments = path.split("/");
    const id = segments[segments.length - 1] ?? "";
    const reference: FakeDocumentReference = {
      collection: (name: string): FakeCollectionReference =>
        createCollectionReference(`${path}/${name}`),
      delete: async (): Promise<void> => {
        documents.delete(path);
      },
      get: async (): Promise<FakeDocumentSnapshot> =>
        createDocumentSnapshot(path, reference),
      id,
      path,
      set: async (
        value: Record<string, unknown>,
        options?: { readonly merge?: boolean },
      ): Promise<void> => {
        if (failingPaths.has(path)) {
          throw new Error(`Forced failure on ${path}`);
        }
        documents.set(
          path,
          options?.merge ? { ...documents.get(path), ...value } : value,
        );
      },
      update: async (value: Record<string, unknown>): Promise<void> => {
        if (failingPaths.has(path)) {
          throw new Error(`Forced failure on ${path}`);
        }
        const current = documents.get(path);
        if (!current) {
          throw new Error(`Document missing at ${path}`);
        }
        documents.set(path, { ...current, ...value });
      },
    };
    return reference;
  };

  const buildQuery = (
    collectionPath: string,
    filters: Array<{
      readonly field: string;
      readonly operator: string;
      readonly value: unknown;
    }>,
    limitCount?: number,
  ): FakeQuery => ({
    get: async (): Promise<FakeQuerySnapshot> => {
      const prefix = `${collectionPath}/`;
      const matched = [...documents.entries()]
        .filter(([documentPath]) => {
          if (!documentPath.startsWith(prefix)) {
            return false;
          }
          const remainder = documentPath.slice(prefix.length);
          return !remainder.includes("/");
        })
        .filter(([, documentData]) =>
          filters.every((filter) => {
            const fieldValue = documentData[filter.field];
            if (filter.operator === "==") {
              return (fieldValue ?? null) === filter.value;
            }
            if (filter.operator === "in" && Array.isArray(filter.value)) {
              return filter.value.includes(fieldValue);
            }
            return true;
          }),
        )
        .map(([documentPath]) =>
          createDocumentSnapshot(
            documentPath,
            createDocumentReference(documentPath),
          ),
        );

      const sliced =
        typeof limitCount === "number" ? matched.slice(0, limitCount) : matched;
      return {
        docs: sliced,
        empty: sliced.length === 0,
      };
    },
    limit: (count: number): FakeQuery =>
      buildQuery(collectionPath, filters, count),
    where: (field: string, operator: string, value: unknown): FakeQuery =>
      buildQuery(
        collectionPath,
        [...filters, { field, operator, value }],
        limitCount,
      ),
  });

  const createCollectionReference = (
    path: string,
  ): FakeCollectionReference => ({
    ...buildQuery(path, []),
    doc: (documentId?: string): FakeDocumentReference => {
      const resolvedId =
        documentId ?? `auto-doc-${String(++autoDocumentCounter)}`;
      return createDocumentReference(`${path}/${resolvedId}`);
    },
  });

  const auth = {
    createUser: async (properties: {
      displayName: string;
      email: string;
      password: string;
    }): Promise<{ uid: string }> => {
      const isTaken = [...accounts.values()].some(
        (account) => account.email === properties.email,
      );
      if (isTaken) {
        throw createCodedError("auth/email-already-exists");
      }
      createdAccountCount += 1;
      const uid = `created-user-${createdAccountCount}`;
      accounts.set(uid, { ...properties, disabled: false });
      return { uid };
    },
    deleteUser: async (uid: string): Promise<void> => {
      accounts.delete(uid);
    },
    generatePasswordResetLink: async (email: string): Promise<string> =>
      `https://reset.test/?email=${encodeURIComponent(email)}`,
    getUserByEmail: async (email: string): Promise<{ uid: string }> => {
      for (const [uid, account] of accounts.entries()) {
        if (account.email === email) {
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
      if (account && typeof properties.disabled === "boolean") {
        account.disabled = properties.disabled;
      }
    },
    verifyIdToken: async (token: string): Promise<Record<string, unknown>> => {
      if (token === "collab-manager-token") {
        return {
          businessId: "business-123",
          collaboratorId: "collab-manager",
          role: "collaborator",
          uid: "user-manager",
        };
      }
      if (token === "collab-barber-token") {
        return {
          businessId: "business-123",
          collaboratorId: "collab-barber",
          role: "collaborator",
          uid: "user-barber",
        };
      }
      throw new Error("Invalid token");
    },
  };

  const firestore = {
    collection: createCollectionReference,
    runTransaction: async <Result>(
      runner: (transaction: {
        get: (
          target: FakeDocumentReference | FakeQuery,
        ) => Promise<FakeDocumentSnapshot | FakeQuerySnapshot>;
        set: (
          reference: FakeDocumentReference,
          value: Record<string, unknown>,
        ) => void;
        update: (
          reference: FakeDocumentReference,
          value: Record<string, unknown>,
        ) => void;
      }) => Promise<Result>,
    ): Promise<Result> => {
      const queuedWrites: Array<() => Promise<void>> = [];
      const transaction = {
        get: (
          target: FakeDocumentReference | FakeQuery,
        ): Promise<FakeDocumentSnapshot | FakeQuerySnapshot> => target.get(),
        set: (
          reference: FakeDocumentReference,
          value: Record<string, unknown>,
        ): void => {
          queuedWrites.push(() => reference.set(value));
        },
        update: (
          reference: FakeDocumentReference,
          value: Record<string, unknown>,
        ): void => {
          queuedWrites.push(() => reference.update(value));
        },
      };
      const result = await runner(transaction);
      for (const writeOperation of queuedWrites) {
        await writeOperation();
      }
      return result;
    },
  };

  const reset = (): void => {
    accounts.clear();
    documents.clear();
    failingPaths.clear();
    autoDocumentCounter = 0;
    createdAccountCount = 0;
  };

  return { accounts, auth, documents, failingPaths, firestore, reset };
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
    fromDate: (date: Date): Date => date,
    fromMillis: (millis: number): Date => new Date(millis),
    now: (): Date => new Date(),
  },
}));

const callEndpoint = async (
  functionName: string,
  payload: Record<string, unknown>,
  token: string | null = "test-subscriber-token",
): Promise<{
  readonly body: Record<string, unknown>;
  readonly statusCode: number;
}> => {
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
    setHeader: (): void => undefined,
    set statusCode(code: number) {
      statusCode = code;
    },
  } as unknown as ServerResponse;

  await handler(request, response);
  return {
    body: responseContent
      ? (JSON.parse(responseContent) as Record<string, unknown>)
      : {},
    statusCode,
  };
};

const BUSINESS_ID = "business-123";

describe("api collaborators & invitation lifecycle (KAN-78..KAN-86)", () => {
  beforeEach(() => {
    adminFake.reset();
    process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";

    adminFake.documents.set(`businesses/${BUSINESS_ID}`, {
      name: "Barberia Central",
      ownerUserId: "subscriber-1",
      status: "active",
    });
    adminFake.documents.set(`businesses/${BUSINESS_ID}/subscription/current`, {
      planId: "plan-basic",
      status: "active",
    });
    adminFake.documents.set("plans/plan-basic", {
      limits: { maxCollaborators: 2 },
      name: "Basico",
      status: "active",
    });
    adminFake.documents.set("plans/plan-pro", {
      limits: { maxCollaborators: 10 },
      name: "Pro",
      status: "active",
    });
    adminFake.documents.set(`businesses/${BUSINESS_ID}/services/service-1`, {
      name: "Corte",
      status: "active",
    });
    adminFake.documents.set(`businesses/${BUSINESS_ID}/services/service-2`, {
      name: "Barba",
      status: "active",
    });
    adminFake.documents.set(
      `businesses/${BUSINESS_ID}/collaborators/collab-barber`,
      {
        email: "barber@demo.com",
        fullName: "Carlos Barbero",
        permissions: [],
        serviceIds: ["service-1"],
        status: "active",
        updatedAt: new Date("2026-11-01T10:00:00.000Z"),
        userId: "user-barber",
      },
    );
    adminFake.documents.set(
      `businesses/${BUSINESS_ID}/collaborators/collab-manager`,
      {
        email: "manager@demo.com",
        fullName: "Maria Encargada",
        permissions: ["manage_bookings"],
        serviceIds: ["service-1"],
        status: "active",
        updatedAt: new Date("2026-11-01T10:00:00.000Z"),
        userId: "user-manager",
      },
    );
  });

  it("KAN-78 & KAN-85: registers collaborator up to limit and rejects when full", async () => {
    adminFake.documents.set("plans/plan-basic", {
      limits: { maxCollaborators: 3 },
      name: "Basico",
      status: "active",
    });

    const firstResult = await callEndpoint("registerCollaborator", {
      businessId: BUSINESS_ID,
      email: "Camila@Salon.com",
      fullName: "Camila Solano",
      permissions: ["manage_bookings"],
      phone: "+50688881111",
      serviceIds: ["service-1"],
      specialty: "Estilista",
    });

    expect(firstResult.statusCode).toBe(200);
    expect(firstResult.body).toMatchObject({
      email: "camila@salon.com",
      status: "invited",
    });
    const invitationToken = String(firstResult.body.invitationToken);
    expect(invitationToken.length).toBeGreaterThan(10);

    const tokenHash = createHash("sha256")
      .update(invitationToken)
      .digest("hex");
    expect(
      adminFake.documents.get(`collaboratorInvitations/${tokenHash}`),
    ).toMatchObject({
      businessId: BUSINESS_ID,
      email: "camila@salon.com",
      usedAt: null,
    });

    const duplicateResult = await callEndpoint("registerCollaborator", {
      businessId: BUSINESS_ID,
      email: "camila@salon.com",
      fullName: "Otra Camila",
      permissions: [],
      phone: "",
      serviceIds: ["service-1"],
      specialty: null,
    });
    expect(duplicateResult.statusCode).toBe(409);
    expect(duplicateResult.body.details).toMatchObject({
      reason: "email_already_in_use",
    });

    const limitResult = await callEndpoint("registerCollaborator", {
      businessId: BUSINESS_ID,
      email: "cuarto@salon.com",
      fullName: "Cuarto Miembro",
      permissions: [],
      phone: "",
      serviceIds: ["service-1"],
      specialty: null,
    });
    expect(limitResult.statusCode).toBe(429);
    expect(limitResult.body.details).toMatchObject({
      hasHigherPlan: true,
      limit: 3,
      reason: "limit_reached",
    });
  });

  it("KAN-78: denies collaborator caller even with permissions", async () => {
    const result = await callEndpoint(
      "registerCollaborator",
      {
        businessId: BUSINESS_ID,
        email: "nuevo@salon.com",
        fullName: "Nuevo",
        permissions: [],
        phone: "",
        serviceIds: ["service-1"],
        specialty: null,
      },
      "collab-manager-token",
    );

    expect(result.statusCode).toBe(403);
  });

  it("KAN-79: validates invitation, activates collaborator with claims, and rolls back on failure", async () => {
    adminFake.documents.set("plans/plan-basic", {
      limits: { maxCollaborators: 5 },
      status: "active",
    });
    const registerResult = await callEndpoint("registerCollaborator", {
      businessId: BUSINESS_ID,
      email: "nuevo@salon.com",
      fullName: "Luis Mora",
      permissions: ["manage_services"],
      phone: "+50688882222",
      serviceIds: ["service-1"],
      specialty: null,
    });
    const invitationToken = String(registerResult.body.invitationToken);
    const collaboratorId = String(registerResult.body.collaboratorId);

    const validateResult = await callEndpoint(
      "validateCollaboratorInvitation",
      { invitationToken },
      null,
    );
    expect(validateResult.statusCode).toBe(200);
    expect(validateResult.body).toEqual({
      businessName: "Barberia Central",
      email: "nuevo@salon.com",
    });

    adminFake.failingPaths.add("users/created-user-1");
    const rollbackResult = await callEndpoint(
      "acceptCollaboratorInvitation",
      {
        invitationToken,
        password: "Password123!",
        recaptchaToken: "ok",
      },
      null,
    );
    expect(rollbackResult.statusCode).toBe(500);
    expect(adminFake.accounts.size).toBe(0);

    adminFake.failingPaths.clear();
    const acceptResult = await callEndpoint(
      "acceptCollaboratorInvitation",
      {
        invitationToken,
        password: "Password123!",
        recaptchaToken: "ok",
      },
      null,
    );
    expect(acceptResult.statusCode).toBe(200);
    expect(acceptResult.body).toEqual({ email: "nuevo@salon.com" });
    expect(adminFake.accounts.get("created-user-2")?.customClaims).toEqual({
      businessId: BUSINESS_ID,
      collaboratorId,
      role: "collaborator",
    });
    expect(
      adminFake.documents.get(
        `businesses/${BUSINESS_ID}/collaborators/${collaboratorId}`,
      )?.status,
    ).toBe("active");

    const reusedResult = await callEndpoint(
      "validateCollaboratorInvitation",
      { invitationToken },
      null,
    );
    expect(reusedResult.statusCode).toBe(412);
    expect(reusedResult.body.details).toMatchObject({
      reason: "invitation_invalid",
    });
  });

  it("KAN-80, KAN-81, KAN-82, KAN-84 & KAN-86: updates, deactivates, reactivates, resends and sets permissions", async () => {
    adminFake.documents.set("plans/plan-basic", {
      limits: { maxCollaborators: 5 },
      status: "active",
    });
    adminFake.accounts.set("user-barber", {
      displayName: "Carlos Barbero",
      email: "barber@demo.com",
      password: "Password123!",
    });

    adminFake.documents.set(`businesses/${BUSINESS_ID}/bookings/booking-future`, {
      collaboratorId: "collab-barber",
      serviceId: "service-1",
      startsAt: new Date(Date.now() + 86_400_000),
      status: "confirmed",
    });

    const conflictResult = await callEndpoint("updateCollaborator", {
      businessId: BUSINESS_ID,
      collaboratorId: "collab-barber",
      expectedUpdatedAt: "2026-10-01T00:00:00.000Z",
      fullName: "Carlos Actualizado",
      phone: "+50688889999",
      serviceIds: ["service-2"],
      specialty: null,
    });
    expect(conflictResult.statusCode).toBe(409);
    expect(conflictResult.body.details).toMatchObject({
      reason: "concurrent_modification",
    });

    const updateResult = await callEndpoint("updateCollaborator", {
      businessId: BUSINESS_ID,
      collaboratorId: "collab-barber",
      expectedUpdatedAt: "2026-11-01T10:00:00.000Z",
      fullName: "Carlos Actualizado",
      phone: "+50688889999",
      serviceIds: ["service-2"],
      specialty: "Degradados",
    });
    expect(updateResult.statusCode).toBe(200);
    expect(updateResult.body).toMatchObject({
      collaboratorId: "collab-barber",
      emailChanged: false,
      upcomingAffectedBookingsCount: 1,
    });

    const permissionsResult = await callEndpoint(
      "updateCollaboratorPermissions",
      {
        businessId: BUSINESS_ID,
        collaboratorId: "collab-barber",
        permissions: ["manage_schedule_blocks"],
      },
    );
    expect(permissionsResult.statusCode).toBe(200);
    expect(
      adminFake.documents.get(
        `businesses/${BUSINESS_ID}/collaborators/collab-barber`,
      )?.permissions,
    ).toEqual(["manage_schedule_blocks"]);

    const resendActive = await callEndpoint("resendCollaboratorEmail", {
      businessId: BUSINESS_ID,
      collaboratorId: "collab-barber",
    });
    expect(resendActive.statusCode).toBe(200);
    expect(resendActive.body.kind).toBe("password_reset");

    const cooldownResult = await callEndpoint("resendCollaboratorEmail", {
      businessId: BUSINESS_ID,
      collaboratorId: "collab-barber",
    });
    expect(cooldownResult.statusCode).toBe(429);
    expect(cooldownResult.body.details).toMatchObject({
      reason: "cooldown_active",
    });

    const deactivateResult = await callEndpoint("updateCollaboratorStatus", {
      businessId: BUSINESS_ID,
      collaboratorId: "collab-barber",
      targetStatus: "inactive",
    });
    expect(deactivateResult.statusCode).toBe(200);
    expect(adminFake.accounts.get("user-barber")?.disabled).toBe(true);
    expect(adminFake.accounts.get("user-barber")?.tokensRevoked).toBe(true);

    const reactivateResult = await callEndpoint("updateCollaboratorStatus", {
      businessId: BUSINESS_ID,
      collaboratorId: "collab-barber",
      targetStatus: "active",
    });
    expect(reactivateResult.statusCode).toBe(200);
    expect(adminFake.accounts.get("user-barber")?.disabled).toBe(false);
  });

  it("KAN-86: fetchBookingHistory returns only own bookings for collaborator without manage_bookings", async () => {
    adminFake.documents.set(`businesses/${BUSINESS_ID}/bookings/booking-own`, {
      businessId: BUSINESS_ID,
      collaboratorId: "collab-barber",
      customerId: "cust-1",
      endsAt: new Date("2026-11-20T15:30:00.000Z"),
      serviceId: "service-1",
      serviceSnapshot: { durationMinutes: 30, name: "Corte", priceInCents: 5000 },
      startsAt: new Date("2026-11-20T15:00:00.000Z"),
      status: "confirmed",
    });
    adminFake.documents.set(`businesses/${BUSINESS_ID}/bookings/booking-other`, {
      businessId: BUSINESS_ID,
      collaboratorId: "collab-manager",
      customerId: "cust-2",
      endsAt: new Date("2026-11-20T16:30:00.000Z"),
      serviceId: "service-1",
      serviceSnapshot: { durationMinutes: 30, name: "Corte", priceInCents: 5000 },
      startsAt: new Date("2026-11-20T16:00:00.000Z"),
      status: "confirmed",
    });

    const barberHistory = await callEndpoint(
      "fetchBookingHistory",
      { businessId: BUSINESS_ID },
      "collab-barber-token",
    );
    expect(barberHistory.statusCode).toBe(200);
    expect(barberHistory.body.bookings).toHaveLength(1);
    expect(
      (barberHistory.body.bookings as Array<{ id: string }>)[0]?.id,
    ).toBe("booking-own");

    const managerHistory = await callEndpoint(
      "fetchBookingHistory",
      { businessId: BUSINESS_ID },
      "collab-manager-token",
    );
    expect(managerHistory.statusCode).toBe(200);
    expect(managerHistory.body.bookings).toHaveLength(2);
  });
});
