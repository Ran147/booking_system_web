import type { Auth } from "firebase-admin/auth";
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
  registerCollaboratorPayloadSchema,
  type RegisterCollaboratorResult,
} from "../models/CollaboratorHandlers.model.js";
import {
  assertBusinessIsActive,
  assertServicesAreActive,
  assertWithinCollaboratorLimit,
  buildInvitationDocument,
  deduplicateStrings,
  generateInvitationToken,
  hashInvitationToken,
  isAuthEmailTaken,
  normalizeSearchTerm,
  readSubscriberLanguage,
} from "../utils/collaboratorHelpers.js";

export interface HandleRegisterCollaboratorInput {
  readonly auth: Auth;
  readonly callerUserId: string;
  readonly firestore: Firestore;
  readonly now: Date;
  readonly payload: unknown;
}

/**
 * Registra un nuevo colaborador en estado `invited`, valida el limite del plan
 * en transaccion y genera un enlace de invitacion de un solo uso (KAN-78, KAN-85).
 */
export const handleRegisterCollaborator = async ({
  auth,
  callerUserId,
  firestore,
  now,
  payload,
}: HandleRegisterCollaboratorInput): Promise<RegisterCollaboratorResult> => {
  const {
    businessId,
    email,
    fullName,
    permissions,
    phone,
    serviceIds,
    specialty,
  } = parseCallablePayload(
    registerCollaboratorPayloadSchema,
    payload,
    COLLABORATOR_HANDLER_ERROR.INVALID_PAYLOAD,
  );

  const businessReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(businessId);
  const businessData = await assertBusinessIsActive(businessReference);

  if (await isAuthEmailTaken(auth, email)) {
    throw new CallableFailure(
      "already-exists",
      COLLABORATOR_HANDLER_ERROR.EMAIL_ALREADY_IN_USE,
      { reason: COLLABORATOR_ERROR_REASON.EMAIL_ALREADY_IN_USE },
    );
  }

  const uniquePermissions = deduplicateStrings(permissions);
  const uniqueServiceIds = deduplicateStrings(serviceIds);
  const subscriberLanguage = await readSubscriberLanguage(
    firestore,
    callerUserId,
  );
  const invitationToken = generateInvitationToken();
  const tokenHash = hashInvitationToken(invitationToken);
  const collaboratorsCollection = businessReference.collection(
    FIRESTORE_COLLECTION.COLLABORATORS,
  );
  const collaboratorReference = collaboratorsCollection.doc();
  const invitationReference = firestore
    .collection(FIRESTORE_COLLECTION.COLLABORATOR_INVITATIONS)
    .doc(tokenHash);

  await firestore.runTransaction(async (transaction) => {
    const collaboratorsSnapshot = await transaction.get(collaboratorsCollection);

    const hasDuplicateEmail = collaboratorsSnapshot.docs.some(
      (collaboratorDocument) => {
        const collaboratorData = collaboratorDocument.data();
        if (collaboratorData.is_owner) {
          return false;
        }
        return String(collaboratorData.email ?? "").toLowerCase() === email;
      },
    );

    if (hasDuplicateEmail) {
      throw new CallableFailure(
        "already-exists",
        COLLABORATOR_HANDLER_ERROR.EMAIL_ALREADY_IN_USE,
        { reason: COLLABORATOR_ERROR_REASON.EMAIL_ALREADY_IN_USE },
      );
    }

    await assertWithinCollaboratorLimit(
      firestore,
      businessReference,
      businessData,
      collaboratorsSnapshot,
      transaction,
    );

    await assertServicesAreActive(
      businessReference,
      uniqueServiceIds,
      transaction,
    );

    transaction.set(collaboratorReference, {
      businessId,
      createdAt: now,
      email,
      fullName,
      lastEmailSentAt: now,
      permissions: uniquePermissions,
      phone,
      searchName: normalizeSearchTerm(fullName),
      serviceIds: uniqueServiceIds,
      specialty,
      status: COLLABORATOR_STATUS.INVITED,
      updatedAt: now,
      userId: null,
    });

    transaction.set(
      invitationReference,
      buildInvitationDocument({
        businessId,
        businessName: String(businessData.name ?? ""),
        collaboratorId: collaboratorReference.id,
        email,
        language: subscriberLanguage,
        now,
      }),
    );
  });

  return {
    collaboratorId: collaboratorReference.id,
    email,
    invitationToken,
    status: COLLABORATOR_STATUS.INVITED,
  };
};
