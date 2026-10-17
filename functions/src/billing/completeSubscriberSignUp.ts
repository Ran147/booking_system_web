import {
  type DocumentReference,
  FieldValue,
  type Transaction,
} from "firebase-admin/firestore";
import { logger } from "firebase-functions";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  PAYMENT_RESULT,
  SIGN_UP_CLAIMS_ATTEMPTS,
  SIGN_UP_ERROR,
  SIGN_UP_ERROR_REASON,
} from "./constants/SubscriberSignUp.constants.js";
import { findSignUpCheckout } from "./findSignUpCheckout.js";
import type {
  CompleteSubscriberSignUpPayload,
  CompleteSubscriberSignUpResponse,
} from "./models/CompleteSubscriberSignUp.mutation.js";
import { completeSubscriberSignUpPayloadSchema } from "./models/SubscriberSignUp.schema.js";
import { assertRecaptcha, RECAPTCHA_SECRETS } from "../auth/assertRecaptcha.js";
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

// Paths of the documents one sign-up stores, so they can be undone.
interface SignUpDocuments {
  readonly businessId: string;
  readonly paymentId: string;
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
): Promise<SignUpDocuments> => {
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
  const paymentReference = businessReference
    .collection(FIRESTORE_COLLECTION.PAYMENTS)
    .doc();
  transaction.create(paymentReference, {
    amountInCents: planCheckout.amountInCents,
    createdAt: planCheckout.paidAt,
    paymentReference: planCheckout.paymentReference ?? null,
    planId: planCheckout.planId,
    refundedAt: null,
    result: PAYMENT_RESULT.SUCCEEDED,
  });
  transaction.update(planCheckoutReference, { signUpCompletedAt: createdAt });

  return { businessId: businessReference.id, paymentId: paymentReference.id };
};

// Deletes the new Auth user. A failure here is logged and not thrown, so the
// caller re-throws the error that started the rollback.
const deleteAccount = async (userId: string): Promise<void> => {
  try {
    await auth.deleteUser(userId);
  } catch (error) {
    logger.error(SIGN_UP_ERROR.ACCOUNT_NOT_DELETED, { error, userId });
  }
};

// Undoes a stored sign-up: the documents, the slug lock and the used mark of
// the link, then the Auth user, so the visitor can sign up again with the
// same link (AC-KAN-25-22). Failures are logged, never thrown.
const undoSignUp = async (
  planCheckoutReference: DocumentReference,
  signUpPayload: CompleteSubscriberSignUpPayload,
  signUpAccount: SignUpAccount,
  signUpDocuments: SignUpDocuments,
): Promise<void> => {
  const businessReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(signUpDocuments.businessId);
  const batch = firestore.batch();
  batch.delete(
    businessReference
      .collection(FIRESTORE_COLLECTION.PAYMENTS)
      .doc(signUpDocuments.paymentId),
  );
  batch.delete(businessReference);
  batch.delete(
    firestore.collection(FIRESTORE_COLLECTION.USERS).doc(signUpAccount.userId),
  );
  batch.delete(
    firestore
      .collection(FIRESTORE_COLLECTION.BUSINESS_SLUGS)
      .doc(signUpPayload.businessSlug),
  );
  batch.update(planCheckoutReference, { signUpCompletedAt: null });
  try {
    await batch.commit();
  } catch (error) {
    logger.error(SIGN_UP_ERROR.SIGN_UP_NOT_UNDONE, {
      ...signUpDocuments,
      error,
      userId: signUpAccount.userId,
    });
  }
  await deleteAccount(signUpAccount.userId);
};

// Sets the subscriber claims, trying again a few times: a transient Auth
// failure must not leave an account that cannot open its portal.
const setSubscriberClaims = async (
  userId: string,
  businessId: string,
): Promise<void> => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      await auth.setCustomUserClaims(userId, {
        businessId,
        role: USER_ROLE.SUBSCRIBER,
      });
      return;
    } catch (error) {
      logger.warn(SIGN_UP_ERROR.CLAIMS_NOT_SET, {
        attempt,
        businessId,
        error,
        userId,
      });
      if (attempt >= SIGN_UP_CLAIMS_ATTEMPTS) {
        throw error;
      }
    }
  }
};

// Creates the subscriber's account and their pending business from a paid
// checkout (KAN-25, SPEC "Order and rollback"). Public: the sign-up link token
// is the credential.
export const completeSubscriberSignUp = onCall<
  CompleteSubscriberSignUpPayload,
  Promise<CompleteSubscriberSignUpResponse>
>({ secrets: RECAPTCHA_SECRETS }, async (request) => {
  const signUpPayload = readPayload(
    completeSubscriberSignUpPayloadSchema,
    request.data,
    SIGN_UP_ERROR.INVALID_PAYLOAD,
  );
  // Before anything is read or created: a rejected token leaves the link
  // unused (AC-KAN-25-08).
  await assertRecaptcha(signUpPayload.recaptchaToken);

  if (isReservedBusinessSlug(signUpPayload.businessSlug)) {
    throw new HttpsError("failed-precondition", SIGN_UP_ERROR.SLUG_RESERVED, {
      reason: SIGN_UP_ERROR_REASON.SLUG_RESERVED,
    });
  }
  const { planCheckout, planCheckoutReference } = await findSignUpCheckout(
    signUpPayload.signUpToken,
  );

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
  const signUpDocuments = await firestore
    .runTransaction((transaction) =>
      writeSignUpDocuments(transaction, signUpPayload, signUpAccount),
    )
    .catch(async (error: unknown) => {
      await deleteAccount(userId);
      throw error;
    });

  // Without claims the account cannot open its portal, so if they cannot be
  // set the whole sign-up is undone and the visitor can try again.
  try {
    await setSubscriberClaims(userId, signUpDocuments.businessId);
  } catch (error) {
    await undoSignUp(
      planCheckoutReference,
      signUpPayload,
      signUpAccount,
      signUpDocuments,
    );
    throw error;
  }

  return { email: planCheckout.email };
});
