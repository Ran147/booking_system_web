import { onCall } from "firebase-functions/v2/https";
import { SIGN_UP_ERROR } from "./constants/SubscriberSignUp.constants.js";
import { findSignUpCheckout } from "./findSignUpCheckout.js";
import type { PlanDocument } from "./models/Plan.document.js";
import { validateSignUpLinkPayloadSchema } from "./models/SubscriberSignUp.schema.js";
import type {
  ValidateSignUpLinkPayload,
  ValidateSignUpLinkResponse,
} from "./models/ValidateSignUpLink.mutation.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { readPayload } from "../shared/readPayload.js";

// Opened by the sign-up page with the token of the KAN-24 link: answers the
// checkout email and the plan paid for, or why the link cannot be used
// (AC-KAN-25-14, AC-KAN-25-20). Public: the token is the credential.
export const validateSignUpLink = onCall<
  ValidateSignUpLinkPayload,
  Promise<ValidateSignUpLinkResponse>
>(async (request) => {
  const { signUpToken } = readPayload(
    validateSignUpLinkPayloadSchema,
    request.data,
    SIGN_UP_ERROR.INVALID_PAYLOAD,
  );
  const { planCheckout } = await findSignUpCheckout(signUpToken);

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
});
