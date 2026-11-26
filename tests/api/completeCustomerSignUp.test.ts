// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callServerFunction } from "./bookingTestHelpers";
import { CallableFailure } from "../../functions/src/shared/CallableFailure.js";

// The dispatcher runs the shared customer sign-up handler (Q8, KAN-123). The
// handler has its own emulator tests; here it is replaced to check what the
// dispatcher gives it and how it answers.
const handlerFake = vi.hoisted(() => ({
  handleCompleteCustomerSignUp: vi.fn(),
}));

vi.mock(
  "../../functions/src/auth/handlers/handleCompleteCustomerSignUp.js",
  () => ({
    handleCompleteCustomerSignUp: handlerFake.handleCompleteCustomerSignUp,
  }),
);

vi.mock("firebase-admin/app", () => ({
  cert: vi.fn(),
  getApps: (): object[] => [{}],
  initializeApp: vi.fn(),
}));

vi.mock("firebase-admin/auth", () => ({
  getAuth: (): object => ({}),
}));

vi.mock("firebase-admin/firestore", () => ({
  getFirestore: (): object => ({}),
  Timestamp: { now: (): Date => new Date() },
}));

const RECAPTCHA_SECRET_KEY = "vercel-secret-key";
const RECAPTCHA_TOKEN = "recaptcha-token";
const RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";
const VISITOR_TOKEN = "";
const SIGN_UP_PAYLOAD = {
  continueUrl: "https://booking.test/barberia-centro",
  email: "cliente@demo.test",
  fullName: "Ana Pérez",
  language: "es",
  password: "Emulator-Only-123!",
  phone: "+506 8888-0000",
  recaptchaToken: RECAPTCHA_TOKEN,
};

interface DispatchedInput {
  readonly verifyRecaptcha: (recaptchaToken: string) => Promise<void>;
}

// The handler checks the token before creating anything (AC-KAN-123-05), as
// the real one does, and records whether it went on to create the account.
const createAccountAfterRecaptcha = vi.fn();
const checkRecaptchaThenCreateAccount = async ({
  verifyRecaptcha,
}: DispatchedInput): Promise<{ verificationEmail: string }> => {
  await verifyRecaptcha(RECAPTCHA_TOKEN);
  createAccountAfterRecaptcha();
  return { verificationEmail: "sent" };
};

const answerGoogleWith = (verificationResult: unknown): void => {
  vi.mocked(fetch).mockResolvedValue(Response.json(verificationResult));
};

const signUpWithRecaptchaCheck = (): ReturnType<typeof callServerFunction> => {
  handlerFake.handleCompleteCustomerSignUp.mockImplementation(
    checkRecaptchaThenCreateAccount,
  );
  return callServerFunction(
    "completeCustomerSignUp",
    SIGN_UP_PAYLOAD,
    VISITOR_TOKEN,
  );
};

describe("Vercel dispatcher: completeCustomerSignUp (KAN-123, Q8)", () => {
  beforeEach((): void => {
    handlerFake.handleCompleteCustomerSignUp.mockReset();
    createAccountAfterRecaptcha.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach((): void => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("AC-KAN-123-01: a visitor reaches the shared handler with the payload and no caller", async () => {
    handlerFake.handleCompleteCustomerSignUp.mockResolvedValue({
      verificationEmail: "sent",
    });

    const result = await callServerFunction(
      "completeCustomerSignUp",
      SIGN_UP_PAYLOAD,
      VISITOR_TOKEN,
    );

    expect(result).toEqual({
      body: { verificationEmail: "sent" },
      statusCode: 200,
    });
    expect(handlerFake.handleCompleteCustomerSignUp).toHaveBeenCalledWith(
      expect.objectContaining({ caller: null, payload: SIGN_UP_PAYLOAD }),
    );
  });

  it("AC-KAN-123-05: without RECAPTCHA_SECRET_KEY the sign-up answers unavailable, asks nobody and creates nothing", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "");

    const result = await signUpWithRecaptchaCheck();

    expect(result.statusCode).toBe(503);
    expect(result.body.code).toBe("unavailable");
    expect(fetch).not.toHaveBeenCalled();
    expect(createAccountAfterRecaptcha).not.toHaveBeenCalled();
  });

  it("AC-KAN-123-05: with the key, Google checks the token with the key of Vercel before the account is created", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", RECAPTCHA_SECRET_KEY);
    answerGoogleWith({ success: true });

    const result = await signUpWithRecaptchaCheck();

    expect(result.statusCode).toBe(200);
    expect(createAccountAfterRecaptcha).toHaveBeenCalledOnce();
    const [verifyUrl, requestInit] = vi.mocked(fetch).mock.calls[0] ?? [];
    const requestBody = new URLSearchParams(String(requestInit?.body));
    expect(verifyUrl).toBe(RECAPTCHA_VERIFY_URL);
    expect(requestBody.get("response")).toBe(RECAPTCHA_TOKEN);
    expect(requestBody.get("secret")).toBe(RECAPTCHA_SECRET_KEY);
  });

  it("AC-KAN-123-05: a token Google rejects answers permission-denied and creates nothing", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", RECAPTCHA_SECRET_KEY);
    answerGoogleWith({ success: false });

    const result = await signUpWithRecaptchaCheck();

    expect(result.statusCode).toBe(403);
    expect(result.body.code).toBe("permission-denied");
    expect(createAccountAfterRecaptcha).not.toHaveBeenCalled();
  });

  it("answers a CallableFailure with its code, like a callable", async () => {
    handlerFake.handleCompleteCustomerSignUp.mockRejectedValue(
      new CallableFailure("invalid-argument", "fields are required"),
    );

    const result = await callServerFunction(
      "completeCustomerSignUp",
      {},
      VISITOR_TOKEN,
    );

    expect(result).toEqual({
      body: {
        code: "invalid-argument",
        error: "invalid-argument",
        message: "fields are required",
      },
      statusCode: 400,
    });
  });
});
