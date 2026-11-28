import { randomBytes } from "node:crypto";
import type { Firestore, Transaction } from "firebase-admin/firestore";
import { CallableFailure } from "../../shared/CallableFailure.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { PLAN_STATUS } from "../../shared/constants/PlanStatus.constants.js";
import type { CallableHandlerInput } from "../../shared/models/CallableHandler.model.js";
import { parseCallablePayload } from "../../shared/parseCallablePayload.js";
import {
  PLAN_CHECKOUT_ERROR,
  PLAN_CHECKOUT_ERROR_REASON,
  SIMULATED_GATEWAY,
  TERMS_VERSION,
} from "../constants/PlanCheckout.constants.js";
import type {
  PayPlanCheckoutPayload,
  PayPlanCheckoutResponse,
} from "../models/PayPlanCheckout.mutation.js";
import {
  type PayablePlanDocument,
  payablePlanDocumentSchema,
  payPlanCheckoutPayloadSchema,
} from "../models/PayPlanCheckout.schema.js";
import type { PlanCheckoutDocument } from "../models/PlanCheckout.document.js";

/**
 * What handlePayPlanCheckout receives: the shared handler input plus the
 * reCAPTCHA check of the environment that runs it (Functions secret or the
 * Vercel environment variable). It throws when the token is not valid.
 */
export interface PayPlanCheckoutHandlerInput extends CallableHandlerInput {
  readonly assertRecaptcha: (recaptchaToken: string) => Promise<void>;
}

// Dates are written as `Date`, not as a Timestamp of this package: the Vercel
// dispatcher and the functions package may load different copies of
// firebase-admin (Q8). Firestore stores both the same way.
type PlanCheckoutWrite = Omit<
  PlanCheckoutDocument,
  "paidAt" | "termsAcceptedAt"
> & {
  readonly paidAt: Date;
  readonly termsAcceptedAt: Date;
};

// The simulated gateway (SPEC AS-9, Q5): one test card is declined, every
// other valid card is approved. It returns only a reference; the card data
// never leaves this handler.
const chargeSimulatedCard = (cardNumber: string): string => {
  if (cardNumber === SIMULATED_GATEWAY.DECLINED_CARD_NUMBER) {
    throw new CallableFailure(
      "failed-precondition",
      PLAN_CHECKOUT_ERROR.PAYMENT_DECLINED,
      { reason: PLAN_CHECKOUT_ERROR_REASON.PAYMENT_DECLINED },
    );
  }
  return (
    SIMULATED_GATEWAY.PAYMENT_REFERENCE_PREFIX +
    randomBytes(SIMULATED_GATEWAY.PAYMENT_REFERENCE_BYTE_LENGTH).toString(
      SIMULATED_GATEWAY.PAYMENT_REFERENCE_ENCODING,
    )
  );
};

// The plan must still be active and cost what the visitor saw
// (AC-KAN-22-07, AC-KAN-22-08).
const readPayablePlan = async (
  firestore: Firestore,
  transaction: Transaction,
  checkoutPayload: PayPlanCheckoutPayload,
): Promise<PayablePlanDocument> => {
  const planSnapshot = await transaction.get(
    firestore
      .collection(FIRESTORE_COLLECTION.PLANS)
      .doc(checkoutPayload.planId),
  );
  const planParsed = payablePlanDocumentSchema.safeParse(planSnapshot.data());

  if (!planParsed.success || planParsed.data.status !== PLAN_STATUS.ACTIVE) {
    throw new CallableFailure(
      "failed-precondition",
      PLAN_CHECKOUT_ERROR.PLAN_UNAVAILABLE,
      { reason: PLAN_CHECKOUT_ERROR_REASON.PLAN_UNAVAILABLE },
    );
  }
  const plan = planParsed.data;
  if (plan.priceInCents !== checkoutPayload.expectedPriceInCents) {
    throw new CallableFailure(
      "failed-precondition",
      PLAN_CHECKOUT_ERROR.PRICE_CHANGED,
      {
        currentPriceInCents: plan.priceInCents,
        reason: PLAN_CHECKOUT_ERROR_REASON.PRICE_CHANGED,
      },
    );
  }
  return plan;
};

// One PlanCheckout per attempt, stored under the attemptId (spec D3): a retry
// of an attempt that was already paid answers the stored checkout and charges
// nothing (AC-KAN-22-09); the same attemptId with another plan or email is not
// a retry and is rejected, so the visitor is never told a plan they did not
// pay for is paid. The simulated gateway has no side effects, so it can
// run inside the transaction; a real gateway would take the attemptId as its
// idempotency key.
const storePaidCheckout = async (
  firestore: Firestore,
  transaction: Transaction,
  checkoutPayload: PayPlanCheckoutPayload,
  now: Date,
): Promise<string> => {
  const checkoutReference = firestore
    .collection(FIRESTORE_COLLECTION.PLAN_CHECKOUTS)
    .doc(checkoutPayload.attemptId);
  const checkoutSnapshot = await transaction.get(checkoutReference);
  if (checkoutSnapshot.exists) {
    const paidCheckout = checkoutSnapshot.data() as PlanCheckoutDocument;
    if (
      paidCheckout.planId !== checkoutPayload.planId ||
      paidCheckout.email !== checkoutPayload.email
    ) {
      throw new CallableFailure(
        "failed-precondition",
        PLAN_CHECKOUT_ERROR.ATTEMPT_REUSED,
        { reason: PLAN_CHECKOUT_ERROR_REASON.ATTEMPT_REUSED },
      );
    }
    return paidCheckout.email;
  }

  const plan = await readPayablePlan(firestore, transaction, checkoutPayload);
  const paymentReference = chargeSimulatedCard(checkoutPayload.cardNumber);
  const planCheckout: PlanCheckoutWrite = {
    amountInCents: plan.priceInCents,
    email: checkoutPayload.email,
    language: checkoutPayload.language,
    paidAt: now,
    paymentReference,
    planId: checkoutPayload.planId,
    signUpCompletedAt: null,
    signUpLinkExpiresAt: null,
    signUpTokenHash: null,
    termsAcceptedAt: now,
    termsVersion: TERMS_VERSION.CURRENT,
  };
  transaction.create(checkoutReference, planCheckout);
  return planCheckout.email;
};

/**
 * Pays a plan through the simulated gateway and stores the PlanCheckout that
 * the KAN-24 email and the KAN-25 sign-up start from (KAN-22 spec §3). Public:
 * the visitor has no account yet, so `caller` is not read. No User, Business
 * or Payment is created here.
 *
 * Shared by the `payPlanCheckout` callable and the Vercel dispatcher (Q8).
 */
export const handlePayPlanCheckout = async ({
  assertRecaptcha,
  firestore,
  now,
  payload,
}: PayPlanCheckoutHandlerInput): Promise<PayPlanCheckoutResponse> => {
  const checkoutPayload = parseCallablePayload(
    payPlanCheckoutPayloadSchema,
    payload,
    PLAN_CHECKOUT_ERROR.INVALID_PAYLOAD,
  );
  // Before anything is read or charged (AC-KAN-22-06).
  await assertRecaptcha(checkoutPayload.recaptchaToken);

  const email = await firestore.runTransaction((transaction) =>
    storePaidCheckout(firestore, transaction, checkoutPayload, now),
  );
  return { email };
};
