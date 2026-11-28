import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import type { CallableHandlerInput } from "../../shared/models/CallableHandler.model.js";
import { parseCallablePayload } from "../../shared/parseCallablePayload.js";
import { SIGN_UP_ERROR } from "../constants/SubscriberSignUp.constants.js";
import { findSignUpCheckout } from "../findSignUpCheckout.js";
import type { PlanDocument } from "../models/Plan.document.js";
import { validateSignUpLinkPayloadSchema } from "../models/SubscriberSignUp.schema.js";
import type { ValidateSignUpLinkResponse } from "../models/ValidateSignUpLink.mutation.js";

// Opened by the sign-up page with the token of the KAN-24 link: answers the
// checkout email and the plan paid for, or why the link cannot be used
// (AC-KAN-25-14, AC-KAN-25-20). Public: the token is the credential. Shared by
// the callable and the Vercel dispatcher (Q8).
export const handleValidateSignUpLink = async ({
  firestore,
  now,
  payload,
}: CallableHandlerInput): Promise<ValidateSignUpLinkResponse> => {
  const { signUpToken } = parseCallablePayload(
    validateSignUpLinkPayloadSchema,
    payload,
    SIGN_UP_ERROR.INVALID_PAYLOAD,
  );
  const { planCheckout } = await findSignUpCheckout({
    firestore,
    now,
    signUpToken,
  });

  const planSnapshot = await firestore
    .collection(FIRESTORE_COLLECTION.PLANS)
    .doc(planCheckout.planId)
    .get();
  if (!planSnapshot.exists) {
    // Data error, not a visitor error: reaches the client as `internal`.
    throw new Error(SIGN_UP_ERROR.PLAN_NOT_FOUND);
  }
  const plan = planSnapshot.data() as PlanDocument;

  return {
    amountInCents: planCheckout.amountInCents,
    billingPeriod: plan.billingPeriod,
    checkoutEmail: planCheckout.email,
    planName: plan.name,
  };
};
