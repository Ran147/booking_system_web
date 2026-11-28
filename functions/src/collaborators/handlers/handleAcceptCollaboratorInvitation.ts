import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { CallableFailure } from "../../shared/CallableFailure.js";
import { COLLABORATOR_STATUS } from "../../shared/constants/CollaboratorStatus.constants.js";
import { FIREBASE_AUTH_ERROR_CODE } from "../../shared/constants/FirebaseAuthErrorCode.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { LANGUAGE } from "../../shared/constants/Language.constants.js";
import { USER_ROLE } from "../../shared/constants/UserRole.constants.js";
import { hasErrorCode } from "../../shared/hasErrorCode.js";
import { parseCallablePayload } from "../../shared/parseCallablePayload.js";
import {
  COLLABORATOR_ERROR_REASON,
  COLLABORATOR_HANDLER_ERROR,
} from "../constants/CollaboratorHandler.constants.js";
import {
  acceptCollaboratorInvitationPayloadSchema,
  type AcceptCollaboratorInvitationResult,
} from "../models/CollaboratorHandlers.model.js";
import {
  hashInvitationToken,
  readTimestampMillis,
} from "../utils/collaboratorHelpers.js";

const DEFAULT_THEME_MODE = "system";

export interface HandleAcceptCollaboratorInvitationInput {
  readonly auth: Auth;
  readonly firestore: Firestore;
  readonly now: Date;
  readonly payload: unknown;
  readonly verifyRecaptcha: (recaptchaToken: string) => Promise<void>;
}

const throwInvitationInvalid = (): never => {
  throw new CallableFailure(
    "failed-precondition",
    COLLABORATOR_HANDLER_ERROR.INVITATION_INVALID,
    { reason: COLLABORATOR_ERROR_REASON.INVITATION_INVALID },
  );
};

/**
 * Activa la cuenta de un colaborador invitado: verifica token y reCAPTCHA,
 * crea el usuario en Auth con rollback si falla Firestore, asigna claims de
 * `collaborator` y pasa el registro a `active` (KAN-79).
 */
export const handleAcceptCollaboratorInvitation = async ({
  auth,
  firestore,
  now,
  payload,
  verifyRecaptcha,
}: HandleAcceptCollaboratorInvitationInput): Promise<AcceptCollaboratorInvitationResult> => {
  const { invitationToken, password, recaptchaToken } = parseCallablePayload(
    acceptCollaboratorInvitationPayloadSchema,
    payload,
    COLLABORATOR_HANDLER_ERROR.INVALID_PAYLOAD,
  );

  await verifyRecaptcha(recaptchaToken);

  const tokenHash = hashInvitationToken(invitationToken);
  const invitationReference = firestore
    .collection(FIRESTORE_COLLECTION.COLLABORATOR_INVITATIONS)
    .doc(tokenHash);
  const invitationSnapshot = await invitationReference.get();
  const invitationData = invitationSnapshot.data();

  if (!invitationSnapshot.exists || !invitationData) {
    throwInvitationInvalid();
  }

  const precheckExpiresAt = readTimestampMillis(invitationData!.expiresAt);
  if (
    (invitationData!.usedAt !== null &&
      invitationData!.usedAt !== undefined) ||
    (invitationData!.invalidatedAt !== null &&
      invitationData!.invalidatedAt !== undefined) ||
    precheckExpiresAt === null ||
    precheckExpiresAt <= now.getTime()
  ) {
    throwInvitationInvalid();
  }

  const businessId = String(invitationData!.businessId ?? "");
  const collaboratorId = String(invitationData!.collaboratorId ?? "");
  const collaboratorReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(businessId)
    .collection(FIRESTORE_COLLECTION.COLLABORATORS)
    .doc(collaboratorId);

  const precheckCollaborator = await collaboratorReference.get();
  const precheckCollaboratorData = precheckCollaborator.data();
  if (
    !precheckCollaborator.exists ||
    !precheckCollaboratorData ||
    precheckCollaboratorData.status !== COLLABORATOR_STATUS.INVITED
  ) {
    throwInvitationInvalid();
  }

  const email = String(
    precheckCollaboratorData!.email || invitationData!.email || "",
  ).toLowerCase();
  const fullName = String(precheckCollaboratorData!.fullName ?? "");

  let createdUserId: string;
  try {
    const newUser = await auth.createUser({
      displayName: fullName,
      email,
      emailVerified: true,
      password,
    });
    createdUserId = newUser.uid;
  } catch (error) {
    if (hasErrorCode(error, FIREBASE_AUTH_ERROR_CODE.EMAIL_ALREADY_EXISTS)) {
      throw new CallableFailure(
        "failed-precondition",
        COLLABORATOR_HANDLER_ERROR.CANNOT_ACCEPT_INVITATION,
        { reason: COLLABORATOR_ERROR_REASON.CANNOT_ACCEPT_INVITATION },
      );
    }
    throw error;
  }

  try {
    await firestore.runTransaction(async (transaction) => {
      const [latestInvitationSnapshot, latestCollaboratorSnapshot] =
        await Promise.all([
          transaction.get(invitationReference),
          transaction.get(collaboratorReference),
        ]);
      const latestInvitationData = latestInvitationSnapshot.data();
      const latestCollaboratorData = latestCollaboratorSnapshot.data();

      const latestExpiresAt = readTimestampMillis(
        latestInvitationData?.expiresAt,
      );
      if (
        !latestInvitationSnapshot.exists ||
        !latestInvitationData ||
        (latestInvitationData.usedAt !== null &&
          latestInvitationData.usedAt !== undefined) ||
        (latestInvitationData.invalidatedAt !== null &&
          latestInvitationData.invalidatedAt !== undefined) ||
        latestExpiresAt === null ||
        latestExpiresAt <= now.getTime() ||
        !latestCollaboratorSnapshot.exists ||
        !latestCollaboratorData ||
        latestCollaboratorData.status !== COLLABORATOR_STATUS.INVITED
      ) {
        throwInvitationInvalid();
      }

      transaction.update(invitationReference, { usedAt: now });
      transaction.update(collaboratorReference, {
        status: COLLABORATOR_STATUS.ACTIVE,
        updatedAt: now,
        userId: createdUserId,
      });

      const userReference = firestore
        .collection(FIRESTORE_COLLECTION.USERS)
        .doc(createdUserId);
      const language =
        latestInvitationData.language === LANGUAGE.EN
          ? LANGUAGE.EN
          : LANGUAGE.ES;

      transaction.set(userReference, {
        businessId,
        collaboratorId,
        email,
        fullName,
        language,
        phone: latestCollaboratorData.phone ?? null,
        role: USER_ROLE.COLLABORATOR,
        theme: DEFAULT_THEME_MODE,
        uid: createdUserId,
      });
    });
  } catch (error) {
    await auth.deleteUser(createdUserId);
    throw error;
  }

  await auth.setCustomUserClaims(createdUserId, {
    businessId,
    collaboratorId,
    role: USER_ROLE.COLLABORATOR,
  });

  return { email };
};
