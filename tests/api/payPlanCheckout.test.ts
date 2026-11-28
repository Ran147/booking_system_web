// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { callServerFunction } from "./bookingTestHelpers";
import type { PayPlanCheckoutHandlerInput } from "../../functions/src/billing/handlers/handlePayPlanCheckout.js";
import { CallableFailure } from "../../functions/src/shared/CallableFailure.js";

// The dispatcher runs the shared payPlanCheckout handler of functions/src
// (Q8, KAN-22 spec §3.3). The payment rules have their own emulator tests in
// functions/src/billing/tests; here the handler is replaced to check what the
// dispatcher sends it, how it answers and the reCAPTCHA check it brings.
const handlerFake = vi.hoisted(() => ({
  handlePayPlanCheckout: vi.fn(),
}));

vi.mock(
  "../../functions/src/billing/handlers/handlePayPlanCheckout.js",
  () => ({
    handlePayPlanCheckout: handlerFake.handlePayPlanCheckout,
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
const NO_SESSION = "";

const CHECKOUT_PAYLOAD = {
  attemptId: "6f1c2d3e-4a5b-4c6d-8e7f-9a0b1c2d3e4f",
  email: "duena@ejemplo.com",
  expectedPriceInCents: 2900,
  planId: "plan-pro",
  recaptchaToken: RECAPTCHA_TOKEN,
};

// The handler checks the token first, as the real one does (AC-KAN-22-06),
// and records whether it went on to charge.
const chargeAfterRecaptcha = vi.fn();
const checkRecaptchaThenPay = async ({
  assertRecaptcha,
}: PayPlanCheckoutHandlerInput): Promise<{ email: string }> => {
  await assertRecaptcha(RECAPTCHA_TOKEN);
  chargeAfterRecaptcha();
  return { email: CHECKOUT_PAYLOAD.email };
};

const answerGoogleWith = (verificationResult: unknown): void => {
  vi.mocked(fetch).mockResolvedValue(Response.json(verificationResult));
};

describe("Vercel dispatcher: payPlanCheckout (KAN-22, Q8)", () => {
  beforeEach((): void => {
    handlerFake.handlePayPlanCheckout.mockReset();
    chargeAfterRecaptcha.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach((): void => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("AC-KAN-22-02: a visitor pays without a session through the shared handler", async () => {
    handlerFake.handlePayPlanCheckout.mockResolvedValue({
      email: CHECKOUT_PAYLOAD.email,
    });

    const result = await callServerFunction(
      "payPlanCheckout",
      CHECKOUT_PAYLOAD,
      NO_SESSION,
    );

    expect(result).toEqual({
      body: { email: CHECKOUT_PAYLOAD.email },
      statusCode: 200,
    });
    expect(handlerFake.handlePayPlanCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ caller: null, payload: CHECKOUT_PAYLOAD }),
    );
  });

  it("AC-KAN-22-04: a rule of the payment answers its code and reason, like the callable", async () => {
    handlerFake.handlePayPlanCheckout.mockRejectedValue(
      new CallableFailure(
        "failed-precondition",
        "The simulated gateway declined the card",
        { reason: "paymentDeclined" },
      ),
    );

    const result = await callServerFunction(
      "payPlanCheckout",
      CHECKOUT_PAYLOAD,
      NO_SESSION,
    );

    expect(result.statusCode).toBe(412);
    expect(result.body).toMatchObject({
      code: "failed-precondition",
      details: { reason: "paymentDeclined" },
    });
  });

  it("AC-KAN-22-06: without RECAPTCHA_SECRET_KEY the payment answers unavailable, asks nobody and charges nothing", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", "");
    handlerFake.handlePayPlanCheckout.mockImplementation(checkRecaptchaThenPay);

    const result = await callServerFunction(
      "payPlanCheckout",
      CHECKOUT_PAYLOAD,
      NO_SESSION,
    );

    expect(result.statusCode).toBe(503);
    expect(result.body.code).toBe("unavailable");
    expect(fetch).not.toHaveBeenCalled();
    expect(chargeAfterRecaptcha).not.toHaveBeenCalled();
  });

  it("AC-KAN-22-06: with the key, Google checks the token with the key of Vercel before the charge", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", RECAPTCHA_SECRET_KEY);
    answerGoogleWith({ success: true });
    handlerFake.handlePayPlanCheckout.mockImplementation(checkRecaptchaThenPay);

    const result = await callServerFunction(
      "payPlanCheckout",
      CHECKOUT_PAYLOAD,
      NO_SESSION,
    );

    expect(result.statusCode).toBe(200);
    expect(chargeAfterRecaptcha).toHaveBeenCalledOnce();
    const [verifyUrl, requestInit] = vi.mocked(fetch).mock.calls[0] ?? [];
    const requestBody = new URLSearchParams(String(requestInit?.body));
    expect(verifyUrl).toBe(RECAPTCHA_VERIFY_URL);
    expect(requestBody.get("response")).toBe(RECAPTCHA_TOKEN);
    expect(requestBody.get("secret")).toBe(RECAPTCHA_SECRET_KEY);
  });

  it("AC-KAN-22-06: a token Google rejects answers permission-denied and charges nothing", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", RECAPTCHA_SECRET_KEY);
    answerGoogleWith({ success: false });
    handlerFake.handlePayPlanCheckout.mockImplementation(checkRecaptchaThenPay);

    const result = await callServerFunction(
      "payPlanCheckout",
      CHECKOUT_PAYLOAD,
      NO_SESSION,
    );

    expect(result.statusCode).toBe(403);
    expect(result.body.code).toBe("permission-denied");
    expect(chargeAfterRecaptcha).not.toHaveBeenCalled();
  });

  it("AC-KAN-22-06: when Google cannot be reached the payment answers unavailable and charges nothing", async () => {
    vi.stubEnv("RECAPTCHA_SECRET_KEY", RECAPTCHA_SECRET_KEY);
    vi.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"));
    handlerFake.handlePayPlanCheckout.mockImplementation(checkRecaptchaThenPay);

    const result = await callServerFunction(
      "payPlanCheckout",
      CHECKOUT_PAYLOAD,
      NO_SESSION,
    );

    expect(result.statusCode).toBe(503);
    expect(result.body.code).toBe("unavailable");
    expect(chargeAfterRecaptcha).not.toHaveBeenCalled();
  });
});
