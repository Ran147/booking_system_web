import { FirebaseError } from "firebase/app";
import { sendEmailVerification } from "firebase/auth";
import { FIREBASE_ERROR_CODE } from "@/constants";
import { auth } from "@/services/firebase";

// Resent from the browser with the session open (spec KAN-122 D3); Firebase
// applies its own limit (AS-6). The email opens /auth/action, which returns
// to continueUrl after verifying.
export const sendVerificationEmailAgain = async (
  continueUrl: string,
  language: string,
): Promise<void> => {
  const { currentUser } = auth;
  if (!currentUser) {
    throw new FirebaseError(
      FIREBASE_ERROR_CODE.USER_NOT_FOUND,
      FIREBASE_ERROR_CODE.USER_NOT_FOUND,
    );
  }
  auth.languageCode = language;
  await sendEmailVerification(currentUser, { url: continueUrl });
};
