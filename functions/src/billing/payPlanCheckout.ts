import { randomBytes } from "node:crypto";
import { Timestamp, type Transaction } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  PLAN_CHECKOUT_ERROR,
  PLAN_CHECKOUT_ERROR_REASON,
  SIMULATED_GATEWAY,
  TERMS_VERSION,
} from "./constants/PlanCheckout.constants.js";
import type {
  PayPlanCheckoutPayload,
  PayPlanCheckoutResponse,
} from "./models/PayPlanCheckout.mutation.js";
import {
  type PayablePlanDocument,
  payablePlanDocumentSchema,
  payPlanCheckoutPayloadSchema,
} from "./models/PayPlanCheckout.schema.js";
import type { PlanCheckoutDocument } from "./models/PlanCheckout.document.js";
import { assertRecaptcha, RECAPTCHA_SECRETS } from "../auth/assertRecaptcha.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { PLAN_STATUS } from "../shared/constants/PlanStatus.constants.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { readPayload } from "../shared/readPayload.js";

// The simulated gateway (SPEC AS-9, Q5): one test card is declined, every
// other valid card is approved. It returns only a reference; the card data
// never leaves this function.
const chargeSimulatedCard = (cardNumber: string): string => {
  if (cardNumber === SIMULATED_GATEWAY.DECLINED_CARD_NUMBER) {
    throw new HttpsError(
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
    throw new HttpsError(
      "failed-precondition",
      PLAN_CHECKOUT_ERROR.PLAN_UNAVAILABLE,
      { reason: PLAN_CHECKOUT_ERROR_REASON.PLAN_UNAVAILABLE },
    );
  }
  const plan = planParsed.data;
  if (plan.priceInCents !== checkoutPayload.expectedPriceInCents) {
    throw new HttpsError(
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
  transaction: Transaction,
  checkoutPayload: PayPlanCheckoutPayload,
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
      throw new HttpsError(
        "failed-precondition",
        PLAN_CHECKOUT_ERROR.ATTEMPT_REUSED,
        { reason: PLAN_CHECKOUT_ERROR_REASON.ATTEMPT_REUSED },
      );
    }
    return paidCheckout.email;
  }

  const plan = await readPayablePlan(transaction, checkoutPayload);
  const paymentReference = chargeSimulatedCard(checkoutPayload.cardNumber);
  const paidAt = Timestamp.now();
  const planCheckout: PlanCheckoutDocument = {
    amountInCents: plan.priceInCents,
    email: checkoutPayload.email,
    language: checkoutPayload.language,
    paidAt,
    paymentReference,
    planId: checkoutPayload.planId,
    signUpCompletedAt: null,
    signUpLinkExpiresAt: null,
    signUpTokenHash: null,
    termsAcceptedAt: paidAt,
    termsVersion: TERMS_VERSION.PROVISIONAL,
  };
  transaction.create(checkoutReference, planCheckout);
  return planCheckout.email;
};

// Pays a plan through the simulated gateway and stores the PlanCheckout that
// the KAN-24 email and the KAN-25 sign-up start from (KAN-22 spec §3). Public:
// the visitor has no account yet. No User, Business or Payment is created here.
export const payPlanCheckout = onCall<
  PayPlanCheckoutPayload,
  Promise<PayPlanCheckoutResponse>
>({ secrets: RECAPTCHA_SECRETS }, async (request) => {
  const checkoutPayload = readPayload(
    payPlanCheckoutPayloadSchema,
    request.data,
    PLAN_CHECKOUT_ERROR.INVALID_PAYLOAD,
  );
  // Before anything is read or charged (AC-KAN-22-06).
  await assertRecaptcha(checkoutPayload.recaptchaToken);

  const email = await firestore.runTransaction((transaction) =>
    storePaidCheckout(transaction, checkoutPayload),
  );
  return { email };
});
