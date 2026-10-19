import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  assertEmulatorsRunning,
  buildCallableRequest,
  captureHttpsError,
  clearEmulators,
  functionsTestEnvironment,
  readErrorReason,
} from "../../shared/tests/emulatorTestHelpers.js";
import { SIGN_UP_ERROR_REASON } from "../constants/SubscriberSignUp.constants.js";
import { validateSignUpLink } from "../validateSignUpLink.js";
import {
  SIGN_UP_LINK_STATE,
  TEST_CHECKOUT_EMAIL,
  TEST_PLAN,
  seedCheckout,
  seedPlan,
} from "./signUpTestFixtures.js";

const callValidateSignUpLink =
  functionsTestEnvironment.wrap(validateSignUpLink);

describe("validateSignUpLink", () => {
  beforeAll(assertEmulatorsRunning);

  beforeEach(async () => {
    await clearEmulators();
    await seedPlan();
  });

  it("KAN-25: answers the checkout email and the plan for a valid link (AC-KAN-25-14)", async () => {
    await seedCheckout({ signUpToken: "valid-token" });

    const linkResponse = await callValidateSignUpLink(
      buildCallableRequest({ signUpToken: "valid-token" }),
    );

    expect(linkResponse).toEqual({
      amountInCents: TEST_PLAN.PRICE_IN_CENTS,
      billingPeriod: TEST_PLAN.BILLING_PERIOD,
      checkoutEmail: TEST_CHECKOUT_EMAIL,
      planName: TEST_PLAN.NAME,
    });
  });

  it("KAN-25: rejects an expired, unused link with LINK_EXPIRED (AC-KAN-25-20)", async () => {
    await seedCheckout({
      linkState: SIGN_UP_LINK_STATE.EXPIRED,
      signUpToken: "expired-token",
    });

    const httpsError = await captureHttpsError(
      callValidateSignUpLink(
        buildCallableRequest({ signUpToken: "expired-token" }),
      ),
    );

    expect(httpsError.code).toBe("failed-precondition");
    expect(readErrorReason(httpsError)).toBe(SIGN_UP_ERROR_REASON.LINK_EXPIRED);
  });

  it("KAN-25: rejects a used link with LINK_INVALID (AC-KAN-25-20)", async () => {
    await seedCheckout({
      linkState: SIGN_UP_LINK_STATE.USED,
      signUpToken: "used-token",
    });

    const httpsError = await captureHttpsError(
      callValidateSignUpLink(
        buildCallableRequest({ signUpToken: "used-token" }),
      ),
    );

    expect(httpsError.code).toBe("failed-precondition");
    expect(readErrorReason(httpsError)).toBe(SIGN_UP_ERROR_REASON.LINK_INVALID);
  });

  it("KAN-25: rejects an unknown token with LINK_INVALID (AC-KAN-25-20)", async () => {
    const httpsError = await captureHttpsError(
      callValidateSignUpLink(
        buildCallableRequest({ signUpToken: "unknown-token" }),
      ),
    );

    expect(httpsError.code).toBe("failed-precondition");
    expect(readErrorReason(httpsError)).toBe(SIGN_UP_ERROR_REASON.LINK_INVALID);
  });

  it("KAN-25: rejects a request without a token as invalid-argument (AC-KAN-25-21)", async () => {
    const httpsError = await captureHttpsError(
      callValidateSignUpLink(buildCallableRequest({})),
    );

    expect(httpsError.code).toBe("invalid-argument");
  });
});
