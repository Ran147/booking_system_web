import type { Firestore } from "firebase-admin/firestore";
import { CallableFailure } from "../../shared/CallableFailure.js";
import { COLLABORATOR_STATUS } from "../../shared/constants/CollaboratorStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { parseCallablePayload } from "../../shared/parseCallablePayload.js";
import type { Nullable } from "../../shared/types/Nullable.js";
import {
  COLLABORATOR_EMAIL_KIND,
  COLLABORATOR_ERROR_REASON,
  COLLABORATOR_HANDLER_ERROR,
  COLLABORATOR_RULE_LIMIT,
} from "../constants/CollaboratorHandler.constants.js";
import {
  resendCollaboratorEmailPayloadSchema,
  type ResendCollaboratorEmailResult,
} from "../models/CollaboratorHandlers.model.js";
import {
  assertBusinessIsActive,
  assertNonOwnerCollaboratorExists,
  buildInvitationDocument,
  generateInvitationToken,
  hashInvitationToken,
  invalidatePendingInvitations,
  readSubscriberLanguage,
  readTimestampMillis,
} from "../utils/collaboratorHelpers.js";

export interface HandleResendCollaboratorEmailInput {
  readonly callerUserId: string;
  readonly firestore: Firestore;
  readonly now: Date;
  readonly payload: unknown;
  readonly sendPasswordResetEmail: (
    email: string,
    userId: Nullable<string>,
  ) => Promise<void>;
}

/**
 * Reenvia el enlace de invitacion (colaborador `invited`) o el correo de
 * restablecimiento de contrasena (colaborador `active`), respetando un
 * enfriamiento de 60 segundos entre envios (KAN-84).
 */
export const handleResendCollaboratorEmail = async ({
  callerUserId,
  firestore,
  now,
  payload,
  sendPasswordResetEmail,
}: HandleResendCollaboratorEmailInput): Promise<ResendCollaboratorEmailResult> => {
  const { businessId, collaboratorId } = parseCallablePayload(
    resendCollaboratorEmailPayloadSchema,
    payload,
    COLLABORATOR_HANDLER_ERROR.INVALID_PAYLOAD,
  );

  const businessReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(businessId);
  const businessData = await assertBusinessIsActive(businessReference);

  const collaboratorReference = businessReference
    .collection(FIRESTORE_COLLECTION.COLLABORATORS)
    .doc(collaboratorId);
  const collaboratorSnapshot = await collaboratorReference.get();
  const collaboratorData =
    assertNonOwnerCollaboratorExists(collaboratorSnapshot);

  const status = String(collaboratorData.status ?? "");
  if (status === COLLABORATOR_STATUS.INACTIVE) {
    throw new CallableFailure(
      "failed-precondition",
      COLLABORATOR_HANDLER_ERROR.INVALID_STATUS_FOR_RESEND,
      { reason: COLLABORATOR_ERROR_REASON.INVALID_STATUS_FOR_RESEND },
    );
  }

  const lastSentMillis = readTimestampMillis(collaboratorData.lastEmailSentAt);
  if (lastSentMillis !== null) {
    const elapsedMs = now.getTime() - lastSentMillis;
    if (elapsedMs < COLLABORATOR_RULE_LIMIT.RESEND_COOLDOWN_MS) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(
          (COLLABORATOR_RULE_LIMIT.RESEND_COOLDOWN_MS - elapsedMs) /
            COLLABORATOR_RULE_LIMIT.MILLISECONDS_PER_SECOND,
        ),
      );
      throw new CallableFailure(
        "resource-exhausted",
        COLLABORATOR_HANDLER_ERROR.COOLDOWN_ACTIVE,
        {
          reason: COLLABORATOR_ERROR_REASON.COOLDOWN_ACTIVE,
          retryAfterSeconds,
        },
      );
    }
  }

  const email = String(collaboratorData.email ?? "").toLowerCase();

  if (status === COLLABORATOR_STATUS.INVITED) {
    const subscriberLanguage = await readSubscriberLanguage(
      firestore,
      callerUserId,
    );
    const invitationToken = generateInvitationToken();
    const tokenHash = hashInvitationToken(invitationToken);
    const invitationReference = firestore
      .collection(FIRESTORE_COLLECTION.COLLABORATOR_INVITATIONS)
      .doc(tokenHash);

    await firestore.runTransaction(async (transaction) => {
      await invalidatePendingInvitations(
        firestore,
        collaboratorId,
        now,
        transaction,
      );
      transaction.set(
        invitationReference,
        buildInvitationDocument({
          businessId,
          businessName: String(businessData.name ?? ""),
          collaboratorId,
          email,
          language: subscriberLanguage,
          now,
        }),
      );
      transaction.update(collaboratorReference, {
        lastEmailSentAt: now,
        updatedAt: now,
      });
    });

    return {
      collaboratorId,
      invitationToken,
      kind: COLLABORATOR_EMAIL_KIND.INVITATION,
    };
  }

  const linkedUserId =
    typeof collaboratorData.userId === "string"
      ? collaboratorData.userId
      : null;

  try {
    await sendPasswordResetEmail(email, linkedUserId);
  } catch {
    throw new CallableFailure(
      "unavailable",
      COLLABORATOR_HANDLER_ERROR.EMAIL_DISPATCH_FAILED,
      { reason: COLLABORATOR_ERROR_REASON.EMAIL_DISPATCH_FAILED },
    );
  }

  await collaboratorReference.update({
    lastEmailSentAt: now,
    updatedAt: now,
  });

  return {
    collaboratorId,
    kind: COLLABORATOR_EMAIL_KIND.PASSWORD_RESET,
  };
};
