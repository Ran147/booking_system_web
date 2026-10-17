import { HttpsError } from "firebase-functions/v2/https";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  APPROVED_CARD_NUMBER,
  CHECKOUT_TEST_ATTEMPT_ID,
  CHECKOUT_TEST_PLAN,
  buildCheckoutPayload,
  seedCheckoutPlan,
} from "./planCheckoutTestFixtures.js";
import { assertRecaptcha } from "../../auth/assertRecaptcha.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { PLAN_STATUS } from "../../shared/constants/PlanStatus.constants.js";
import { firestore } from "../../shared/firebaseAdmin.js";
import {
  assertEmulatorsRunning,
  buildCallableRequest,
  captureHttpsError,
  clearEmulators,
  functionsTestEnvironment,
  readErrorReason,
} from "../../shared/tests/emulatorTestHelpers.js";
import type { NullableUndefined } from "../../shared/types/Nullable.js";
import {
  PLAN_CHECKOUT_ERROR_REASON,
  SIMULATED_GATEWAY,
} from "../constants/PlanCheckout.constants.js";
import { payPlanCheckout } from "../payPlanCheckout.js";

// Google is not called from tests: assertRecaptcha has its own test, and here
// it accepts every token unless a test makes it reject one.
vi.mock("../../auth/assertRecaptcha.js", () => ({
  RECAPTCHA_SECRETS: [],
  assertRecaptcha: vi.fn(),
}));

const SECOND_ATTEMPT_ID = "0a9b8c7d-6e5f-4a3b-8c1d-2e3f4a5b6c7d";

const callPayPlanCheckout = functionsTestEnvironment.wrap(payPlanCheckout);

const countCheckouts = async (): Promise<number> =>
  (await firestore.collection(FIRESTORE_COLLECTION.PLAN_CHECKOUTS).get()).size;

const readCheckout = async (
  attemptId: string = CHECKOUT_TEST_ATTEMPT_ID,
): Promise<NullableUndefined<Record<string, unknown>>> =>
  (
    await firestore
      .collection(FIRESTORE_COLLECTION.PLAN_CHECKOUTS)
      .doc(attemptId)
      .get()
  ).data();

describe("payPlanCheckout", () => {
  beforeAll(assertEmulatorsRunning);

  beforeEach(async () => {
    await clearEmulators();
    vi.mocked(assertRecaptcha).mockReset().mockResolvedValue();
    await seedCheckoutPlan();
  });

  it("AC-KAN-22-02: stores one PlanCheckout with the plan, the email, the amount, the payment date and the terms acceptance", async () => {
    const checkoutResponse = await callPayPlanCheckout(
      buildCallableRequest(buildCheckoutPayload()),
    );

    expect(checkoutResponse).toEqual({ email: "owner@example.com" });
    const planCheckout = await readCheckout();
    expect(planCheckout).toMatchObject({
      amountInCents: CHECKOUT_TEST_PLAN.PRICE_IN_CENTS,
      email: "owner@example.com",
      language: "es",
      planId: CHECKOUT_TEST_PLAN.ID,
      signUpCompletedAt: null,
      termsVersion: expect.any(String),
    });
    expect(planCheckout?.paidAt).toBeTruthy();
    expect(planCheckout?.termsAcceptedAt).toEqual(planCheckout?.paidAt);
    expect(planCheckout?.paymentReference).toMatch(
      new RegExp(`^${SIMULATED_GATEWAY.PAYMENT_REFERENCE_PREFIX}`),
    );
  });

  it("AC-KAN-22-02: leaves the sign-up link for the KAN-24 email (spec D1)", async () => {
    await callPayPlanCheckout(buildCallableRequest(buildCheckoutPayload()));

    expect(await readCheckout()).toMatchObject({
      signUpLinkExpiresAt: null,
      signUpTokenHash: null,
    });
  });

  it("AC-KAN-22-03: creates no account, business or payment", async () => {
    await callPayPlanCheckout(buildCallableRequest(buildCheckoutPayload()));

    for (const collectionName of [
      FIRESTORE_COLLECTION.BUSINESSES,
      FIRESTORE_COLLECTION.USERS,
      FIRESTORE_COLLECTION.PAYMENTS,
    ]) {
      // collectionGroup also finds the payments under each business.
      expect((await firestore.collectionGroup(collectionName).get()).size).toBe(
        0,
      );
    }
  });

  it("AS-9: never stores the card data", async () => {
    await callPayPlanCheckout(buildCallableRequest(buildCheckoutPayload()));

    const storedCheckout = JSON.stringify(await readCheckout());
    expect(storedCheckout).not.toContain("4242");
    expect(storedCheckout).not.toContain("Ana Pérez");
    expect(storedCheckout).not.toContain("12/40");
  });

  it("AC-KAN-22-04: declines the test card, stores nothing and lets the visitor try again", async () => {
    const httpsError = await captureHttpsError(
      callPayPlanCheckout(
        buildCallableRequest(
          buildCheckoutPayload({
            cardNumber: SIMULATED_GATEWAY.DECLINED_CARD_NUMBER,
          }),
        ),
      ),
    );

    expect(httpsError.code).toBe("failed-precondition");
    expect(readErrorReason(httpsError)).toBe(
      PLAN_CHECKOUT_ERROR_REASON.PAYMENT_DECLINED,
    );
    expect(await countCheckouts()).toBe(0);
    await expect(
      callPayPlanCheckout(
        buildCallableRequest(
          buildCheckoutPayload({ attemptId: SECOND_ATTEMPT_ID }),
        ),
      ),
    ).resolves.toEqual({ email: "owner@example.com" });
  });

  it("AC-KAN-22-06: verifies the reCAPTCHA token and charges nothing when it is rejected", async () => {
    vi.mocked(assertRecaptcha).mockRejectedValueOnce(
      new HttpsError("permission-denied", "The reCAPTCHA token was rejected"),
    );

    const httpsError = await captureHttpsError(
      callPayPlanCheckout(buildCallableRequest(buildCheckoutPayload())),
    );

    expect(assertRecaptcha).toHaveBeenCalledWith("recaptcha-token");
    expect(httpsError.code).toBe("permission-denied");
    expect(await countCheckouts()).toBe(0);
  });

  it("AC-KAN-22-07: rejects an inactive plan with PLAN_UNAVAILABLE and charges nothing", async () => {
    await seedCheckoutPlan({ status: PLAN_STATUS.INACTIVE });

    const httpsError = await captureHttpsError(
      callPayPlanCheckout(buildCallableRequest(buildCheckoutPayload())),
    );

    expect(httpsError.code).toBe("failed-precondition");
    expect(readErrorReason(httpsError)).toBe(
      PLAN_CHECKOUT_ERROR_REASON.PLAN_UNAVAILABLE,
    );
    expect(await countCheckouts()).toBe(0);
  });

  it("AC-KAN-22-07: rejects a deleted plan with PLAN_UNAVAILABLE", async () => {
    const httpsError = await captureHttpsError(
      callPayPlanCheckout(
        buildCallableRequest(buildCheckoutPayload({ planId: "deleted-plan" })),
      ),
    );

    expect(httpsError.code).toBe("failed-precondition");
    expect(readErrorReason(httpsError)).toBe(
      PLAN_CHECKOUT_ERROR_REASON.PLAN_UNAVAILABLE,
    );
  });

  it("AC-KAN-22-08: rejects a changed price with PRICE_CHANGED, sends the new price and charges nothing", async () => {
    await seedCheckoutPlan({ priceInCents: 59_900 });

    const httpsError = await captureHttpsError(
      callPayPlanCheckout(buildCallableRequest(buildCheckoutPayload())),
    );

    expect(httpsError.code).toBe("failed-precondition");
    expect(httpsError.details).toEqual({
      currentPriceInCents: 59_900,
      reason: PLAN_CHECKOUT_ERROR_REASON.PRICE_CHANGED,
    });
    expect(await countCheckouts()).toBe(0);
  });

  it("AC-KAN-22-09: answers a retry of a paid attempt without charging it twice", async () => {
    await callPayPlanCheckout(buildCallableRequest(buildCheckoutPayload()));
    const firstCheckout = await readCheckout();

    await expect(
      callPayPlanCheckout(buildCallableRequest(buildCheckoutPayload())),
    ).resolves.toEqual({ email: "owner@example.com" });

    expect(await countCheckouts()).toBe(1);
    expect((await readCheckout())?.paymentReference).toBe(
      firstCheckout?.paymentReference,
    );
  });

  it("AC-KAN-22-09: answers a retry after the plan was deactivated with the paid checkout", async () => {
    await callPayPlanCheckout(buildCallableRequest(buildCheckoutPayload()));
    await seedCheckoutPlan({ status: PLAN_STATUS.INACTIVE });

    await expect(
      callPayPlanCheckout(buildCallableRequest(buildCheckoutPayload())),
    ).resolves.toEqual({ email: "owner@example.com" });
    expect(await countCheckouts()).toBe(1);
  });

  it("AC-KAN-22-10: stores one PlanCheckout when the same attempt arrives twice at once", async () => {
    const checkoutResults = await Promise.all([
      callPayPlanCheckout(buildCallableRequest(buildCheckoutPayload())),
      callPayPlanCheckout(buildCallableRequest(buildCheckoutPayload())),
    ]);

    expect(checkoutResults).toEqual([
      { email: "owner@example.com" },
      { email: "owner@example.com" },
    ]);
    expect(await countCheckouts()).toBe(1);
  });

  it("AC-KAN-22-11: stores the email trimmed and in lower case", async () => {
    const checkoutResponse = await callPayPlanCheckout(
      buildCallableRequest(
        buildCheckoutPayload({ email: "  Owner@Example.COM " }),
      ),
    );

    expect(checkoutResponse).toEqual({ email: "owner@example.com" });
    expect((await readCheckout())?.email).toBe("owner@example.com");
  });

  it("AS-9: accepts a card number typed without spaces", async () => {
    await expect(
      callPayPlanCheckout(
        buildCallableRequest(
          buildCheckoutPayload({
            cardNumber: APPROVED_CARD_NUMBER.replaceAll(" ", ""),
          }),
        ),
      ),
    ).resolves.toEqual({ email: "owner@example.com" });
  });

  it.each([
    ["an invalid email (AC-KAN-22-05)", { email: "owner@" }],
    [
      "a card number with 15 digits (AC-KAN-22-05)",
      { cardNumber: "424242424242424" },
    ],
    ["an expired card (AC-KAN-22-05)", { cardExpiry: "01/20" }],
    ["an expiry outside MM/AA (AC-KAN-22-05)", { cardExpiry: "13/40" }],
    ["a CVC with letters (AC-KAN-22-05)", { cardCvc: "12a" }],
    ["a too short cardholder name (AC-KAN-22-05)", { cardholderName: "A" }],
    ["terms not accepted (AC-KAN-23-03)", { termsAccepted: false }],
    ["a missing reCAPTCHA token (AC-KAN-22-06)", { recaptchaToken: "" }],
    [
      "an attempt id that is not a UUID (AC-KAN-22-09)",
      { attemptId: "attempt-1" },
    ],
    ["a negative expected price (AC-KAN-22-08)", { expectedPriceInCents: -1 }],
    ["an unknown language", { language: "fr" }],
  ])(
    "rejects %s as invalid-argument and charges nothing",
    async (_caseName, payloadOverrides) => {
      const httpsError = await captureHttpsError(
        callPayPlanCheckout(
          buildCallableRequest(buildCheckoutPayload(payloadOverrides)),
        ),
      );

      expect(httpsError.code).toBe("invalid-argument");
      expect(assertRecaptcha).not.toHaveBeenCalled();
      expect(await countCheckouts()).toBe(0);
    },
  );
});
