// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
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

const VISITOR_TOKEN = "";
const SIGN_UP_PAYLOAD = {
  continueUrl: "https://booking.test/barberia-centro",
  email: "cliente@demo.test",
  fullName: "Ana Pérez",
  language: "es",
  password: "Emulator-Only-123!",
  phone: "+506 8888-0000",
  recaptchaToken: "recaptcha-token",
};

interface DispatchedInput {
  readonly caller: unknown;
  readonly payload: unknown;
  readonly verifyRecaptcha: (recaptchaToken: string) => Promise<void>;
}

describe("Vercel dispatcher: completeCustomerSignUp (KAN-123, Q8)", () => {
  beforeEach((): void => {
    handlerFake.handleCompleteCustomerSignUp.mockReset();
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

  it("AC-KAN-123-05: until #65 the reCAPTCHA check in Vercel refuses every token (fail-closed)", async () => {
    handlerFake.handleCompleteCustomerSignUp.mockResolvedValue({
      verificationEmail: "sent",
    });
    await callServerFunction(
      "completeCustomerSignUp",
      SIGN_UP_PAYLOAD,
      VISITOR_TOKEN,
    );
    const [dispatchedInput] = handlerFake.handleCompleteCustomerSignUp.mock
      .calls[0] as [DispatchedInput];

    await expect(
      dispatchedInput.verifyRecaptcha("recaptcha-token"),
    ).rejects.toMatchObject({ code: "permission-denied" });
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
