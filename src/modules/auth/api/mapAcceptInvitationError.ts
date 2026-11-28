import { FirebaseError } from "firebase/app";
import { FIREBASE_ERROR_CODE } from "@/constants";
import {
  ACCEPT_INVITATION_ERROR_KEY,
  ACCEPT_INVITATION_REASON,
  type AcceptInvitationErrorKey,
} from "../constants/AcceptInvitation.constants";
import type { AcceptInvitationError } from "../models/AcceptInvitation.mutation";

const MESSAGE_KEY_BY_CODE: Readonly<Record<string, AcceptInvitationErrorKey>> =
  {
    [FIREBASE_ERROR_CODE.FUNCTIONS_ALREADY_EXISTS]:
      ACCEPT_INVITATION_ERROR_KEY.EMAIL_ALREADY_IN_USE,
    [FIREBASE_ERROR_CODE.FUNCTIONS_INTERNAL]:
      ACCEPT_INVITATION_ERROR_KEY.NETWORK,
    [FIREBASE_ERROR_CODE.FUNCTIONS_INVALID_ARGUMENT]:
      ACCEPT_INVITATION_ERROR_KEY.WEAK_PASSWORD,
    [FIREBASE_ERROR_CODE.FUNCTIONS_PERMISSION_DENIED]:
      ACCEPT_INVITATION_ERROR_KEY.RECAPTCHA_REJECTED,
    [FIREBASE_ERROR_CODE.FUNCTIONS_RESOURCE_EXHAUSTED]:
      ACCEPT_INVITATION_ERROR_KEY.TOO_MANY_REQUESTS,
    [FIREBASE_ERROR_CODE.FUNCTIONS_UNAVAILABLE]:
      ACCEPT_INVITATION_ERROR_KEY.NETWORK,
    [FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED]:
      ACCEPT_INVITATION_ERROR_KEY.NETWORK,
    [FIREBASE_ERROR_CODE.TOO_MANY_REQUESTS]:
      ACCEPT_INVITATION_ERROR_KEY.TOO_MANY_REQUESTS,
    [FIREBASE_ERROR_CODE.WEAK_PASSWORD]:
      ACCEPT_INVITATION_ERROR_KEY.WEAK_PASSWORD,
  };

const readErrorReason = (error: FirebaseError): string => {
  const details = (error as { readonly details?: unknown }).details;
  if (typeof details === "object" && details !== null && "reason" in details) {
    return String((details as { readonly reason?: unknown }).reason ?? "");
  }
  return "";
};

export const mapAcceptInvitationError = (
  error: unknown,
): AcceptInvitationError => {
  if (error instanceof FirebaseError) {
    const reason = readErrorReason(error);
    if (reason === ACCEPT_INVITATION_REASON.INVITATION_INVALID) {
      return {
        code: error.code,
        messageKey: ACCEPT_INVITATION_ERROR_KEY.LINK_INVALID,
      };
    }
    if (reason === ACCEPT_INVITATION_REASON.CANNOT_ACCEPT_INVITATION) {
      return {
        code: error.code,
        messageKey: ACCEPT_INVITATION_ERROR_KEY.EMAIL_ALREADY_IN_USE,
      };
    }

    return {
      code: error.code,
      messageKey:
        MESSAGE_KEY_BY_CODE[error.code] ?? ACCEPT_INVITATION_ERROR_KEY.UNKNOWN,
    };
  }

  return {
    code: FIREBASE_ERROR_CODE.UNKNOWN,
    messageKey: ACCEPT_INVITATION_ERROR_KEY.UNKNOWN,
  };
};
