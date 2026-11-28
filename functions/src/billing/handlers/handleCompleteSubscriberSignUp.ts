import type { Auth } from "firebase-admin/auth";
import type {
  DocumentReference,
  Firestore,
  Transaction,
} from "firebase-admin/firestore";
import { CallableFailure } from "../../shared/CallableFailure.js";
import { BUSINESS_STATUS } from "../../shared/constants/BusinessStatus.constants.js";
import { COLLABORATOR_PERMISSION } from "../../shared/constants/CollaboratorPermission.constants.js";
import { COLLABORATOR_STATUS } from "../../shared/constants/CollaboratorStatus.constants.js";
import { FIREBASE_AUTH_ERROR_CODE } from "../../shared/constants/FirebaseAuthErrorCode.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { STRING } from "../../shared/constants/String.constants.js";
import { USER_ROLE } from "../../shared/constants/UserRole.constants.js";
import { hasErrorCode } from "../../shared/hasErrorCode.js";
import { isReservedBusinessSlug } from "../../shared/isReservedBusinessSlug.js";
import type { CallableHandlerInput } from "../../shared/models/CallableHandler.model.js";
import { parseCallablePayload } from "../../shared/parseCallablePayload.js";
import { wait } from "../../shared/wait.js";
import {
  PAYMENT_RESULT,
  SIGN_UP_CLAIMS_ATTEMPTS,
  SIGN_UP_CLAIMS_RETRY_DELAY_MILLISECONDS,
  SIGN_UP_CLAIMS_RETRY_DELAY_MULTIPLIER,
  SIGN_UP_ERROR,
  SIGN_UP_ERROR_REASON,
} from "../constants/SubscriberSignUp.constants.js";
import { findSignUpCheckout } from "../findSignUpCheckout.js";
import type {
  CompleteSubscriberSignUpPayload,
  CompleteSubscriberSignUpResponse,
} from "../models/CompleteSubscriberSignUp.mutation.js";
import { completeSubscriberSignUpPayloadSchema } from "../models/SubscriberSignUp.schema.js";

/**
 * Records a failure that is handled and not thrown (claims retried, an Auth
 * user or a sign-up that could not be undone). The callable passes the
 * firebase-functions logger and the Vercel dispatcher console.error (Q8).
 */
export type ReportSignUpError = (
  message: string,
  context: Readonly<Record<string, unknown>>,
) => void;

/**
 * The shared handler input plus what only the sign-up needs: the Auth
 * instance, the reCAPTCHA check of the environment that runs it, and where
 * handled failures are recorded.
 */
export interface CompleteSubscriberSignUpInput extends CallableHandlerInput {
  readonly assertRecaptcha: (recaptchaToken: string) => Promise<void>;
  readonly auth: Auth;
  readonly reportError: ReportSignUpError;
}

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

interface SignUpContext {
  readonly auth: Auth;
  readonly firestore: Firestore;
  readonly now: Date;
  readonly reportError: ReportSignUpError;
}

// An existing email fails with a neutral reason (AS-5); the link stays valid.
const createAccount = async (
  auth: Auth,
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
      throw new CallableFailure(
        "already-exists",
        SIGN_UP_ERROR.ACCOUNT_EXISTS,
        {
          reason: SIGN_UP_ERROR_REASON.ACCOUNT_EXISTS,
        },
      );
    }
    throw error;
  }
};

// Everything Firestore stores for a sign-up, in one transaction
// (AC-KAN-25-16). The link and the slug are checked again here, so two
// concurrent sign-ups can never share a link or a slug (AC-KAN-25-18). Dates
// are written as `Date`, never as a Timestamp or FieldValue of this package:
// the Vercel dispatcher may load another copy of firebase-admin (Q8).
const writeSignUpDocuments = async (
  { firestore, now }: SignUpContext,
  transaction: Transaction,
  signUpPayload: CompleteSubscriberSignUpPayload,
  signUpAccount: SignUpAccount,
): Promise<SignUpDocuments> => {
  const { planCheckout, planCheckoutReference } = await findSignUpCheckout({
    firestore,
    now,
    signUpToken: signUpPayload.signUpToken,
    transaction,
  });
  const slugLockReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESS_SLUGS)
    .doc(signUpPayload.businessSlug);
  const slugLockSnapshot = await transaction.get(slugLockReference);
  if (slugLockSnapshot.exists) {
    throw new CallableFailure("already-exists", SIGN_UP_ERROR.SLUG_TAKEN, {
      reason: SIGN_UP_ERROR_REASON.SLUG_TAKEN,
    });
  }

  const businessReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc();
  const phone =
    signUpPayload.phone === STRING.EMPTY ? null : signUpPayload.phone;

  transaction.create(businessReference, {
    createdAt: now,
    id: businessReference.id,
    name: signUpPayload.businessName,
    ownerUserId: signUpAccount.userId,
    plan_id: planCheckout.planId,
    planCheckoutId: planCheckoutReference.id,
    slug: signUpPayload.businessSlug,
    status: BUSINESS_STATUS.PENDING,
    timeZone: signUpPayload.timeZone,
  });
  transaction.create(
    firestore.collection(FIRESTORE_COLLECTION.USERS).doc(signUpAccount.userId),
    {
      businessId: businessReference.id,
      createdAt: now,
      email: signUpAccount.email,
      fullName: signUpAccount.fullName,
      language: signUpPayload.language,
      phone,
      role: USER_ROLE.SUBSCRIBER,
      uid: signUpAccount.userId,
    },
  );
  transaction.create(slugLockReference, {
    businessId: businessReference.id,
    createdAt: now,
  });

  const ownerCollaboratorReference = businessReference
    .collection(FIRESTORE_COLLECTION.COLLABORATORS)
    .doc(signUpAccount.userId);
  transaction.create(ownerCollaboratorReference, {
    createdAt: now,
    email: signUpAccount.email,
    fullName: signUpAccount.fullName,
    is_owner: true,
    permissions: [
      COLLABORATOR_PERMISSION.MANAGE_BOOKINGS,
      COLLABORATOR_PERMISSION.MANAGE_CUSTOMERS,
      COLLABORATOR_PERMISSION.MANAGE_SCHEDULE_BLOCKS,
      COLLABORATOR_PERMISSION.MANAGE_SERVICES,
      COLLABORATOR_PERMISSION.VIEW_REPORTS,
    ],
    phone,
    serviceIds: [],
    status: COLLABORATOR_STATUS.ACTIVE,
    uid: signUpAccount.userId,
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
  transaction.update(planCheckoutReference, { signUpCompletedAt: now });

  return { businessId: businessReference.id, paymentId: paymentReference.id };
};

// Deletes the new Auth user. A failure here is recorded and not thrown, so
// the caller re-throws the error that started the rollback.
const deleteAccount = async (
  { auth, reportError }: SignUpContext,
  userId: string,
): Promise<void> => {
  try {
    await auth.deleteUser(userId);
  } catch (error) {
    reportError(SIGN_UP_ERROR.ACCOUNT_NOT_DELETED, { error, userId });
  }
};

// Undoes a stored sign-up: the documents, the slug lock and the used mark of
// the link, then the Auth user, so the visitor can sign up again with the
// same link (AC-KAN-25-22). Failures are recorded, never thrown.
const undoSignUp = async (
  signUpContext: SignUpContext,
  planCheckoutReference: DocumentReference,
  signUpPayload: CompleteSubscriberSignUpPayload,
  signUpAccount: SignUpAccount,
  signUpDocuments: SignUpDocuments,
): Promise<void> => {
  const { firestore, reportError } = signUpContext;
  const businessReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(signUpDocuments.businessId);
  const batch = firestore.batch();
  batch.delete(
    businessReference
      .collection(FIRESTORE_COLLECTION.COLLABORATORS)
      .doc(signUpAccount.userId),
  );
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
    reportError(SIGN_UP_ERROR.SIGN_UP_NOT_UNDONE, {
      ...signUpDocuments,
      error,
      userId: signUpAccount.userId,
    });
  }
  await deleteAccount(signUpContext, signUpAccount.userId);
};

// Sets the subscriber claims, trying again a few times with a growing pause:
// a transient Auth failure must not leave an account that cannot open its
// portal.
const setSubscriberClaims = async (
  { auth, reportError }: SignUpContext,
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
      reportError(SIGN_UP_ERROR.CLAIMS_NOT_SET, {
        attempt,
        businessId,
        error,
        userId,
      });
      if (attempt >= SIGN_UP_CLAIMS_ATTEMPTS) {
        throw error;
      }
      await wait(
        SIGN_UP_CLAIMS_RETRY_DELAY_MILLISECONDS *
          SIGN_UP_CLAIMS_RETRY_DELAY_MULTIPLIER ** (attempt - 1),
      );
    }
  }
};

// Creates the subscriber's account and their pending business from a paid
// checkout (KAN-25, SPEC "Order and rollback"). Public: the sign-up link token
// is the credential. Shared by the callable and the Vercel dispatcher (Q8).
export const handleCompleteSubscriberSignUp = async ({
  assertRecaptcha,
  auth,
  firestore,
  now,
  payload,
  reportError,
}: CompleteSubscriberSignUpInput): Promise<CompleteSubscriberSignUpResponse> => {
  const signUpPayload = parseCallablePayload(
    completeSubscriberSignUpPayloadSchema,
    payload,
    SIGN_UP_ERROR.INVALID_PAYLOAD,
  );
  // Before anything is read or created: a rejected token leaves the link
  // unused (AC-KAN-25-08).
  await assertRecaptcha(signUpPayload.recaptchaToken);

  if (isReservedBusinessSlug(signUpPayload.businessSlug)) {
    throw new CallableFailure(
      "failed-precondition",
      SIGN_UP_ERROR.SLUG_RESERVED,
      { reason: SIGN_UP_ERROR_REASON.SLUG_RESERVED },
    );
  }
  const signUpContext: SignUpContext = { auth, firestore, now, reportError };
  const { planCheckout, planCheckoutReference } = await findSignUpCheckout({
    firestore,
    now,
    signUpToken: signUpPayload.signUpToken,
  });

  const fullName = [signUpPayload.firstName, signUpPayload.lastName].join(
    STRING.SPACE,
  );
  const userId = await createAccount(
    auth,
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
      writeSignUpDocuments(
        signUpContext,
        transaction,
        signUpPayload,
        signUpAccount,
      ),
    )
    .catch(async (error: unknown) => {
      await deleteAccount(signUpContext, userId);
      throw error;
    });

  // Without claims the account cannot open its portal, so if they cannot be
  // set the whole sign-up is undone and the visitor can try again: unavailable
  // makes the client show the network message (AC-KAN-25-10).
  try {
    await setSubscriberClaims(
      signUpContext,
      userId,
      signUpDocuments.businessId,
    );
  } catch {
    await undoSignUp(
      signUpContext,
      planCheckoutReference,
      signUpPayload,
      signUpAccount,
      signUpDocuments,
    );
    throw new CallableFailure("unavailable", SIGN_UP_ERROR.CLAIMS_NOT_SET);
  }

  return { email: planCheckout.email };
};
