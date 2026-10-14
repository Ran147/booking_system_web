import { FirebaseError } from "firebase/app";
import { FIREBASE_ERROR_CODE } from "@/constants";
import {
  PASSWORD_RESET_ERROR_KEY,
  type PasswordResetErrorKey,
} from "../constants/PasswordResetErrorKey.constants";
import type { PasswordResetError } from "../models/PasswordReset.mutation";

// US-36. Expired, used and malformed links share one message (AC-KAN-37-05).
const MESSAGE_KEY_BY_CODE: Readonly<Record<string, PasswordResetErrorKey>> = {
  [FIREBASE_ERROR_CODE.EXPIRED_ACTION_CODE]:
    PASSWORD_RESET_ERROR_KEY.LINK_INVALID,
  [FIREBASE_ERROR_CODE.FUNCTIONS_INTERNAL]: PASSWORD_RESET_ERROR_KEY.NETWORK,
  [FIREBASE_ERROR_CODE.FUNCTIONS_INVALID_ARGUMENT]:
    PASSWORD_RESET_ERROR_KEY.RECAPTCHA_REJECTED,
  [FIREBASE_ERROR_CODE.FUNCTIONS_PERMISSION_DENIED]:
    PASSWORD_RESET_ERROR_KEY.RECAPTCHA_REJECTED,
  [FIREBASE_ERROR_CODE.FUNCTIONS_UNAVAILABLE]: PASSWORD_RESET_ERROR_KEY.NETWORK,
  [FIREBASE_ERROR_CODE.INVALID_ACTION_CODE]:
    PASSWORD_RESET_ERROR_KEY.LINK_INVALID,
  [FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED]:
    PASSWORD_RESET_ERROR_KEY.NETWORK,
};

export const mapPasswordResetError = (error: unknown): PasswordResetError => {
  if (error instanceof FirebaseError) {
    return {
      code: error.code,
      messageKey:
        MESSAGE_KEY_BY_CODE[error.code] ?? PASSWORD_RESET_ERROR_KEY.UNKNOWN,
    };
  }

  return {
    code: FIREBASE_ERROR_CODE.UNKNOWN,
    messageKey: PASSWORD_RESET_ERROR_KEY.UNKNOWN,
  };
};
