import type { Firestore } from "firebase-admin/firestore";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { parseCallablePayload } from "../../shared/parseCallablePayload.js";
import { COLLABORATOR_HANDLER_ERROR } from "../constants/CollaboratorHandler.constants.js";
import {
  updateCollaboratorPermissionsPayloadSchema,
  type UpdateCollaboratorPermissionsResult,
} from "../models/CollaboratorHandlers.model.js";
import {
  assertBusinessIsActive,
  assertNonOwnerCollaboratorExists,
  deduplicateStrings,
} from "../utils/collaboratorHelpers.js";

export interface HandleUpdateCollaboratorPermissionsInput {
  readonly firestore: Firestore;
  readonly now: Date;
  readonly payload: unknown;
}

/**
 * Actualiza los permisos del colaborador sin cerrar su sesion (KAN-86).
 */
export const handleUpdateCollaboratorPermissions = async ({
  firestore,
  now,
  payload,
}: HandleUpdateCollaboratorPermissionsInput): Promise<UpdateCollaboratorPermissionsResult> => {
  const { businessId, collaboratorId, permissions } = parseCallablePayload(
    updateCollaboratorPermissionsPayloadSchema,
    payload,
    COLLABORATOR_HANDLER_ERROR.INVALID_PAYLOAD,
  );

  const businessReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(businessId);
  await assertBusinessIsActive(businessReference);

  const collaboratorReference = businessReference
    .collection(FIRESTORE_COLLECTION.COLLABORATORS)
    .doc(collaboratorId);
  const collaboratorSnapshot = await collaboratorReference.get();
  assertNonOwnerCollaboratorExists(collaboratorSnapshot);

  const uniquePermissions = deduplicateStrings(permissions);
  await collaboratorReference.update({
    permissions: uniquePermissions,
    updatedAt: now,
  });

  return {
    collaboratorId,
    permissions: uniquePermissions,
  };
};
