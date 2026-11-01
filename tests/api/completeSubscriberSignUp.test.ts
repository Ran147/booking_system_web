// @vitest-environment node
import { callApiFunction, type FunctionResult } from "./callApiFunction";
import { firebaseAdminFake } from "./firebaseAdminFake";

// The Vercel sign-up (api/callFunction.ts) with firebase-admin replaced by an
// in-memory Auth and Firestore: no real project and no emulator.
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

const callSignUp = (
  payload: Record<string, unknown>,
): Promise<FunctionResult> =>
  callApiFunction("completeSubscriberSignUp", payload);

describe("api completeSubscriberSignUp", () => {
  beforeEach(() => {
    firebaseAdminFake.reset();
  });

  it("AC-KAN-25-16: a new email and slug create the account, the slug lock and the business", async () => {
    const result = await callSignUp(SIGN_UP_PAYLOAD);

    expect(result).toEqual({
      body: { email: SIGN_UP_PAYLOAD.email },
      statusCode: 200,
    });
    expect(firebaseAdminFake.accounts.get("user-1")?.email).toBe(
      SIGN_UP_PAYLOAD.email,
    );
    expect(firebaseAdminFake.documents.get(SLUG_PATH)?.businessId).toBe(
      "business-barberia-centro",
    );
    expect(firebaseAdminFake.documents.get(BUSINESS_PATH)?.ownerUserId).toBe(
      "user-1",
    );
  });

  it("AC-KAN-25-09: an email that already has an account is rejected and the account is left as it is", async () => {
    firebaseAdminFake.accounts.set("user-existing", { ...EXISTING_ACCOUNT });

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
    expect(firebaseAdminFake.accounts.get("user-existing")).toEqual(
      EXISTING_ACCOUNT,
    );
    expect(firebaseAdminFake.documents.size).toBe(0);
  });

  it("AC-KAN-25-18: a taken slug is rejected, the existing business is left as it is and no account remains", async () => {
    const existingBusiness = { name: "Otro negocio", ownerUserId: "owner-1" };
    const existingSlug = { businessId: "business-barberia-centro" };
    firebaseAdminFake.documents.set(BUSINESS_PATH, existingBusiness);
    firebaseAdminFake.documents.set(SLUG_PATH, existingSlug);

    const result = await callSignUp(SIGN_UP_PAYLOAD);

    expect(result.statusCode).toBe(409);
    expect(result.body).toMatchObject({
      details: { reason: "slugTaken" },
      error: "already-exists",
    });
    expect(firebaseAdminFake.documents.get(BUSINESS_PATH)).toEqual(
      existingBusiness,
    );
    expect(firebaseAdminFake.documents.get(SLUG_PATH)).toEqual(existingSlug);
    expect(firebaseAdminFake.accounts.size).toBe(0);
  });

  it("AC-KAN-25-18: a business without its slug lock is not rewritten and the new lock is undone", async () => {
    const existingBusiness = { name: "Negocio viejo", ownerUserId: "owner-1" };
    firebaseAdminFake.documents.set(BUSINESS_PATH, existingBusiness);

    const result = await callSignUp(SIGN_UP_PAYLOAD);

    expect(result.statusCode).toBe(409);
    expect(result.body).toMatchObject({ details: { reason: "slugTaken" } });
    expect(firebaseAdminFake.documents.get(BUSINESS_PATH)).toEqual(
      existingBusiness,
    );
    expect(firebaseAdminFake.documents.has(SLUG_PATH)).toBe(false);
    expect(firebaseAdminFake.accounts.size).toBe(0);
  });

  it("AC-KAN-25-16: a write that fails after the account is created undoes the sign-up so it can be retried", async () => {
    firebaseAdminFake.failingPaths.add(SERVICE_PATH);

    const failedResult = await callSignUp(SIGN_UP_PAYLOAD);

    expect(failedResult.statusCode).toBe(500);
    expect(firebaseAdminFake.documents.size).toBe(0);
    expect(firebaseAdminFake.accounts.size).toBe(0);

    firebaseAdminFake.failingPaths.clear();
    const retriedResult = await callSignUp(SIGN_UP_PAYLOAD);

    expect(retriedResult.statusCode).toBe(200);
  });
});
