// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { callServerFunction } from "./bookingTestHelpers";
import { CallableFailure } from "../../functions/src/shared/CallableFailure.js";

// The dispatcher runs the shared validateSignUpLink and checkBusinessSlug
// handlers of functions/src (Q8, KAN-25 spec §3.3). Their rules have their own
// emulator tests; here the handlers are replaced to check what the dispatcher
// gives them and how it answers.
const handlerFake = vi.hoisted(() => ({
  handleCheckBusinessSlug: vi.fn(),
  handleValidateSignUpLink: vi.fn(),
}));

vi.mock(
  "../../functions/src/billing/handlers/handleValidateSignUpLink.js",
  () => ({ handleValidateSignUpLink: handlerFake.handleValidateSignUpLink }),
);

vi.mock(
  "../../functions/src/billing/handlers/handleCheckBusinessSlug.js",
  () => ({ handleCheckBusinessSlug: handlerFake.handleCheckBusinessSlug }),
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

const NO_SESSION = "";
const SIGN_UP_TOKEN = "sign-up-token";

describe("Vercel dispatcher: sign-up link and slug (KAN-25, Q8)", () => {
  beforeEach((): void => {
    handlerFake.handleCheckBusinessSlug.mockReset();
    handlerFake.handleValidateSignUpLink.mockReset();
  });

  it("AC-KAN-25-14: the link answers the plan paid for and the checkout email", async () => {
    const linkDetails = {
      amountInCents: 2900,
      billingPeriod: "monthly",
      checkoutEmail: "duena@ejemplo.com",
      planName: "Plan Profesional",
    };
    handlerFake.handleValidateSignUpLink.mockResolvedValue(linkDetails);

    const result = await callServerFunction(
      "validateSignUpLink",
      { signUpToken: SIGN_UP_TOKEN },
      NO_SESSION,
    );

    expect(result).toEqual({ body: linkDetails, statusCode: 200 });
    expect(handlerFake.handleValidateSignUpLink).toHaveBeenCalledWith(
      expect.objectContaining({
        caller: null,
        payload: { signUpToken: SIGN_UP_TOKEN },
      }),
    );
  });

  it("AC-KAN-25-20: an unknown link answers failed-precondition with its reason", async () => {
    handlerFake.handleValidateSignUpLink.mockRejectedValue(
      new CallableFailure("failed-precondition", "The link is not valid", {
        reason: "linkInvalid",
      }),
    );

    const result = await callServerFunction(
      "validateSignUpLink",
      { signUpToken: "any-email@example.com" },
      NO_SESSION,
    );

    expect(result.statusCode).toBe(412);
    expect(result.body).toMatchObject({ details: { reason: "linkInvalid" } });
  });

  it("AC-KAN-25-15: the slug check answers the availability the form reads", async () => {
    handlerFake.handleCheckBusinessSlug.mockResolvedValue({
      availability: "taken",
    });
    const slugPayload = {
      businessSlug: "peluqueria-dona-ana",
      signUpToken: SIGN_UP_TOKEN,
    };

    const result = await callServerFunction(
      "checkBusinessSlug",
      slugPayload,
      NO_SESSION,
    );

    expect(result).toEqual({
      body: { availability: "taken" },
      statusCode: 200,
    });
    expect(handlerFake.handleCheckBusinessSlug).toHaveBeenCalledWith(
      expect.objectContaining({ caller: null, payload: slugPayload }),
    );
  });
});
