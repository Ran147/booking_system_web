// @vitest-environment node
import type { IncomingMessage, ServerResponse } from "node:http";
import handler from "../../api/callFunction";

// The Vercel sign-up (api/callFunction.ts) with firebase-admin replaced by an
// in-memory Auth and Firestore: no real project and no emulator.
const adminFake = vi.hoisted(() => {
  interface FakeAccount {
    customClaims?: Record<string, unknown>;
    displayName: string;
    email: string;
    password: string;
  }

  interface FakeTimestamp {
    milliseconds: number;
  }

  interface FakeDocumentReference {
    collection: (name: string) => FakeCollectionReference;
    create: (value: Record<string, unknown>) => Promise<void>;
    delete: () => Promise<void>;
    path: string;
    set: (
      value: Record<string, unknown>,
      options?: { merge?: boolean },
    ) => Promise<void>;
  }

  interface FakeCollectionReference {
    doc: (documentId: string) => FakeDocumentReference;
  }

  const accounts = new Map<string, FakeAccount>();
  const documents = new Map<string, Record<string, unknown>>();
  const failingPaths = new Set<string>();
  let createdAccountCount = 0;

  const createCodedError = (code: number | string): Error =>
    Object.assign(new Error(String(code)), { code });

  const assertWritable = (path: string): void => {
    if (failingPaths.has(path)) {
      throw new Error(`Write failed: ${path}`);
    }
  };

  const createDocumentReference = (path: string): FakeDocumentReference => ({
    collection: (name: string): FakeCollectionReference =>
      createCollectionReference(`${path}/${name}`),
    create: async (value: Record<string, unknown>): Promise<void> => {
      assertWritable(path);
      if (documents.has(path)) {
        throw createCodedError(6);
      }
      documents.set(path, value);
    },
    delete: async (): Promise<void> => {
      documents.delete(path);
    },
    path,
    set: async (
      value: Record<string, unknown>,
      options?: { merge?: boolean },
    ): Promise<void> => {
      assertWritable(path);
      documents.set(
        path,
        options?.merge ? { ...documents.get(path), ...value } : value,
      );
    },
  });

  const createCollectionReference = (
    path: string,
  ): FakeCollectionReference => ({
    doc: (documentId: string): FakeDocumentReference =>
      createDocumentReference(`${path}/${documentId}`),
  });

  const auth = {
    createUser: async (properties: {
      displayName: string;
      email: string;
      password: string;
    }): Promise<{ uid: string }> => {
      const isEmailTaken = [...accounts.values()].some(
        (account) => account.email === properties.email,
      );
      if (isEmailTaken) {
        throw createCodedError("auth/email-already-exists");
      }
      createdAccountCount += 1;
      const uid = `user-${createdAccountCount}`;
      accounts.set(uid, { ...properties });
      return { uid };
    },
    deleteUser: async (uid: string): Promise<void> => {
      accounts.delete(uid);
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
  };

  const firestore = {
    collection: createCollectionReference,
    recursiveDelete: async (reference: { path: string }): Promise<void> => {
      [...documents.keys()]
        .filter(
          (path) =>
            path === reference.path || path.startsWith(`${reference.path}/`),
        )
        .forEach((path) => documents.delete(path));
    },
  };

  const createTimestamp = (milliseconds: number): FakeTimestamp => ({
    milliseconds,
  });

  const reset = (): void => {
    accounts.clear();
    documents.clear();
    failingPaths.clear();
    createdAccountCount = 0;
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
    fromMillis: adminFake.createTimestamp,
    now: (): ReturnType<typeof adminFake.createTimestamp> =>
      adminFake.createTimestamp(Date.now()),
  },
}));

interface FunctionResult {
  readonly body: Record<string, unknown>;
  readonly statusCode: number;
}

const SIGN_UP_PAYLOAD = {
  businessName: "Barberia Centro",
  businessSlug: "barberia-centro",
  email: "nuevo@example.com",
  fullName: "Persona Nueva",
  password: "Segura123!",
  signUpToken: "nuevo@example.com",
};

const EXISTING_ACCOUNT = {
  displayName: "Persona Existente",
  email: "existente@example.com",
  password: "Original123!",
};

const BUSINESS_PATH = "businesses/business-barberia-centro";
const SLUG_PATH = "businessSlugs/barberia-centro";
const SERVICE_PATH = `${BUSINESS_PATH}/services/service-default`;

const callSignUp = async (
  payload: Record<string, unknown>,
): Promise<FunctionResult> => {
  let statusCode = 0;
  let responseContent = "";
  const request = {
    body: { functionName: "completeSubscriberSignUp", payload },
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

describe("api completeSubscriberSignUp", () => {
  beforeEach(() => {
    adminFake.reset();
  });

  it("AC-KAN-25-16: a new email and slug create the account, the slug lock and the business", async () => {
    const result = await callSignUp(SIGN_UP_PAYLOAD);

    expect(result).toEqual({
      body: { email: SIGN_UP_PAYLOAD.email },
      statusCode: 200,
    });
    expect(adminFake.accounts.get("user-1")?.email).toBe(SIGN_UP_PAYLOAD.email);
    expect(adminFake.documents.get(SLUG_PATH)?.businessId).toBe(
      "business-barberia-centro",
    );
    expect(adminFake.documents.get(BUSINESS_PATH)?.ownerUserId).toBe("user-1");
  });

  it("AC-KAN-25-09: an email that already has an account is rejected and the account is left as it is", async () => {
    adminFake.accounts.set("user-existing", { ...EXISTING_ACCOUNT });

    const result = await callSignUp({
      ...SIGN_UP_PAYLOAD,
      email: EXISTING_ACCOUNT.email,
      password: "Distinta123!",
    });

    expect(result.statusCode).toBe(409);
    expect(result.body).toMatchObject({
      details: { reason: "accountExists" },
      error: "already-exists",
    });
    expect(adminFake.accounts.get("user-existing")).toEqual(EXISTING_ACCOUNT);
    expect(adminFake.documents.size).toBe(0);
  });

  it("AC-KAN-25-18: a taken slug is rejected, the existing business is left as it is and no account remains", async () => {
    const existingBusiness = { name: "Otro negocio", ownerUserId: "owner-1" };
    const existingSlug = { businessId: "business-barberia-centro" };
    adminFake.documents.set(BUSINESS_PATH, existingBusiness);
    adminFake.documents.set(SLUG_PATH, existingSlug);

    const result = await callSignUp(SIGN_UP_PAYLOAD);

    expect(result.statusCode).toBe(409);
    expect(result.body).toMatchObject({
      details: { reason: "slugTaken" },
      error: "already-exists",
    });
    expect(adminFake.documents.get(BUSINESS_PATH)).toEqual(existingBusiness);
    expect(adminFake.documents.get(SLUG_PATH)).toEqual(existingSlug);
    expect(adminFake.accounts.size).toBe(0);
  });

  it("AC-KAN-25-18: a business without its slug lock is not rewritten and the new lock is undone", async () => {
    const existingBusiness = { name: "Negocio viejo", ownerUserId: "owner-1" };
    adminFake.documents.set(BUSINESS_PATH, existingBusiness);

    const result = await callSignUp(SIGN_UP_PAYLOAD);

    expect(result.statusCode).toBe(409);
    expect(result.body).toMatchObject({ details: { reason: "slugTaken" } });
    expect(adminFake.documents.get(BUSINESS_PATH)).toEqual(existingBusiness);
    expect(adminFake.documents.has(SLUG_PATH)).toBe(false);
    expect(adminFake.accounts.size).toBe(0);
  });

  it("AC-KAN-25-16: a write that fails after the account is created undoes the sign-up so it can be retried", async () => {
    adminFake.failingPaths.add(SERVICE_PATH);

    const failedResult = await callSignUp(SIGN_UP_PAYLOAD);

    expect(failedResult.statusCode).toBe(500);
    expect(adminFake.documents.size).toBe(0);
    expect(adminFake.accounts.size).toBe(0);

    adminFake.failingPaths.clear();
    const retriedResult = await callSignUp(SIGN_UP_PAYLOAD);

    expect(retriedResult.statusCode).toBe(200);
  });
});
