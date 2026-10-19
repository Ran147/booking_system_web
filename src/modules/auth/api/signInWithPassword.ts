import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION, FUNCTION_NAME } from "@/constants";
import { auth, callFunction, firestore } from "@/services/firebase";
import { USER_ROLE, type UserRole } from "@/shared/domain";
import type { Nullable } from "@/shared/types";
import { fetchUserLanguage } from "./fetchUserLanguage";
import { mapTokenClaimsToSession } from "./mapTokenClaimsToSession";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";
import { SIGN_IN_FAILURE } from "../constants/SignInErrorKey.constants";
import type {
  SignInPayload,
  SignInResponse,
  VerifyRecaptchaPayload,
  VerifyRecaptchaResponse,
} from "../models/SignIn.mutation";

const isUserRole = (claimValue: unknown): claimValue is UserRole =>
  Object.values(USER_ROLE).some((userRole) => userRole === claimValue);

// US-33, D-1: reCAPTCHA first, then Firebase Auth, then the fresh claims and
// the profile language. Errors are raw here; useSignInMutation maps them.
export const signInWithPassword = async ({
  email,
  password,
  recaptchaToken,
}: SignInPayload): Promise<SignInResponse> => {
  await callFunction<VerifyRecaptchaPayload, VerifyRecaptchaResponse>(
    FUNCTION_NAME.VERIFY_RECAPTCHA,
    { recaptchaToken },
  );

  const { user } = await signInWithEmailAndPassword(auth, email, password);
  const idTokenResult = await user.getIdTokenResult(true);
  let session = mapTokenClaimsToSession(user.uid, idTokenResult.claims);

  if (session.status !== SESSION_STATUS.SIGNED_IN) {
    try {
      const userSnapshot = await getDoc(
        doc(firestore, FIRESTORE_COLLECTION.USERS, user.uid),
      );
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const role = userData?.role;
        const businessId = (userData?.business_id ||
          userData?.businessId ||
          null) as Nullable<string>;
        if (isUserRole(role)) {
          session = {
            businessId,
            collaboratorId: null,
            role,
            status: SESSION_STATUS.SIGNED_IN,
            userId: user.uid,
          };
        }
      }
    } catch {
      // Session status check continues below
    }
  }

  // An account without a role claim has no portal: leave no half session.
  if (session.status !== SESSION_STATUS.SIGNED_IN) {
    await signOut(auth);
    throw new Error(SIGN_IN_FAILURE.MISSING_ROLE_CLAIM);
  }

  // The language is a preference: failing to read it never blocks sign-in.
  const language = await fetchUserLanguage(user.uid).catch(() => null);

  return { language, session };
};
