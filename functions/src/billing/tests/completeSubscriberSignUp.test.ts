import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  SIGN_UP_LINK_STATE,
  TEST_CHECKOUT_EMAIL,
  TEST_PLAN,
  buildSignUpPayload,
  seedCheckout,
  seedPlan,
} from "./signUpTestFixtures.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { auth, firestore } from "../../shared/firebaseAdmin.js";
import {
  assertEmulatorsRunning,
  buildCallableRequest,
  captureHttpsError,
  clearEmulators,
  functionsTestEnvironment,
  readErrorReason,
} from "../../shared/tests/emulatorTestHelpers.js";
import { completeSubscriberSignUp } from "../completeSubscriberSignUp.js";
import { SIGN_UP_ERROR_REASON } from "../constants/SubscriberSignUp.constants.js";

const PROMISE_SETTLED_STATUS = {
  FULFILLED: "fulfilled",
  REJECTED: "rejected",
} as const;

const callCompleteSubscriberSignUp = functionsTestEnvironment.wrap(
  completeSubscriberSignUp,
);

const countAuthUsers = async (): Promise<number> =>
  (await auth.listUsers()).users.length;

const countDocuments = async (collectionName: string): Promise<number> =>
  (await firestore.collection(collectionName).get()).size;

describe("completeSubscriberSignUp", () => {
  let planCheckoutId: string;

  beforeAll(assertEmulatorsRunning);

  beforeEach(async () => {
    await clearEmulators();
    await seedPlan();
    planCheckoutId = await seedCheckout({ signUpToken: "valid-token" });
  });

  it("KAN-25: creates the account, the pending business, the payment and the claims in one call (AC-KAN-25-16)", async () => {
    const signUpResponse = await callCompleteSubscriberSignUp(
      buildCallableRequest(buildSignUpPayload({ phone: "+52 55 1234 5678" })),
    );

    expect(signUpResponse).toEqual({ email: TEST_CHECKOUT_EMAIL });

    const userRecord = await auth.getUserByEmail(TEST_CHECKOUT_EMAIL);
    const businessSnapshot = (
      await firestore
        .collection(FIRESTORE_COLLECTION.BUSINESSES)
        .where("ownerUserId", "==", userRecord.uid)
        .get()
    ).docs[0];
    expect(businessSnapshot?.data()).toMatchObject({
      name: "Peluquería Doña Ana",
      planCheckoutId,
      slug: "peluqueria-dona-ana",
      status: "pending",
      timeZone: "America/Mexico_City",
    });
    expect(userRecord.customClaims).toEqual({
      businessId: businessSnapshot?.id,
      role: "subscriber",
    });

    const userSnapshot = await firestore
      .collection(FIRESTORE_COLLECTION.USERS)
      .doc(userRecord.uid)
      .get();
    expect(userSnapshot.data()).toMatchObject({
      email: TEST_CHECKOUT_EMAIL,
      fullName: "Ana Pérez",
      language: "es",
      phone: "+52 55 1234 5678",
    });

    const paymentsSnapshot = await businessSnapshot!.ref
      .collection(FIRESTORE_COLLECTION.PAYMENTS)
      .get();
    expect(paymentsSnapshot.docs[0]?.data()).toMatchObject({
      amountInCents: TEST_PLAN.PRICE_IN_CENTS,
      planId: TEST_PLAN.ID,
      result: "succeeded",
    });

    const slugLockSnapshot = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESS_SLUGS)
      .doc("peluqueria-dona-ana")
      .get();
    expect(slugLockSnapshot.data()).toMatchObject({
      businessId: businessSnapshot?.id,
    });
  });

  it("KAN-25: uses up the link, so a second sign-up with it fails (AC-KAN-25-16)", async () => {
    await callCompleteSubscriberSignUp(
      buildCallableRequest(buildSignUpPayload()),
    );

    const checkoutSnapshot = await firestore
      .collection(FIRESTORE_COLLECTION.PLAN_CHECKOUTS)
      .doc(planCheckoutId)
      .get();
    expect(checkoutSnapshot.data()?.signUpCompletedAt).toBeTruthy();

    const httpsError = await captureHttpsError(
      callCompleteSubscriberSignUp(
        buildCallableRequest(
          buildSignUpPayload({ businessSlug: "otro-negocio" }),
        ),
      ),
    );
    expect(httpsError.code).toBe("failed-precondition");
    expect(readErrorReason(httpsError)).toBe(SIGN_UP_ERROR_REASON.LINK_INVALID);
  });

  it("KAN-25: stores an empty phone as null (AS-1)", async () => {
    await callCompleteSubscriberSignUp(
      buildCallableRequest(buildSignUpPayload()),
    );

    const userRecord = await auth.getUserByEmail(TEST_CHECKOUT_EMAIL);
    const userSnapshot = await firestore
      .collection(FIRESTORE_COLLECTION.USERS)
      .doc(userRecord.uid)
      .get();
    expect(userSnapshot.data()?.phone).toBeNull();
  });

  it("KAN-25: fails with ACCOUNT_EXISTS when the email has an account and keeps the link valid (AC-KAN-25-09)", async () => {
    await auth.createUser({
      email: TEST_CHECKOUT_EMAIL,
      password: "Otra!2026x",
    });

    const httpsError = await captureHttpsError(
      callCompleteSubscriberSignUp(buildCallableRequest(buildSignUpPayload())),
    );

    expect(httpsError.code).toBe("already-exists");
    expect(readErrorReason(httpsError)).toBe(
      SIGN_UP_ERROR_REASON.ACCOUNT_EXISTS,
    );
    expect(await countDocuments(FIRESTORE_COLLECTION.BUSINESSES)).toBe(0);
    const checkoutSnapshot = await firestore
      .collection(FIRESTORE_COLLECTION.PLAN_CHECKOUTS)
      .doc(planCheckoutId)
      .get();
    expect(checkoutSnapshot.data()?.signUpCompletedAt).toBeNull();
  });

  it("KAN-25: fails with SLUG_TAKEN and deletes the new Auth user when the slug is taken (AC-KAN-25-18, AC-KAN-25-22)", async () => {
    await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESS_SLUGS)
      .doc("peluqueria-dona-ana")
      .set({ businessId: "other-business" });

    const httpsError = await captureHttpsError(
      callCompleteSubscriberSignUp(buildCallableRequest(buildSignUpPayload())),
    );

    expect(httpsError.code).toBe("already-exists");
    expect(readErrorReason(httpsError)).toBe(SIGN_UP_ERROR_REASON.SLUG_TAKEN);
    expect(await countAuthUsers()).toBe(0);
    expect(await countDocuments(FIRESTORE_COLLECTION.BUSINESSES)).toBe(0);
    expect(await countDocuments(FIRESTORE_COLLECTION.USERS)).toBe(0);
  });

  it("KAN-25: gives the slug to only one of two sign-ups that race for it (AC-KAN-25-18)", async () => {
    await seedCheckout({
      email: "second-owner@example.com",
      signUpToken: "second-token",
    });

    const signUpResults = await Promise.allSettled([
      callCompleteSubscriberSignUp(buildCallableRequest(buildSignUpPayload())),
      callCompleteSubscriberSignUp(
        buildCallableRequest(
          buildSignUpPayload({ signUpToken: "second-token" }),
        ),
      ),
    ]);

    const fulfilledResults = signUpResults.filter(
      (signUpResult) =>
        signUpResult.status === PROMISE_SETTLED_STATUS.FULFILLED,
    );
    const rejectedResults = signUpResults.filter(
      (signUpResult) => signUpResult.status === PROMISE_SETTLED_STATUS.REJECTED,
    );
    expect(fulfilledResults).toHaveLength(1);
    expect(rejectedResults).toHaveLength(1);
    expect(await countDocuments(FIRESTORE_COLLECTION.BUSINESSES)).toBe(1);
    expect(await countAuthUsers()).toBe(1);
  });

  it("KAN-25: rejects a reserved slug with SLUG_RESERVED and creates nothing (AC-KAN-25-17)", async () => {
    const httpsError = await captureHttpsError(
      callCompleteSubscriberSignUp(
        buildCallableRequest(buildSignUpPayload({ businessSlug: "sign-in" })),
      ),
    );

    expect(httpsError.code).toBe("failed-precondition");
    expect(readErrorReason(httpsError)).toBe(
      SIGN_UP_ERROR_REASON.SLUG_RESERVED,
    );
    expect(await countAuthUsers()).toBe(0);
  });

  it("KAN-25: rejects an expired link with LINK_EXPIRED and creates nothing (AC-KAN-25-20)", async () => {
    await seedCheckout({
      email: "late-owner@example.com",
      linkState: SIGN_UP_LINK_STATE.EXPIRED,
      signUpToken: "expired-token",
    });

    const httpsError = await captureHttpsError(
      callCompleteSubscriberSignUp(
        buildCallableRequest(
          buildSignUpPayload({ signUpToken: "expired-token" }),
        ),
      ),
    );

    expect(httpsError.code).toBe("failed-precondition");
    expect(readErrorReason(httpsError)).toBe(SIGN_UP_ERROR_REASON.LINK_EXPIRED);
    expect(await countAuthUsers()).toBe(0);
  });

  it.each([
    ["a weak password (AC-KAN-25-06)", { password: "debil" }],
    ["a too short name (AC-KAN-25-11)", { firstName: "A" }],
    ["a phone with letters (AC-KAN-25-11)", { phone: "telefono" }],
    [
      "a slug outside the format (AC-KAN-25-19)",
      { businessSlug: "Mi Negocio" },
    ],
    [
      "a too long business name (AC-KAN-25-19)",
      { businessName: "N".repeat(81) },
    ],
    ["an unknown time zone (AS-8)", { timeZone: "Mars/Olympus" }],
  ])(
    "KAN-25: rejects %s as invalid-argument and creates nothing",
    async (_caseName, payloadOverrides) => {
      const httpsError = await captureHttpsError(
        callCompleteSubscriberSignUp(
          buildCallableRequest(buildSignUpPayload(payloadOverrides)),
        ),
      );

      expect(httpsError.code).toBe("invalid-argument");
      expect(await countAuthUsers()).toBe(0);
    },
  );
});
