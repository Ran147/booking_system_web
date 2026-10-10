import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  SIGN_UP_LINK_STATE,
  seedCheckout,
  seedPlan,
} from "./signUpTestFixtures.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { firestore } from "../../shared/firebaseAdmin.js";
import {
  assertEmulatorsRunning,
  buildCallableRequest,
  captureHttpsError,
  clearEmulators,
  functionsTestEnvironment,
  readErrorReason,
} from "../../shared/tests/emulatorTestHelpers.js";
import { checkBusinessSlug } from "../checkBusinessSlug.js";
import {
  BUSINESS_SLUG_AVAILABILITY,
  SIGN_UP_ERROR_REASON,
} from "../constants/SubscriberSignUp.constants.js";

const callCheckBusinessSlug = functionsTestEnvironment.wrap(checkBusinessSlug);

describe("checkBusinessSlug", () => {
  beforeAll(assertEmulatorsRunning);

  beforeEach(async () => {
    await clearEmulators();
    await seedPlan();
    await seedCheckout({ signUpToken: "valid-token" });
  });

  it("KAN-25: answers available for a free slug (AC-KAN-25-15)", async () => {
    const slugResponse = await callCheckBusinessSlug(
      buildCallableRequest({
        businessSlug: "peluqueria-dona-ana",
        signUpToken: "valid-token",
      }),
    );

    expect(slugResponse).toEqual({
      availability: BUSINESS_SLUG_AVAILABILITY.AVAILABLE,
    });
  });

  it("KAN-25: answers taken for a slug of another business (AC-KAN-25-18)", async () => {
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESS_SLUGS)
      .doc("estetica-luna")
      .set({ businessId: "other-business" });

    const slugResponse = await callCheckBusinessSlug(
      buildCallableRequest({
        businessSlug: "estetica-luna",
        signUpToken: "valid-token",
      }),
    );

    expect(slugResponse).toEqual({
      availability: BUSINESS_SLUG_AVAILABILITY.TAKEN,
    });
  });

  it("KAN-25: answers reserved for a static route segment (AC-KAN-25-17)", async () => {
    const slugResponse = await callCheckBusinessSlug(
      buildCallableRequest({
        businessSlug: "admin",
        signUpToken: "valid-token",
      }),
    );

    expect(slugResponse).toEqual({
      availability: BUSINESS_SLUG_AVAILABILITY.RESERVED,
    });
  });

  it("KAN-25: rejects a slug outside the format as invalid-argument (AC-KAN-25-19)", async () => {
    const httpsError = await captureHttpsError(
      callCheckBusinessSlug(
        buildCallableRequest({
          businessSlug: "-mal-",
          signUpToken: "valid-token",
        }),
      ),
    );

    expect(httpsError.code).toBe("invalid-argument");
  });

  it("KAN-25: refuses to answer without a valid sign-up link (SPEC Server functions)", async () => {
    await seedCheckout({
      linkState: SIGN_UP_LINK_STATE.USED,
      signUpToken: "used-token",
    });

    const httpsError = await captureHttpsError(
      callCheckBusinessSlug(
        buildCallableRequest({
          businessSlug: "peluqueria-dona-ana",
          signUpToken: "used-token",
        }),
      ),
    );

    expect(httpsError.code).toBe("failed-precondition");
    expect(readErrorReason(httpsError)).toBe(SIGN_UP_ERROR_REASON.LINK_INVALID);
  });
});
