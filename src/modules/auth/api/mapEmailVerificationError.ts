import { FirebaseError } from "firebase/app";
import { FIREBASE_ERROR_CODE } from "@/constants";
import {
  EMAIL_VERIFICATION_ERROR_KEY,
  type EmailVerificationErrorKey,
} from "../constants/AuthAction.constants";
import type { EmailVerificationError } from "../models/emailVerification.model";

// KAN-126. Expired, used and malformed links share one message
// (AC-KAN-126-03), and so do the links of an account that was disabled or
// deleted after the email went out: retrying them can never work.
const MESSAGE_KEY_BY_CODE: Readonly<Record<string, EmailVerificationErrorKey>> =
  {
    [FIREBASE_ERROR_CODE.EXPIRED_ACTION_CODE]:
      EMAIL_VERIFICATION_ERROR_KEY.LINK_INVALID,
    [FIREBASE_ERROR_CODE.INVALID_ACTION_CODE]:
      EMAIL_VERIFICATION_ERROR_KEY.LINK_INVALID,
    [FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED]:
      EMAIL_VERIFICATION_ERROR_KEY.NETWORK,
    [FIREBASE_ERROR_CODE.USER_DISABLED]:
      EMAIL_VERIFICATION_ERROR_KEY.LINK_INVALID,
    [FIREBASE_ERROR_CODE.USER_NOT_FOUND]:
      EMAIL_VERIFICATION_ERROR_KEY.LINK_INVALID,
  };

export const mapEmailVerificationError = (
  error: unknown,
): EmailVerificationError => {
  if (error instanceof FirebaseError) {
    return {
      code: error.code,
      messageKey:
        MESSAGE_KEY_BY_CODE[error.code] ?? EMAIL_VERIFICATION_ERROR_KEY.UNKNOWN,
    };
  }

  return {
    code: FIREBASE_ERROR_CODE.UNKNOWN,
    messageKey: EMAIL_VERIFICATION_ERROR_KEY.UNKNOWN,
  };
};
