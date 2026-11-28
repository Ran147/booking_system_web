import { FirebaseError } from "firebase/app";
import { FIREBASE_ERROR_CODE } from "@/constants";
import {
  RESEND_VERIFICATION_MESSAGE_KEY,
  type ResendVerificationMessageKey,
} from "../constants/EmailVerificationBanner.constants";

// Converts the resend error once, at the api/ boundary
// (api-mutation-standards §3).
export const mapResendVerificationError = (
  error: unknown,
): ResendVerificationMessageKey => {
  if (!(error instanceof FirebaseError)) {
    return RESEND_VERIFICATION_MESSAGE_KEY.UNKNOWN;
  }
  switch (error.code) {
    case FIREBASE_ERROR_CODE.TOO_MANY_REQUESTS:
      return RESEND_VERIFICATION_MESSAGE_KEY.TOO_MANY_REQUESTS;
    case FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED:
      return RESEND_VERIFICATION_MESSAGE_KEY.NETWORK;
    default:
      return RESEND_VERIFICATION_MESSAGE_KEY.UNKNOWN;
  }
};
