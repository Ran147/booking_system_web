import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { FUNCTION_NAME } from "@/constants";
import { auth, callFunction } from "@/services/firebase";
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
  const session = mapTokenClaimsToSession(user.uid, idTokenResult.claims);

  // An account without a role claim has no portal: leave no half session.
  if (session.status !== SESSION_STATUS.SIGNED_IN) {
    await signOut(auth);
    throw new Error(SIGN_IN_FAILURE.MISSING_ROLE_CLAIM);
  }

  // The language is a preference: failing to read it never blocks sign-in.
  const language = await fetchUserLanguage(user.uid).catch(() => null);

  return { language, session };
};
