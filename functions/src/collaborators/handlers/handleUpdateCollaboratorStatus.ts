import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { CallableFailure } from "../../shared/CallableFailure.js";
import { COLLABORATOR_STATUS } from "../../shared/constants/CollaboratorStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { parseCallablePayload } from "../../shared/parseCallablePayload.js";
import type { Nullable } from "../../shared/types/Nullable.js";
import {
  COLLABORATOR_ERROR_REASON,
  COLLABORATOR_HANDLER_ERROR,
} from "../constants/CollaboratorHandler.constants.js";
import {
  updateCollaboratorStatusPayloadSchema,
  type UpdateCollaboratorStatusResult,
} from "../models/CollaboratorHandlers.model.js";
import {
  assertBusinessIsActive,
  assertNonOwnerCollaboratorExists,
  assertWithinCollaboratorLimit,
} from "../utils/collaboratorHelpers.js";

export interface HandleUpdateCollaboratorStatusInput {
  readonly auth: Auth;
  readonly firestore: Firestore;
  readonly now: Date;
  readonly payload: unknown;
}

/**
 * Desactiva (`active -> inactive`) o reactiva (`inactive -> active`) un
 * colaborador, sincronizando la cuenta en Firebase Auth y revalidando el
 * cupo del plan al reactivar (KAN-81, KAN-82, KAN-85).
 */
export const handleUpdateCollaboratorStatus = async ({
  auth,
  firestore,
  now,
  payload,
}: HandleUpdateCollaboratorStatusInput): Promise<UpdateCollaboratorStatusResult> => {
  const { businessId, collaboratorId, targetStatus } = parseCallablePayload(
    updateCollaboratorStatusPayloadSchema,
    payload,
    COLLABORATOR_HANDLER_ERROR.INVALID_PAYLOAD,
  );

  const businessReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(businessId);
  const businessData = await assertBusinessIsActive(businessReference);

  const collaboratorsCollection = businessReference.collection(
    FIRESTORE_COLLECTION.COLLABORATORS,
  );
  const collaboratorReference = collaboratorsCollection.doc(collaboratorId);

  const linkedUserId = await firestore.runTransaction(async (transaction) => {
    const collaboratorSnapshot = await transaction.get(collaboratorReference);
    const collaboratorData =
      assertNonOwnerCollaboratorExists(collaboratorSnapshot);

    const currentStatus = String(collaboratorData.status ?? "");
    const isAllowedTransition =
      (currentStatus === COLLABORATOR_STATUS.ACTIVE &&
        targetStatus === COLLABORATOR_STATUS.INACTIVE) ||
      (currentStatus === COLLABORATOR_STATUS.INACTIVE &&
        targetStatus === COLLABORATOR_STATUS.ACTIVE);

    if (!isAllowedTransition) {
      throw new CallableFailure(
        "failed-precondition",
        COLLABORATOR_HANDLER_ERROR.INVALID_STATUS_TRANSITION,
        { reason: COLLABORATOR_ERROR_REASON.INVALID_STATUS_TRANSITION },
      );
    }

    if (targetStatus === COLLABORATOR_STATUS.ACTIVE) {
      const collaboratorsSnapshot = await transaction.get(
        collaboratorsCollection,
      );
      await assertWithinCollaboratorLimit(
        firestore,
        businessReference,
        businessData,
        collaboratorsSnapshot,
        transaction,
      );
    }

    transaction.update(collaboratorReference, {
      status: targetStatus,
      updatedAt: now,
    });

    return typeof collaboratorData.userId === "string"
      ? collaboratorData.userId
      : (null as Nullable<string>);
  });

  if (linkedUserId) {
    if (targetStatus === COLLABORATOR_STATUS.INACTIVE) {
      await auth.updateUser(linkedUserId, { disabled: true });
      await auth.revokeRefreshTokens(linkedUserId);
    } else {
      await auth.updateUser(linkedUserId, { disabled: false });
    }
  }

  return {
    collaboratorId,
    status: targetStatus,
  };
};
