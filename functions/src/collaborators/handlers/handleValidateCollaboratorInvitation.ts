import type { Firestore } from "firebase-admin/firestore";
import { CallableFailure } from "../../shared/CallableFailure.js";
import { COLLABORATOR_STATUS } from "../../shared/constants/CollaboratorStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { parseCallablePayload } from "../../shared/parseCallablePayload.js";
import {
  COLLABORATOR_ERROR_REASON,
  COLLABORATOR_HANDLER_ERROR,
} from "../constants/CollaboratorHandler.constants.js";
import {
  validateCollaboratorInvitationPayloadSchema,
  type ValidateCollaboratorInvitationResult,
} from "../models/CollaboratorHandlers.model.js";
import {
  hashInvitationToken,
  readTimestampMillis,
} from "../utils/collaboratorHelpers.js";

export interface HandleValidateCollaboratorInvitationInput {
  readonly firestore: Firestore;
  readonly now: Date;
  readonly payload: unknown;
}

const throwInvitationInvalid = (): never => {
  throw new CallableFailure(
    "failed-precondition",
    COLLABORATOR_HANDLER_ERROR.INVITATION_INVALID,
    { reason: COLLABORATOR_ERROR_REASON.INVITATION_INVALID },
  );
};

/**
 * Valida si un token de invitacion de colaborador esta vigente antes de mostrar
 * el formulario de activacion (KAN-79).
 */
export const handleValidateCollaboratorInvitation = async ({
  firestore,
  now,
  payload,
}: HandleValidateCollaboratorInvitationInput): Promise<ValidateCollaboratorInvitationResult> => {
  const { invitationToken } = parseCallablePayload(
    validateCollaboratorInvitationPayloadSchema,
    payload,
    COLLABORATOR_HANDLER_ERROR.INVALID_PAYLOAD,
  );

  const tokenHash = hashInvitationToken(invitationToken);
  const invitationSnapshot = await firestore
    .collection(FIRESTORE_COLLECTION.COLLABORATOR_INVITATIONS)
    .doc(tokenHash)
    .get();

  const invitationData = invitationSnapshot.data();
  if (!invitationSnapshot.exists || !invitationData) {
    throwInvitationInvalid();
  }

  const expiresAtMillis = readTimestampMillis(invitationData!.expiresAt);
  if (
    invitationData!.usedAt !== null &&
    invitationData!.usedAt !== undefined
  ) {
    throwInvitationInvalid();
  }
  if (
    invitationData!.invalidatedAt !== null &&
    invitationData!.invalidatedAt !== undefined
  ) {
    throwInvitationInvalid();
  }
  if (expiresAtMillis === null || expiresAtMillis <= now.getTime()) {
    throwInvitationInvalid();
  }

  const businessId = String(invitationData!.businessId ?? "");
  const collaboratorId = String(invitationData!.collaboratorId ?? "");
  if (!businessId || !collaboratorId) {
    throwInvitationInvalid();
  }

  const collaboratorSnapshot = await firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(businessId)
    .collection(FIRESTORE_COLLECTION.COLLABORATORS)
    .doc(collaboratorId)
    .get();

  if (
    !collaboratorSnapshot.exists ||
    collaboratorSnapshot.data()?.status !== COLLABORATOR_STATUS.INVITED
  ) {
    throwInvitationInvalid();
  }

  return {
    businessName: String(invitationData!.businessName ?? ""),
    email: String(invitationData!.email ?? ""),
  };
};
