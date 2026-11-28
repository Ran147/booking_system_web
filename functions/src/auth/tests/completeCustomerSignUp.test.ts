import { createRequire } from "node:module";
import type * as FirebaseAdminApp from "firebase-admin/app";
import type * as FirebaseAdminFirestore from "firebase-admin/firestore";
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
import { EMULATOR } from "../../shared/constants/Emulator.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { USER_ROLE } from "../../shared/constants/UserRole.constants.js";
import { auth, firestore } from "../../shared/firebaseAdmin.js";
import {
  assertEmulatorsRunning,
  buildCallableRequest,
  captureHttpsError,
  clearEmulators,
  functionsTestEnvironment,
} from "../../shared/tests/emulatorTestHelpers.js";
import { assertRecaptcha } from "../assertRecaptcha.js";
import { completeCustomerSignUp } from "../completeCustomerSignUp.js";
import {
  CUSTOMER_SIGN_UP,
  VERIFICATION_EMAIL_STATUS,
} from "../constants/CustomerSignUp.constants.js";
import { handleCompleteCustomerSignUp } from "../handlers/handleCompleteCustomerSignUp.js";

// Google is not called from tests: assertRecaptcha has its own test, and here
// it accepts every token unless a test makes it reject one.
vi.mock("../assertRecaptcha.js", () => ({
  RECAPTCHA_SECRETS: [],
  assertRecaptcha: vi.fn(),
}));

const TEST_PROJECT_ID = process.env.GCLOUD_PROJECT ?? "demo-booking-system";
const NEW_EMAIL = "cliente.nuevo@demo.test";
const CONTINUE_URL = "http://localhost:5173/barberia-centro";
const DISPATCHER_APP_NAME = "vercel-dispatcher-copy";
const REPOSITORY_ROOT_PACKAGE_JSON = "../../../../package.json";

const callCompleteCustomerSignUp = functionsTestEnvironment.wrap(
  completeCustomerSignUp,
);

const buildPayload = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  continueUrl: CONTINUE_URL,
  email: NEW_EMAIL,
  fullName: "Ana Pérez",
  language: "es",
  password: "Emulator-Only-123!",
  phone: "+506 8888-0000",
  recaptchaToken: "recaptcha-token",
  ...overrides,
});

const signUp = (overrides: Record<string, unknown> = {}): Promise<unknown> =>
  callCompleteCustomerSignUp(buildCallableRequest(buildPayload(overrides)));

interface OobCodeEntry {
  readonly email: string;
  readonly requestType: string;
}

// The Auth emulator keeps the links it was asked to send, and clearing the
// accounts does not clear them: each test reads only the new ones.
const readAllOobCodes = async (): Promise<OobCodeEntry[]> => {
  const oobCodesResponse = await fetch(
    `http://${process.env.FIREBASE_AUTH_EMULATOR_HOST}/emulator/v1/projects/${TEST_PROJECT_ID}/oobCodes`,
  );
  const { oobCodes } = (await oobCodesResponse.json()) as {
    oobCodes: OobCodeEntry[];
  };
  return oobCodes;
};

let oobCodesBeforeTest = 0;

const readSentVerificationEmails = async (): Promise<OobCodeEntry[]> =>
  (await readAllOobCodes())
    .slice(oobCodesBeforeTest)
    .filter(
      (oobCode) =>
        oobCode.requestType ===
        CUSTOMER_SIGN_UP.IDENTITY_TOOLKIT.VERIFY_EMAIL_REQUEST_TYPE,
    );

const countAuthUsers = async (): Promise<number> =>
  (await auth.listUsers()).users.length;

// The Vercel dispatcher loads firebase-admin from the repository root, while
// the handler is built with the copy in functions/node_modules (Q8). This
// returns a Firestore of the root copy, connected to the same emulator.
const readRepositoryRootFirestore = (): FirebaseAdminFirestore.Firestore => {
  const requireFromRepositoryRoot = createRequire(
    new URL(REPOSITORY_ROOT_PACKAGE_JSON, import.meta.url),
  );
  const rootApp = requireFromRepositoryRoot(
    "firebase-admin/app",
  ) as typeof FirebaseAdminApp;
  const rootFirestore = requireFromRepositoryRoot(
    "firebase-admin/firestore",
  ) as typeof FirebaseAdminFirestore;
  const dispatcherApp =
    rootApp.getApps().find((app) => app.name === DISPATCHER_APP_NAME) ??
    rootApp.initializeApp({ projectId: TEST_PROJECT_ID }, DISPATCHER_APP_NAME);
  return rootFirestore.getFirestore(dispatcherApp);
};

describe("completeCustomerSignUp", () => {
  beforeAll(assertEmulatorsRunning);

  beforeEach(async () => {
    await clearEmulators();
    vi.stubEnv(EMULATOR.ENV_VAR, EMULATOR.FLAG_ENABLED);
    vi.mocked(assertRecaptcha).mockReset().mockResolvedValue();
    oobCodesBeforeTest = (await readAllOobCodes()).length;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("AC-KAN-123-01 / AC-KAN-123-11: creates the account, the customer claim and users/{uid}", async () => {
    await expect(signUp()).resolves.toEqual({
      verificationEmail: VERIFICATION_EMAIL_STATUS.SENT,
    });

    const userRecord = await auth.getUserByEmail(NEW_EMAIL);
    expect(userRecord.emailVerified).toBe(false);
    expect(userRecord.displayName).toBe("Ana Pérez");
    expect(userRecord.customClaims).toEqual({ role: USER_ROLE.CUSTOMER });

    const userSnapshot = await firestore
      .collection(FIRESTORE_COLLECTION.USERS)
      .doc(userRecord.uid)
      .get();
    expect(userSnapshot.data()).toMatchObject({
      email: NEW_EMAIL,
      fullName: "Ana Pérez",
      language: "es",
      phone: "+506 8888-0000",
      role: USER_ROLE.CUSTOMER,
      theme: CUSTOMER_SIGN_UP.DEFAULT_THEME,
      uid: userRecord.uid,
    });
  });

  it("AC-KAN-123-11 / AS-2: creates no business-scoped Customer", async () => {
    await signUp();

    const customerSnapshots = await firestore
      .collectionGroup(FIRESTORE_COLLECTION.CUSTOMERS)
      .get();
    expect(customerSnapshots.size).toBe(0);
  });

  it("AC-KAN-126-01: Firebase Auth is asked for the verification email of the new account", async () => {
    await signUp();

    expect(await readSentVerificationEmails()).toEqual([
      expect.objectContaining({ email: NEW_EMAIL }),
    ]);
  });

  it("AC-KAN-126-01: the email is asked for in the visitor's language with the continueUrl", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await signUp({ language: "en" });

    const sendOobCodeCall = fetchSpy.mock.calls.find(([requestUrl]) =>
      String(requestUrl).includes(
        CUSTOMER_SIGN_UP.IDENTITY_TOOLKIT.SEND_OOB_CODE,
      ),
    );
    const requestInit = sendOobCodeCall?.[1] as {
      body: string;
      headers: Record<string, string>;
    };
    expect(requestInit.headers["X-Firebase-Locale"]).toBe("en");
    expect(JSON.parse(requestInit.body)).toMatchObject({
      continueUrl: CONTINUE_URL,
      requestType: CUSTOMER_SIGN_UP.IDENTITY_TOOLKIT.VERIFY_EMAIL_REQUEST_TYPE,
    });
  });

  it("AC-KAN-126-04: if the email cannot be sent the account stays and the answer is sendFailed", async () => {
    const originalFetch = globalThis.fetch;
    vi.spyOn(globalThis, "fetch").mockImplementation((requestUrl, init) =>
      String(requestUrl).includes(
        CUSTOMER_SIGN_UP.IDENTITY_TOOLKIT.SEND_OOB_CODE,
      )
        ? Promise.resolve(new Response(null, { status: 503 }))
        : originalFetch(requestUrl, init),
    );

    await expect(signUp()).resolves.toEqual({
      verificationEmail: VERIFICATION_EMAIL_STATUS.SEND_FAILED,
    });
    expect((await auth.getUserByEmail(NEW_EMAIL)).customClaims).toEqual({
      role: USER_ROLE.CUSTOMER,
    });
  });

  it("AC-KAN-123-06 / AS-4: an existing email gets the same answer, no new account and no email", async () => {
    const existingUser = await auth.createUser({
      displayName: "Cuenta existente",
      email: NEW_EMAIL,
      password: "Existing-Only-123!",
    });

    await expect(signUp()).resolves.toEqual({
      verificationEmail: VERIFICATION_EMAIL_STATUS.SENT,
    });

    const userRecord = await auth.getUser(existingUser.uid);
    expect(userRecord.displayName).toBe("Cuenta existente");
    expect(userRecord.customClaims).toBeUndefined();
    expect(await countAuthUsers()).toBe(1);
    expect(await readSentVerificationEmails()).toEqual([]);
    const userSnapshot = await firestore
      .collection(FIRESTORE_COLLECTION.USERS)
      .doc(existingUser.uid)
      .get();
    expect(userSnapshot.exists).toBe(false);
  });

  it("AC-KAN-123-09: stores the email trimmed and in lowercase", async () => {
    await signUp({ email: "  Cliente.Nuevo@DEMO.test " });

    expect((await auth.getUserByEmail(NEW_EMAIL)).email).toBe(NEW_EMAIL);
  });

  it("AC-KAN-123-05: a rejected reCAPTCHA creates no account and sends nothing", async () => {
    vi.mocked(assertRecaptcha).mockRejectedValue(
      new HttpsError("permission-denied", "rejected"),
    );

    const httpsError = await captureHttpsError(signUp());

    expect(httpsError.code).toBe("permission-denied");
    expect(await countAuthUsers()).toBe(0);
    expect(await readSentVerificationEmails()).toEqual([]);
  });

  it.each([
    ["a weak password", { password: "debil" }],
    ["a phone with letters", { phone: "8888-abcd" }],
    ["a phone with too few digits", { phone: "12-34" }],
    ["a one-letter name", { fullName: "A" }],
    ["an invalid email", { email: "no-es-correo" }],
    ["a language that is not supported", { language: "fr" }],
    ["a continueUrl that is not a URL", { continueUrl: "barberia" }],
  ])(
    "AC-KAN-123-02 … 13: %s is rejected with invalid-argument before anything is created",
    async (_caseName, overrides) => {
      const httpsError = await captureHttpsError(signUp(overrides));

      expect(httpsError.code).toBe("invalid-argument");
      expect(assertRecaptcha).not.toHaveBeenCalled();
      expect(await countAuthUsers()).toBe(0);
    },
  );

  it("Q8: writes users/{uid} through the Firestore of another firebase-admin copy, as the Vercel dispatcher does", async () => {
    const dispatcherFirestore = readRepositoryRootFirestore();

    await expect(
      handleCompleteCustomerSignUp({
        auth,
        caller: null,
        firestore: dispatcherFirestore,
        now: new Date(),
        payload: buildPayload(),
        sendVerificationEmail: vi.fn().mockResolvedValue(true),
        verifyRecaptcha: vi.fn().mockResolvedValue(undefined),
      }),
    ).resolves.toEqual({ verificationEmail: VERIFICATION_EMAIL_STATUS.SENT });

    const userRecord = await auth.getUserByEmail(NEW_EMAIL);
    const userSnapshot = await firestore
      .collection(FIRESTORE_COLLECTION.USERS)
      .doc(userRecord.uid)
      .get();
    expect(userSnapshot.exists).toBe(true);
  });

  it("rolls back the Auth user when users/{uid} cannot be written", async () => {
    vi.spyOn(auth, "setCustomUserClaims").mockRejectedValueOnce(
      new Error("auth down"),
    );

    await expect(signUp()).rejects.toThrow("auth down");

    expect(await countAuthUsers()).toBe(0);
    expect(await readSentVerificationEmails()).toEqual([]);
  });
});
