import { Timestamp } from "firebase-admin/firestore";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { firestore } from "../../shared/firebaseAdmin.js";
import type { CompleteSubscriberSignUpPayload } from "../models/CompleteSubscriberSignUp.mutation.js";
import { hashSignUpToken } from "../signUpToken.js";

// Test data for the sign-up functions: one plan and checkouts whose link is
// valid, expired or already used.

export const TEST_PLAN = {
  BILLING_PERIOD: "monthly",
  ID: "test-plan-basic",
  NAME: "Básico",
  PRICE_IN_CENTS: 29_900,
} as const;

export const TEST_CHECKOUT_EMAIL = "owner@example.com";

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1_000;

export const SIGN_UP_LINK_STATE = {
  EXPIRED: "expired",
  USED: "used",
  VALID: "valid",
} as const;

type SignUpLinkState =
  (typeof SIGN_UP_LINK_STATE)[keyof typeof SIGN_UP_LINK_STATE];

interface SeedCheckoutOptions {
  readonly email?: string;
  readonly linkState?: SignUpLinkState;
  readonly signUpToken: string;
}

export const seedPlan = async (): Promise<void> => {
  await firestore.collection(FIRESTORE_COLLECTION.PLANS).doc(TEST_PLAN.ID).set({
    billingPeriod: TEST_PLAN.BILLING_PERIOD,
    name: TEST_PLAN.NAME,
    priceInCents: TEST_PLAN.PRICE_IN_CENTS,
  });
};

// Returns the planCheckoutId.
export const seedCheckout = async ({
  email = TEST_CHECKOUT_EMAIL,
  linkState = SIGN_UP_LINK_STATE.VALID,
  signUpToken,
}: SeedCheckoutOptions): Promise<string> => {
  const now = Date.now();
  const checkoutReference = firestore
    .collection(FIRESTORE_COLLECTION.PLAN_CHECKOUTS)
    .doc();
  await checkoutReference.set({
    amountInCents: TEST_PLAN.PRICE_IN_CENTS,
    email,
    paidAt: Timestamp.fromMillis(now - DAY_IN_MILLISECONDS),
    paymentReference: "sim-test-0001",
    planId: TEST_PLAN.ID,
    signUpCompletedAt:
      linkState === SIGN_UP_LINK_STATE.USED ? Timestamp.fromMillis(now) : null,
    signUpLinkExpiresAt: Timestamp.fromMillis(
      linkState === SIGN_UP_LINK_STATE.EXPIRED
        ? now - DAY_IN_MILLISECONDS
        : now + DAY_IN_MILLISECONDS,
    ),
    signUpTokenHash: hashSignUpToken(signUpToken),
  });
  return checkoutReference.id;
};

export const buildSignUpPayload = (
  overrides: Partial<CompleteSubscriberSignUpPayload> = {},
): CompleteSubscriberSignUpPayload => ({
  businessName: "Peluquería Doña Ana",
  businessSlug: "peluqueria-dona-ana",
  firstName: "Ana",
  language: "es",
  lastName: "Pérez",
  password: "Segura!2026",
  phone: "",
  signUpToken: "valid-token",
  timeZone: "America/Mexico_City",
  ...overrides,
});
