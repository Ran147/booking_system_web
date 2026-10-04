import { FirebaseError } from "firebase/app";
import {
  ERROR_MESSAGE_KEY,
  FIREBASE_ERROR_CODE,
  type ErrorMessageKey,
} from "@/shared/constants";
import type { MutationError } from "@/shared/types";

const MESSAGE_KEY_BY_CODE: Readonly<Record<string, ErrorMessageKey>> = {
  [FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED]: ERROR_MESSAGE_KEY.NETWORK,
  [FIREBASE_ERROR_CODE.NOT_FOUND]: ERROR_MESSAGE_KEY.NOT_FOUND,
  [FIREBASE_ERROR_CODE.PERMISSION_DENIED]: ERROR_MESSAGE_KEY.PERMISSION_DENIED,
  [FIREBASE_ERROR_CODE.UNAVAILABLE]: ERROR_MESSAGE_KEY.NETWORK,
};

export const mapFirebaseError = (error: unknown): MutationError => {
  if (error instanceof FirebaseError) {
    return {
      code: error.code,
      messageKey: MESSAGE_KEY_BY_CODE[error.code] ?? ERROR_MESSAGE_KEY.UNKNOWN,
    };
  }

  return {
    code: FIREBASE_ERROR_CODE.UNKNOWN,
    messageKey: ERROR_MESSAGE_KEY.UNKNOWN,
  };
};
