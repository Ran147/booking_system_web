import type {
  DocumentReference,
  Firestore,
  Timestamp,
  Transaction,
} from "firebase-admin/firestore";
import {
  PLAN_CHECKOUT_FIELD,
  SIGN_UP_ERROR,
  SIGN_UP_ERROR_REASON,
} from "./constants/SubscriberSignUp.constants.js";
import type { PlanCheckoutDocument } from "./models/PlanCheckout.document.js";
import { hashSignUpToken } from "./signUpToken.js";
import { CallableFailure } from "../shared/CallableFailure.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";

export interface SignUpCheckout {
  readonly planCheckout: PlanCheckoutDocument;
  readonly planCheckoutReference: DocumentReference;
}

export interface FindSignUpCheckoutInput {
  readonly firestore: Firestore;
  readonly now: Date;
  readonly signUpToken: string;
  /** Given, the read is part of it, so two sign-ups never use the same link. */
  readonly transaction?: Transaction;
}

// Finds the PlanCheckout of a sign-up link by the hash of its token and
// rejects an unknown, used or expired link (SPEC "Server functions"). Shared
// by the sign-up handlers, so it stays free of firebase-functions (Q8).
export const findSignUpCheckout = async ({
  firestore,
  now,
  signUpToken,
  transaction,
}: FindSignUpCheckoutInput): Promise<SignUpCheckout> => {
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
    throw new CallableFailure(
      "failed-precondition",
      SIGN_UP_ERROR.LINK_INVALID,
      { reason: SIGN_UP_ERROR_REASON.LINK_INVALID },
    );
  }
  const planCheckout = checkoutSnapshot.data() as PlanCheckoutDocument;

  // A used link is invalid even when it has also expired: only an unused,
  // expired link offers a new one (AC-KAN-25-20). A checkout whose link was
  // never created (KAN-22 spec D1) is invalid too.
  if (planCheckout.signUpCompletedAt || !planCheckout.signUpLinkExpiresAt) {
    throw new CallableFailure(
      "failed-precondition",
      SIGN_UP_ERROR.LINK_INVALID,
      { reason: SIGN_UP_ERROR_REASON.LINK_INVALID },
    );
  }
  // Read from Firestore, so it is a Timestamp of whichever firebase-admin
  // copy runs the handler; only toMillis() is used.
  const linkExpiresAt: Timestamp = planCheckout.signUpLinkExpiresAt;
  if (linkExpiresAt.toMillis() <= now.getTime()) {
    throw new CallableFailure(
      "failed-precondition",
      SIGN_UP_ERROR.LINK_EXPIRED,
      { reason: SIGN_UP_ERROR_REASON.LINK_EXPIRED },
    );
  }
  return { planCheckout, planCheckoutReference: checkoutSnapshot.ref };
};
