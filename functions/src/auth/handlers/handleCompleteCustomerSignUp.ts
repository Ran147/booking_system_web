import type { Auth } from "firebase-admin/auth";
import { FIREBASE_AUTH_ERROR_CODE } from "../../shared/constants/FirebaseAuthErrorCode.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { USER_ROLE } from "../../shared/constants/UserRole.constants.js";
import { hasErrorCode } from "../../shared/hasErrorCode.js";
import type { CallableHandlerInput } from "../../shared/models/CallableHandler.model.js";
import { parseCallablePayload } from "../../shared/parseCallablePayload.js";
import type { NullableRef } from "../../shared/types/Nullable.js";
import {
  CUSTOMER_SIGN_UP,
  CUSTOMER_SIGN_UP_ERROR,
  VERIFICATION_EMAIL_STATUS,
} from "../constants/CustomerSignUp.constants.js";
import type {
  CompleteCustomerSignUpResponse,
  SendVerificationEmail,
} from "../models/CompleteCustomerSignUp.mutation.js";
import { completeCustomerSignUpPayloadSchema } from "../models/CompleteCustomerSignUp.schema.js";

/**
 * The shared input plus what only this handler needs, built by the onCall
 * wrapper and by the Vercel dispatcher (Q8).
 */
export interface CompleteCustomerSignUpInput extends CallableHandlerInput {
  readonly auth: Auth;
  readonly sendVerificationEmail: SendVerificationEmail;
  /** Throws (permission-denied / unavailable) when Google rejects the token. */
  readonly verifyRecaptcha: (recaptchaToken: string) => Promise<void>;
}

const createAccount = async (
  auth: Auth,
  email: string,
  password: string,
  fullName: string,
): Promise<NullableRef<string>> => {
  try {
    const newUser = await auth.createUser({
      displayName: fullName,
      email,
      emailVerified: false,
      password,
    });
    return newUser.uid;
  } catch (error) {
    // AC-KAN-123-06: the existing account is left as it is.
    if (hasErrorCode(error, FIREBASE_AUTH_ERROR_CODE.EMAIL_ALREADY_EXISTS)) {
      return null;
    }
    throw error;
  }
};

// Creates a customer account (KAN-123): the Auth user, the role claim and
// users/{uid}. No business-scoped Customer is created (AS-2). If the claim or
// the document fail, the new Auth user is deleted so the visitor can try
// again with the same email (cloud-functions-standards, Auth rollback).
export const handleCompleteCustomerSignUp = async ({
  auth,
  firestore,
  now,
  payload,
  sendVerificationEmail,
  verifyRecaptcha,
}: CompleteCustomerSignUpInput): Promise<CompleteCustomerSignUpResponse> => {
  const signUpPayload = parseCallablePayload(
    completeCustomerSignUpPayloadSchema,
    payload,
    CUSTOMER_SIGN_UP_ERROR.INVALID_PAYLOAD,
  );
  await verifyRecaptcha(signUpPayload.recaptchaToken);

  const userId = await createAccount(
    auth,
    signUpPayload.email,
    signUpPayload.password,
    signUpPayload.fullName,
  );
  // AS-4: the same answer as a new account, and no email to the existing one.
  if (!userId) return { verificationEmail: VERIFICATION_EMAIL_STATUS.SENT };

  try {
    await auth.setCustomUserClaims(userId, { role: USER_ROLE.CUSTOMER });
    await firestore.collection(FIRESTORE_COLLECTION.USERS).doc(userId).create({
      // A `Date`, not a Timestamp of this package: the Vercel dispatcher
      // may load another copy of firebase-admin (Q8).
      createdAt: now,
      email: signUpPayload.email,
      fullName: signUpPayload.fullName,
      language: signUpPayload.language,
      phone: signUpPayload.phone,
      role: USER_ROLE.CUSTOMER,
      theme: CUSTOMER_SIGN_UP.DEFAULT_THEME,
      uid: userId,
    });
  } catch (error) {
    await auth.deleteUser(userId).catch(() => undefined);
    throw error;
  }

  const isEmailSent = await sendVerificationEmail(
    userId,
    signUpPayload.language,
    signUpPayload.continueUrl,
  );
  return {
    verificationEmail: isEmailSent
      ? VERIFICATION_EMAIL_STATUS.SENT
      : VERIFICATION_EMAIL_STATUS.SEND_FAILED,
  };
};
