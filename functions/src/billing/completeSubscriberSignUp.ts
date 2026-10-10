import { FieldValue, type Transaction } from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  PAYMENT_RESULT,
  SIGN_UP_ERROR,
  SIGN_UP_ERROR_REASON,
} from "./constants/SubscriberSignUp.constants.js";
import { findSignUpCheckout } from "./findSignUpCheckout.js";
import type {
  CompleteSubscriberSignUpPayload,
  CompleteSubscriberSignUpResponse,
} from "./models/CompleteSubscriberSignUp.mutation.js";
import { completeSubscriberSignUpPayloadSchema } from "./models/SubscriberSignUp.schema.js";
import { BUSINESS_STATUS } from "../shared/constants/BusinessStatus.constants.js";
import { FIREBASE_AUTH_ERROR_CODE } from "../shared/constants/FirebaseAuthErrorCode.constants.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { STRING } from "../shared/constants/String.constants.js";
import { USER_ROLE } from "../shared/constants/UserRole.constants.js";
import { auth, firestore } from "../shared/firebaseAdmin.js";
import { hasErrorCode } from "../shared/hasErrorCode.js";
import { isReservedBusinessSlug } from "../shared/isReservedBusinessSlug.js";
import { readPayload } from "../shared/readPayload.js";

interface SignUpAccount {
  readonly email: string;
  readonly fullName: string;
  readonly userId: string;
}

// An existing email fails with a neutral reason (AS-5); the link stays valid.
const createAccount = async (
  email: string,
  password: string,
  fullName: string,
): Promise<string> => {
  try {
    const userRecord = await auth.createUser({
      displayName: fullName,
      email,
      password,
    });
    return userRecord.uid;
  } catch (error) {
    if (hasErrorCode(error, FIREBASE_AUTH_ERROR_CODE.EMAIL_ALREADY_EXISTS)) {
      throw new HttpsError("already-exists", SIGN_UP_ERROR.ACCOUNT_EXISTS, {
        reason: SIGN_UP_ERROR_REASON.ACCOUNT_EXISTS,
      });
    }
    throw error;
  }
};

// Everything Firestore stores for a sign-up, in one transaction
// (AC-KAN-25-16). The link and the slug are checked again here, so two
// concurrent sign-ups can never share a link or a slug (AC-KAN-25-18).
const writeSignUpDocuments = async (
  transaction: Transaction,
  signUpPayload: CompleteSubscriberSignUpPayload,
  signUpAccount: SignUpAccount,
): Promise<string> => {
  const { planCheckout, planCheckoutReference } = await findSignUpCheckout(
    signUpPayload.signUpToken,
    transaction,
  );
  const slugLockReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESS_SLUGS)
    .doc(signUpPayload.businessSlug);
  const slugLockSnapshot = await transaction.get(slugLockReference);
  if (slugLockSnapshot.exists) {
    throw new HttpsError("already-exists", SIGN_UP_ERROR.SLUG_TAKEN, {
      reason: SIGN_UP_ERROR_REASON.SLUG_TAKEN,
    });
  }

  const businessReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc();
  const createdAt = FieldValue.serverTimestamp();

  transaction.create(businessReference, {
    createdAt,
    name: signUpPayload.businessName,
    ownerUserId: signUpAccount.userId,
    planCheckoutId: planCheckoutReference.id,
    slug: signUpPayload.businessSlug,
    status: BUSINESS_STATUS.PENDING,
    timeZone: signUpPayload.timeZone,
  });
  transaction.create(
    firestore.collection(FIRESTORE_COLLECTION.USERS).doc(signUpAccount.userId),
    {
      createdAt,
      email: signUpAccount.email,
      fullName: signUpAccount.fullName,
      language: signUpPayload.language,
      phone: signUpPayload.phone === STRING.EMPTY ? null : signUpPayload.phone,
    },
  );
  transaction.create(slugLockReference, {
    businessId: businessReference.id,
    createdAt,
  });
  // The checkout payment appears in the business's payment history
  // (KAN-46, KAN-178).
  transaction.create(
    businessReference.collection(FIRESTORE_COLLECTION.PAYMENTS).doc(),
    {
      amountInCents: planCheckout.amountInCents,
      createdAt: planCheckout.paidAt,
      paymentReference: planCheckout.paymentReference ?? null,
      planId: planCheckout.planId,
      refundedAt: null,
      result: PAYMENT_RESULT.SUCCEEDED,
    },
  );
  transaction.update(planCheckoutReference, { signUpCompletedAt: createdAt });

  return businessReference.id;
};

// Creates the subscriber's account and their pending business from a paid
// checkout (KAN-25, SPEC "Order and rollback"). Public: the sign-up link token
// is the credential.
export const completeSubscriberSignUp = onCall<
  CompleteSubscriberSignUpPayload,
  Promise<CompleteSubscriberSignUpResponse>
>(async (request) => {
  const signUpPayload = readPayload(
    completeSubscriberSignUpPayloadSchema,
    request.data,
    SIGN_UP_ERROR.INVALID_PAYLOAD,
  );
  // reCAPTCHA (AC-KAN-25-08) is verified here with assertRecaptcha once US-33
  // (PR #8) is merged.

  if (isReservedBusinessSlug(signUpPayload.businessSlug)) {
    throw new HttpsError("failed-precondition", SIGN_UP_ERROR.SLUG_RESERVED, {
      reason: SIGN_UP_ERROR_REASON.SLUG_RESERVED,
    });
  }
  const { planCheckout } = await findSignUpCheckout(signUpPayload.signUpToken);

  const fullName = [signUpPayload.firstName, signUpPayload.lastName].join(
    STRING.SPACE,
  );
  const userId = await createAccount(
    planCheckout.email,
    signUpPayload.password,
    fullName,
  );
  const signUpAccount: SignUpAccount = {
    email: planCheckout.email,
    fullName,
    userId,
  };

  // Firebase Auth is outside the transaction: if the transaction fails, the
  // new Auth user is deleted, so no account is left without its business and
  // the link stays valid (AC-KAN-25-22).
  const businessId = await firestore
    .runTransaction((transaction) =>
      writeSignUpDocuments(transaction, signUpPayload, signUpAccount),
    )
    .catch(async (error: unknown) => {
      await auth.deleteUser(userId);
      throw error;
    });

  try {
    await auth.setCustomUserClaims(userId, {
      businessId,
      role: USER_ROLE.SUBSCRIBER,
    });
  } catch (error) {
    // The account and the business are stored; the claims can be set again
    // from them, so the sign-up is not undone.
    logger.error(SIGN_UP_ERROR.CLAIMS_NOT_SET, { businessId, error, userId });
  }

  return { email: planCheckout.email };
});
