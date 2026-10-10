import {
  Timestamp,
  type DocumentReference,
  type Transaction,
} from "firebase-admin/firestore";
import { HttpsError } from "firebase-functions/v2/https";
import {
  PLAN_CHECKOUT_FIELD,
  SIGN_UP_ERROR,
  SIGN_UP_ERROR_REASON,
} from "./constants/SubscriberSignUp.constants.js";
import type { PlanCheckoutDocument } from "./models/PlanCheckout.document.js";
import { hashSignUpToken } from "./signUpToken.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { firestore } from "../shared/firebaseAdmin.js";

export interface SignUpCheckout {
  readonly planCheckout: PlanCheckoutDocument;
  readonly planCheckoutReference: DocumentReference;
}

// Finds the PlanCheckout of a sign-up link by the hash of its token and
// rejects an unknown, used or expired link (SPEC "Server functions"). Given a
// transaction, the read is part of it, so two sign-ups can never use the same
// link.
export const findSignUpCheckout = async (
  signUpToken: string,
  transaction?: Transaction,
): Promise<SignUpCheckout> => {
  const checkoutQuery = firestore
    .collection(FIRESTORE_COLLECTION.PLAN_CHECKOUTS)
    .where(
      PLAN_CHECKOUT_FIELD.SIGN_UP_TOKEN_HASH,
      "==",
      hashSignUpToken(signUpToken),
    )
    .limit(1);
  const querySnapshot = transaction
    ? await transaction.get(checkoutQuery)
    : await checkoutQuery.get();
  const checkoutSnapshot = querySnapshot.docs[0];

  if (!checkoutSnapshot) {
    throw new HttpsError("failed-precondition", SIGN_UP_ERROR.LINK_INVALID, {
      reason: SIGN_UP_ERROR_REASON.LINK_INVALID,
    });
  }
  const planCheckout = checkoutSnapshot.data() as PlanCheckoutDocument;

  // A used link is invalid even when it has also expired: only an unused,
  // expired link offers a new one (AC-KAN-25-20).
  if (planCheckout.signUpCompletedAt) {
    throw new HttpsError("failed-precondition", SIGN_UP_ERROR.LINK_INVALID, {
      reason: SIGN_UP_ERROR_REASON.LINK_INVALID,
    });
  }
  if (
    planCheckout.signUpLinkExpiresAt.toMillis() <= Timestamp.now().toMillis()
  ) {
    throw new HttpsError("failed-precondition", SIGN_UP_ERROR.LINK_EXPIRED, {
      reason: SIGN_UP_ERROR_REASON.LINK_EXPIRED,
    });
  }
  return { planCheckout, planCheckoutReference: checkoutSnapshot.ref };
};
