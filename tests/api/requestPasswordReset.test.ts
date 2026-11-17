// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callServerFunction } from "./bookingTestHelpers";
import type { NullableUndefined } from "../../src/types/Nullable";

const adminFake = vi.hoisted(() => {
  const documents = new Map<string, Record<string, unknown>>();
  const accountIdsByEmail = new Map<string, string>();

  const createDocumentReference = (path: string): Record<string, unknown> => ({
    get: async (): Promise<{
      exists: boolean;
      ["data"]: () => NullableUndefined<Record<string, unknown>>;
    }> => ({
      ["data"]: (): NullableUndefined<Record<string, unknown>> =>
        documents.get(path),
      exists: documents.has(path),
    }),
  });

  return {
    accountIdsByEmail,
    auth: {
      getUserByEmail: async (email: string): Promise<{ uid: string }> => {
        const uid = accountIdsByEmail.get(email);
        if (!uid) {
          throw Object.assign(new Error("no user"), {
            code: "auth/user-not-found",
          });
        }
        return { uid };
      },
    },
    documents,
    firestore: {
      collection: (collectionName: string): Record<string, unknown> => ({
        doc: (documentId: string): Record<string, unknown> =>
          createDocumentReference(`${collectionName}/${documentId}`),
      }),
    },
  };
});

vi.mock("firebase-admin/app", () => ({
  cert: vi.fn(),
  getApps: (): object[] => [{}],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: (): object => adminFake.auth,
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: (): object => adminFake.firestore,
  Timestamp: { now: (): Date => new Date() },
}));

const ACCOUNT_EMAIL = "suscriptor@demo.test";
const ACCOUNT_ID = "subscriber-1";
const WEB_API_KEY = "web-api-key";
const NO_ID_TOKEN = "";

const requestReset = (
  payload: Record<string, unknown> = { email: ACCOUNT_EMAIL },
): ReturnType<typeof callServerFunction> =>
  callServerFunction(
    "requestPasswordReset",
    { recaptchaToken: "token", ...payload },
    NO_ID_TOKEN,
  );

describe("Vercel Serverless Function: requestPasswordReset (US-36)", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach((): void => {
    adminFake.documents.clear();
    adminFake.accountIdsByEmail.clear();
    adminFake.accountIdsByEmail.set(ACCOUNT_EMAIL, ACCOUNT_ID);
    fetchMock.mockReset();
    fetchMock.mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("FIREBASE_WEB_API_KEY", "");
    vi.stubEnv("VITE_FIREBASE_API_KEY", WEB_API_KEY);
  });

  afterEach((): void => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("AC-KAN-36-02: asks Firebase Auth to email the link in the language of the account", async () => {
    adminFake.documents.set(`users/${ACCOUNT_ID}`, { language: "en" });

    const result = await requestReset();

    expect(result).toEqual({ body: { isRequested: true }, statusCode: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(String(url)).toBe(
      `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${WEB_API_KEY}`,
    );
    expect(JSON.parse(String(init?.body))).toEqual({
      email: ACCOUNT_EMAIL,
      requestType: "PASSWORD_RESET",
    });
    expect(init?.headers).toMatchObject({ "X-Firebase-Locale": "en" });
  });

  it("AC-KAN-36-02: falls back to Spanish when the account has no supported language", async () => {
    adminFake.documents.set(`users/${ACCOUNT_ID}`, { language: "fr" });

    await requestReset();

    expect(fetchMock.mock.calls[0]?.[1]?.headers).toMatchObject({
      "X-Firebase-Locale": "es",
    });
  });

  it("AC-KAN-36-02: answers the same for an unknown account and sends nothing", async () => {
    const result = await requestReset({ email: "nadie@demo.test" });

    expect(result).toEqual({ body: { isRequested: true }, statusCode: 200 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("AC-KAN-36-02: answers the same when Google cannot be reached", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    const result = await requestReset();

    expect(result).toEqual({ body: { isRequested: true }, statusCode: 200 });
  });

  it("prefers FIREBASE_WEB_API_KEY over the build key", async () => {
    vi.stubEnv("FIREBASE_WEB_API_KEY", "server-key");

    await requestReset();

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("key=server-key");
  });

  it("fails visibly instead of answering sent when no web API key is set", async () => {
    vi.stubEnv("VITE_FIREBASE_API_KEY", "");

    const result = await requestReset();

    expect(result.statusCode).toBe(500);
    expect(result.body.error).toBe("internal");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("AC-KAN-36-03: rejects an empty email without sending anything", async () => {
    const result = await requestReset({ email: "  " });

    expect(result.statusCode).toBe(400);
    expect(result.body.error).toBe("invalid-argument");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
