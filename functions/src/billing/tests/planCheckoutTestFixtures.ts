import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { PLAN_STATUS } from "../../shared/constants/PlanStatus.constants.js";
import { firestore } from "../../shared/firebaseAdmin.js";
import type { PayPlanCheckoutPayload } from "../models/PayPlanCheckout.mutation.js";

// Test data for payPlanCheckout: one plan and a valid checkout payload.

export const CHECKOUT_TEST_PLAN = {
  ID: "test-plan-pro",
  PRICE_IN_CENTS: 49_900,
} as const;

export const CHECKOUT_TEST_ATTEMPT_ID = "6f1c2a4e-8b3d-4f5a-9c7e-1d2b3a4c5e6f";

export const APPROVED_CARD_NUMBER = "4242 4242 4242 4242";

interface SeedCheckoutPlanOptions {
  readonly priceInCents?: number;
  readonly status?: string;
}

export const seedCheckoutPlan = async ({
  priceInCents = CHECKOUT_TEST_PLAN.PRICE_IN_CENTS,
  status = PLAN_STATUS.ACTIVE,
}: SeedCheckoutPlanOptions = {}): Promise<void> => {
  await firestore
    .collection(FIRESTORE_COLLECTION.PLANS)
    .doc(CHECKOUT_TEST_PLAN.ID)
    .set({
      billingPeriod: "monthly",
      name: "Pro",
      priceInCents,
      status,
    });
};

export const buildCheckoutPayload = (
  overrides: Partial<PayPlanCheckoutPayload> = {},
): PayPlanCheckoutPayload => ({
  attemptId: CHECKOUT_TEST_ATTEMPT_ID,
  cardCvc: "123",
  cardExpiry: "12/40",
  cardNumber: APPROVED_CARD_NUMBER,
  cardholderName: "Ana Pérez",
  email: "owner@example.com",
  expectedPriceInCents: CHECKOUT_TEST_PLAN.PRICE_IN_CENTS,
  language: "es",
  planId: CHECKOUT_TEST_PLAN.ID,
  recaptchaToken: "recaptcha-token",
  termsAccepted: true,
  ...overrides,
});
