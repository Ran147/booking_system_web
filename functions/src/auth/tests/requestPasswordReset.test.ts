import { HttpsError } from "firebase-functions/v2/https";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { auth, firestore } from "../../shared/firebaseAdmin.js";
import {
  assertEmulatorsRunning,
  buildCallableRequest,
  captureHttpsError,
  clearEmulators,
  functionsTestEnvironment,
} from "../../shared/tests/emulatorTestHelpers.js";
import { assertRecaptcha } from "../assertRecaptcha.js";
import { PASSWORD_RESET } from "../constants/PasswordReset.constants.js";
import { requestPasswordReset } from "../requestPasswordReset.js";

// Google is not called from tests: assertRecaptcha has its own test, and here
// it accepts every token unless a test makes it reject one.
vi.mock("../assertRecaptcha.js", () => ({
  RECAPTCHA_SECRETS: [],
  assertRecaptcha: vi.fn(),
}));

const TEST_PROJECT_ID = process.env.GCLOUD_PROJECT ?? "demo-booking-system";
const EXISTING_EMAIL = "suscriptor@demo.test";
const UNKNOWN_EMAIL = "nadie@demo.test";
const SEND_OOB_CODE_PATH = "accounts:sendOobCode";
const TIMER_TOLERANCE_MS = 100;

const callRequestPasswordReset =
  functionsTestEnvironment.wrap(requestPasswordReset);

const buildPayload = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  email: EXISTING_EMAIL,
  recaptchaToken: "recaptcha-token",
  ...overrides,
});

interface OobCodeEntry {
  readonly email: string;
  readonly requestType: string;
}

// The Auth emulator keeps the reset links it was asked to send, and clearing
// the accounts does not clear them: each test reads only the new ones.
const readAllResetEmails = async (): Promise<OobCodeEntry[]> => {
  const oobCodesResponse = await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${TEST_PROJECT_ID}/oobCodes`,
  );
  const { oobCodes } = (await oobCodesResponse.json()) as {
    oobCodes: OobCodeEntry[];
  };

  return oobCodes;
};

// Locale header of each request made to the sendOobCode endpoint.
const readRequestedLocales = (
  fetchSpy: ReturnType<typeof vi.spyOn>,
): unknown[] =>
  fetchSpy.mock.calls
    .filter(([requestUrl]) => String(requestUrl).includes(SEND_OOB_CODE_PATH))
    .map(
      ([, requestInit]) =>
        (requestInit as { headers: Record<string, string> }).headers[
          PASSWORD_RESET.LOCALE_HEADER
        ],
    );

let resetEmailsBeforeTest = 0;

const readSentResetEmails = async (): Promise<OobCodeEntry[]> =>
  (await readAllResetEmails()).slice(resetEmailsBeforeTest);

const createAccount = async (language?: string): Promise<void> => {
  const userRecord = await auth.createUser({
    email: EXISTING_EMAIL,
    password: "Emulator-Only-123!",
  });
  if (language) {
    await firestore
      .collection(FIRESTORE_COLLECTION.USERS)
      .doc(userRecord.uid)
      .set({ language });
  }
};

describe("requestPasswordReset", () => {
  beforeAll(assertEmulatorsRunning);

  beforeEach(async () => {
    await clearEmulators();
    vi.stubEnv(
      PASSWORD_RESET.EMULATOR_ENV_VAR,
      PASSWORD_RESET.EMULATOR_FLAG_ENABLED,
    );
    vi.mocked(assertRecaptcha).mockReset().mockResolvedValue();
    resetEmailsBeforeTest = (await readAllResetEmails()).length;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("KAN-36: asks Firebase Auth to email a reset link to an existing account (AC-KAN-36-02)", async () => {
    await createAccount("es");

    const resetResponse = await callRequestPasswordReset(
      buildCallableRequest(buildPayload()),
    );

    expect(resetResponse).toEqual({ isRequested: true });
    expect(await readSentResetEmails()).toEqual([
      expect.objectContaining({
        email: EXISTING_EMAIL,
        requestType: PASSWORD_RESET.REQUEST_TYPE,
      }),
    ]);
  });

  it("KAN-36: answers the same and sends nothing for an unknown email (AC-KAN-36-02)", async () => {
    await createAccount("es");

    const resetResponse = await callRequestPasswordReset(
      buildCallableRequest(buildPayload({ email: UNKNOWN_EMAIL })),
    );

    expect(resetResponse).toEqual({ isRequested: true });
    expect(await readSentResetEmails()).toEqual([]);
  });

  it("KAN-36: asks for the email in the language saved in the profile (AC-KAN-36-02)", async () => {
    await createAccount("en");
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await callRequestPasswordReset(buildCallableRequest(buildPayload()));

    expect(readRequestedLocales(fetchSpy)).toEqual(["en"]);
  });

  it("KAN-36: falls back to Spanish when the profile has no language", async () => {
    await createAccount();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await callRequestPasswordReset(buildCallableRequest(buildPayload()));

    expect(readRequestedLocales(fetchSpy)).toEqual(["es"]);
  });

  it("KAN-36: normalizes the email before looking the account up", async () => {
    await createAccount("es");

    await callRequestPasswordReset(
      buildCallableRequest(
        buildPayload({ email: `  ${EXISTING_EMAIL.toUpperCase()} ` }),
      ),
    );

    expect(await readSentResetEmails()).toHaveLength(1);
  });

  it("KAN-36: rejects a reCAPTCHA token Google refuses and sends nothing (AC-KAN-36-04)", async () => {
    await createAccount("es");
    vi.mocked(assertRecaptcha).mockRejectedValue(
      new HttpsError("permission-denied", "rejected"),
    );

    const httpsError = await captureHttpsError(
      callRequestPasswordReset(buildCallableRequest(buildPayload())),
    );

    expect(httpsError.code).toBe("permission-denied");
    expect(await readSentResetEmails()).toEqual([]);
  });

  it.each([
    ["an invalid email", { email: "not-an-email" }],
    ["a missing email", { email: undefined }],
    ["a missing reCAPTCHA token", { recaptchaToken: "" }],
  ])(
    "KAN-36: rejects %s with invalid-argument before the reCAPTCHA check (AC-KAN-36-03)",
    async (_caseName, overrides) => {
      const httpsError = await captureHttpsError(
        callRequestPasswordReset(buildCallableRequest(buildPayload(overrides))),
      );

      expect(httpsError.code).toBe("invalid-argument");
      expect(assertRecaptcha).not.toHaveBeenCalled();
    },
  );

  it("KAN-36: takes the same minimum time for an existing and an unknown account (AC-KAN-36-02)", async () => {
    await createAccount("es");
    const measureCall = async (email: string): Promise<number> => {
      const startedAt = Date.now();
      await callRequestPasswordReset(
        buildCallableRequest(buildPayload({ email })),
      );
      return Date.now() - startedAt;
    };

    const existingDuration = await measureCall(EXISTING_EMAIL);
    const unknownDuration = await measureCall(UNKNOWN_EMAIL);

    const minimumDuration =
      PASSWORD_RESET.MINIMUM_RESPONSE_MS - TIMER_TOLERANCE_MS;
    expect(existingDuration).toBeGreaterThanOrEqual(minimumDuration);
    expect(unknownDuration).toBeGreaterThanOrEqual(minimumDuration);
  });

  it.each([
    ["is not set", undefined],
    ["is empty", "   "],
  ])(
    "KAN-36: fails visibly outside the emulator when the web API key %s",
    async (_caseName, webApiKey) => {
      await createAccount("es");
      vi.stubEnv(PASSWORD_RESET.EMULATOR_ENV_VAR, "false");
      vi.stubEnv(PASSWORD_RESET.WEB_API_KEY_ENV_VAR, webApiKey);

      const httpsError = await captureHttpsError(
        callRequestPasswordReset(buildCallableRequest(buildPayload())),
      );

      expect(httpsError.code).toBe("internal");
      expect(await readSentResetEmails()).toEqual([]);
    },
  );

  it("KAN-36: outside the emulator asks Google with the configured web API key", async () => {
    await createAccount("es");
    vi.stubEnv(PASSWORD_RESET.EMULATOR_ENV_VAR, "false");
    vi.stubEnv(PASSWORD_RESET.WEB_API_KEY_ENV_VAR, "real-web-api-key");
    const originalFetch = globalThis.fetch;
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation((requestUrl, init) =>
        String(requestUrl).includes(SEND_OOB_CODE_PATH)
          ? Promise.resolve(new Response("{}", { status: 200 }))
          : originalFetch(requestUrl, init),
      );

    await callRequestPasswordReset(buildCallableRequest(buildPayload()));

    const sentUrls = fetchSpy.mock.calls
      .map(([requestUrl]) => String(requestUrl))
      .filter((requestUrl) => requestUrl.includes(SEND_OOB_CODE_PATH));
    expect(sentUrls).toEqual([
      `${PASSWORD_RESET.PRODUCTION_URL}?key=real-web-api-key`,
    ]);
  });

  it("KAN-36: still answers when Firebase refuses to send the email", async () => {
    await createAccount("es");
    const originalFetch = globalThis.fetch;
    vi.spyOn(globalThis, "fetch").mockImplementation((requestUrl, init) =>
      String(requestUrl).includes(SEND_OOB_CODE_PATH)
        ? Promise.resolve(new Response("{}", { status: 400 }))
        : originalFetch(requestUrl, init),
    );

    const resetResponse = await callRequestPasswordReset(
      buildCallableRequest(buildPayload()),
    );

    expect(resetResponse).toEqual({ isRequested: true });
  });
});
