import { FirebaseError } from "firebase/app";
import { FIREBASE_ERROR_CODE, FUNCTION_NAME } from "@/constants";
import { callFunction } from "@/services/firebase";
import type { Nullable } from "@/types";
import {
  ACCEPT_INVITATION_ERROR_REASON,
  INVITATION_ERROR_KEY,
} from "../constants/InvitationLink.constants";
import type {
  AcceptInvitationError,
  AcceptInvitationPayload,
  AcceptInvitationResponse,
  ValidateInvitationResponse,
} from "../models/acceptInvitation.model";

const readReason = (details: unknown): Nullable<string> => {
  if (typeof details === "object" && details !== null && "reason" in details) {
    const reason = (details as { reason?: unknown }).reason;
    return typeof reason === "string" ? reason : null;
  }
  return null;
};

export const mapAcceptInvitationError = (
  error: unknown,
): AcceptInvitationError => {
  if (error instanceof FirebaseError) {
    const details =
      "details" in error ? (error as { details?: unknown }).details : undefined;
    const reason = readReason(details);

    if (reason === ACCEPT_INVITATION_ERROR_REASON.EMAIL_ALREADY_IN_USE) {
      return { messageKey: INVITATION_ERROR_KEY.EMAIL_ALREADY_IN_USE };
    }
    if (reason === ACCEPT_INVITATION_ERROR_REASON.INVALID_INVITATION) {
      return { messageKey: INVITATION_ERROR_KEY.LINK_INVALID };
    }
    if (error.code === FIREBASE_ERROR_CODE.FAILED_PRECONDITION) {
      return { messageKey: INVITATION_ERROR_KEY.LINK_INVALID };
    }
    if (error.code === FIREBASE_ERROR_CODE.FUNCTIONS_ALREADY_EXISTS) {
      return { messageKey: INVITATION_ERROR_KEY.EMAIL_ALREADY_IN_USE };
    }
    if (error.code === FIREBASE_ERROR_CODE.FUNCTIONS_UNAVAILABLE) {
      return { messageKey: INVITATION_ERROR_KEY.NETWORK };
    }
    if (error.code === FIREBASE_ERROR_CODE.TOO_MANY_REQUESTS) {
      return { messageKey: INVITATION_ERROR_KEY.TOO_MANY_REQUESTS };
    }
    if (error.code === FIREBASE_ERROR_CODE.WEAK_PASSWORD) {
      return { messageKey: INVITATION_ERROR_KEY.WEAK_PASSWORD };
    }
  }

  return { messageKey: INVITATION_ERROR_KEY.UNKNOWN };
};

export const validateCollaboratorInvitation = async (
  invitationToken: string,
): Promise<ValidateInvitationResponse> =>
  callFunction<{ invitationToken: string }, ValidateInvitationResponse>(
    FUNCTION_NAME.VALIDATE_COLLABORATOR_INVITATION,
    { invitationToken },
  );

export const acceptCollaboratorInvitation = async (
  payload: AcceptInvitationPayload,
): Promise<AcceptInvitationResponse> =>
  callFunction<AcceptInvitationPayload, AcceptInvitationResponse>(
    FUNCTION_NAME.ACCEPT_COLLABORATOR_INVITATION,
    payload,
  );
