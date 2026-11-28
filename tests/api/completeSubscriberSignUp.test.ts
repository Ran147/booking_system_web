// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callServerFunction } from "./bookingTestHelpers";
import type { CompleteSubscriberSignUpInput } from "../../functions/src/billing/handlers/handleCompleteSubscriberSignUp.js";
import { CallableFailure } from "../../functions/src/shared/CallableFailure.js";

// The dispatcher runs the shared completeSubscriberSignUp handler of
// functions/src (Q8, KAN-25 spec §3.3). The sign-up rules have their own
// emulator tests in functions/src/billing/tests; here the handler is replaced
// to check what the dispatcher gives it, how it answers and the reCAPTCHA
// check it brings.
const handlerFake = vi.hoisted(() => ({
  handleCompleteSubscriberSignUp: vi.fn(),
}));

vi.mock(
  "../../functions/src/billing/handlers/handleCompleteSubscriberSignUp.js",
  () => ({
    handleCompleteSubscriberSignUp: handlerFake.handleCompleteSubscriberSignUp,
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
const NO_SESSION = "";
const CHECKOUT_EMAIL = "duena@ejemplo.com";

const SIGN_UP_PAYLOAD = {
  businessName: "Peluquería Doña Ana",
  businessSlug: "peluqueria-dona-ana",
  firstName: "Ana",
  language: "es",
  lastName: "Pérez",
  password: "Segura123!",
  phone: "",
  recaptchaToken: RECAPTCHA_TOKEN,
  signUpToken: "sign-up-token",
  timeZone: "America/Costa_Rica",
};

// The handler checks the token first, as the real one does (AC-KAN-25-08),
// and records whether it went on to create the account.
const createAccountAfterRecaptcha = vi.fn();
const checkRecaptchaThenSignUp = async ({
  assertRecaptcha,
}: CompleteSubscriberSignUpInput): Promise<{ email: string }> => {
  await assertRecaptcha(RECAPTCHA_TOKEN);
  createAccountAfterRecaptcha();
  return { email: CHECKOUT_EMAIL };
};

const callSignUp = (): ReturnType<typeof callServerFunction> =>
  callServerFunction("completeSubscriberSignUp", SIGN_UP_PAYLOAD, NO_SESSION);

describe("Vercel dispatcher: completeSubscriberSignUp (KAN-25, Q8)", () => {
  beforeEach((): void => {
    handlerFake.handleCompleteSubscriberSignUp.mockReset();
    createAccountAfterRecaptcha.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach((): void => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("AC-KAN-25-16: a visitor signs up without a session through the shared handler", async () => {
    handlerFake.handleCompleteSubscriberSignUp.mockResolvedValue({
      email: CHECKOUT_EMAIL,
    });

    const result = await callSignUp();

    expect(result).toEqual({
      body: { email: CHECKOUT_EMAIL },
      statusCode: 200,
    });
    expect(handlerFake.handleCompleteSubscriberSignUp).toHaveBeenCalledWith(
      expect.objectContaining({
        caller: null,
        now: expect.any(Date),
        payload: SIGN_UP_PAYLOAD,
        reportError: expect.any(Function),
      }),
    );
  });

  it.each([
    ["AC-KAN-25-09: an email that has an account", "accountExists"],
    ["AC-KAN-25-18: a taken slug", "slugTaken"],
  ])(
    "%s answers already-exists with its reason, like the callable",
    async (_caseName, reason) => {
      handlerFake.handleCompleteSubscriberSignUp.mockRejectedValue(
        new CallableFailure("already-exists", "Sign-up rejected", { reason }),
      );

      const result = await callSignUp();

      expect(result.statusCode).toBe(409);
      expect(result.body).toMatchObject({
        code: "already-exists",
        details: { reason },
      });
    },
  );

  it("AC-KAN-25-20: a used or expired link answers failed-precondition with its reason", async () => {
    handlerFake.handleCompleteSubscriberSignUp.mockRejectedValue(
      new CallableFailure("failed-precondition", "The link expired", {
        reason: "linkExpired",
      }),
    );

    const result = await callSignUp();

    expect(result.statusCode).toBe(412);
    expect(result.body).toMatchObject({ details: { reason: "linkExpired" } });
  });

  it("AC-KAN-25-08: without RECAPTCHA_SECRET_KEY the sign-up answers unavailable and creates nothing", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "");
    handlerFake.handleCompleteSubscriberSignUp.mockImplementation(
      checkRecaptchaThenSignUp,
    );

    const result = await callSignUp();

    expect(result.statusCode).toBe(503);
    expect(result.body.code).toBe("unavailable");
    expect(fetch).not.toHaveBeenCalled();
    expect(createAccountAfterRecaptcha).not.toHaveBeenCalled();
  });

  it("AC-KAN-25-08: a token Google rejects answers permission-denied and creates nothing", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", RECAPTCHA_SECRET_KEY);
    vi.mocked(fetch).mockResolvedValue(Response.json({ success: false }));
    handlerFake.handleCompleteSubscriberSignUp.mockImplementation(
      checkRecaptchaThenSignUp,
    );

    const result = await callSignUp();

    expect(result.statusCode).toBe(403);
    expect(result.body.code).toBe("permission-denied");
    expect(createAccountAfterRecaptcha).not.toHaveBeenCalled();
  });

  it("AC-KAN-25-08: a token Google accepts lets the handler create the account", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", RECAPTCHA_SECRET_KEY);
    vi.mocked(fetch).mockResolvedValue(Response.json({ success: true }));
    handlerFake.handleCompleteSubscriberSignUp.mockImplementation(
      checkRecaptchaThenSignUp,
    );

    const result = await callSignUp();

    expect(result.statusCode).toBe(200);
    expect(createAccountAfterRecaptcha).toHaveBeenCalledOnce();
  });

  it("AC-KAN-25-22: a failure the handler records goes to the Vercel logs", async () => {
    const stderrWrite = vi.spyOn(process.stderr, "write").mockReturnValue(true);
    handlerFake.handleCompleteSubscriberSignUp.mockImplementation(
      ({ reportError }: CompleteSubscriberSignUpInput) => {
        reportError("Claims not set", {
          error: new Error("Auth is down"),
          userId: "new-owner",
        });
        return Promise.resolve({ email: CHECKOUT_EMAIL });
      },
    );

    await callSignUp();

    const [loggedLine] = stderrWrite.mock.calls[0] ?? [];
    expect(JSON.parse(String(loggedLine))).toEqual({
      error: "Auth is down",
      message: "Claims not set",
      userId: "new-owner",
    });
    stderrWrite.mockRestore();
  });
});
