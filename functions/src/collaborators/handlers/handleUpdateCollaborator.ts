import type { Auth } from "firebase-admin/auth";
import type { Firestore } from "firebase-admin/firestore";
import { readFirestoreDate } from "../../bookings/availability/utils/readFirestoreDate.js";
import { CallableFailure } from "../../shared/CallableFailure.js";
import { BOOKING_STATUS } from "../../shared/constants/BookingStatus.constants.js";
import { COLLABORATOR_STATUS } from "../../shared/constants/CollaboratorStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../../shared/constants/FirestoreCollection.constants.js";
import { parseCallablePayload } from "../../shared/parseCallablePayload.js";
import type { Nullable } from "../../shared/types/Nullable.js";
import {
  COLLABORATOR_ERROR_REASON,
  COLLABORATOR_HANDLER_ERROR,
} from "../constants/CollaboratorHandler.constants.js";
import {
  updateCollaboratorPayloadSchema,
  type UpdateCollaboratorResult,
} from "../models/CollaboratorHandlers.model.js";
import {
  assertBusinessIsActive,
  assertNonOwnerCollaboratorExists,
  assertServicesAreActive,
  buildInvitationDocument,
  deduplicateStrings,
  generateInvitationToken,
  hashInvitationToken,
  invalidatePendingInvitations,
  isAuthEmailTaken,
  normalizeSearchTerm,
  readSubscriberLanguage,
  readTimestampMillis,
} from "../utils/collaboratorHelpers.js";

export interface HandleUpdateCollaboratorInput {
  readonly auth: Auth;
  readonly callerUserId: string;
  readonly firestore: Firestore;
  readonly now: Date;
  readonly payload: unknown;
}

/**
 * Actualiza datos y servicios de un colaborador; controla concurrencia optimista,
 * permite cambiar el correo solo mientras esta `invited` y cuenta reservas
 * futuras afectadas al retirar servicios (KAN-80).
 */
export const handleUpdateCollaborator = async ({
  auth,
  callerUserId,
  firestore,
  now,
  payload,
}: HandleUpdateCollaboratorInput): Promise<UpdateCollaboratorResult> => {
  const {
    businessId,
    collaboratorId,
    email,
    expectedUpdatedAt,
    fullName,
    phone,
    serviceIds,
    specialty,
  } = parseCallablePayload(
    updateCollaboratorPayloadSchema,
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
  const precheckSnapshot = await collaboratorReference.get();
  const precheckData = assertNonOwnerCollaboratorExists(precheckSnapshot);
  const currentEmail = String(precheckData.email ?? "").toLowerCase();
  const isEmailChanged = Boolean(email && email !== currentEmail);

  if (isEmailChanged && email) {
    if (precheckData.status !== COLLABORATOR_STATUS.INVITED) {
      throw new CallableFailure(
        "failed-precondition",
        COLLABORATOR_HANDLER_ERROR.INVALID_EMAIL_CHANGE_STATUS,
        { reason: COLLABORATOR_ERROR_REASON.INVALID_EMAIL_CHANGE_STATUS },
      );
    }
    if (await isAuthEmailTaken(auth, email)) {
      throw new CallableFailure(
        "already-exists",
        COLLABORATOR_HANDLER_ERROR.EMAIL_ALREADY_IN_USE,
        { reason: COLLABORATOR_ERROR_REASON.EMAIL_ALREADY_IN_USE },
      );
    }
  }

  const uniqueServiceIds = deduplicateStrings(serviceIds);
  const subscriberLanguage = isEmailChanged
    ? await readSubscriberLanguage(firestore, callerUserId)
    : null;
  const newInvitationToken = isEmailChanged ? generateInvitationToken() : null;
  const newTokenHash = newInvitationToken
    ? hashInvitationToken(newInvitationToken)
    : null;

  const upcomingAffectedBookingsCount = await firestore.runTransaction(
    async (transaction) => {
      const collaboratorSnapshot = await transaction.get(collaboratorReference);
      const collaboratorData =
        assertNonOwnerCollaboratorExists(collaboratorSnapshot);

      if (expectedUpdatedAt) {
        const expectedMillis = Date.parse(expectedUpdatedAt);
        const actualMillis = readTimestampMillis(collaboratorData.updatedAt);
        if (
          !Number.isNaN(expectedMillis) &&
          actualMillis !== null &&
          actualMillis !== expectedMillis
        ) {
          throw new CallableFailure(
            "aborted",
            COLLABORATOR_HANDLER_ERROR.CONCURRENT_MODIFICATION,
            { reason: COLLABORATOR_ERROR_REASON.CONCURRENT_MODIFICATION },
          );
        }
      }

      const previousEmail = String(collaboratorData.email ?? "").toLowerCase();
      const willChangeEmail = Boolean(email && email !== previousEmail);

      if (willChangeEmail && email) {
        if (collaboratorData.status !== COLLABORATOR_STATUS.INVITED) {
          throw new CallableFailure(
            "failed-precondition",
            COLLABORATOR_HANDLER_ERROR.INVALID_EMAIL_CHANGE_STATUS,
            { reason: COLLABORATOR_ERROR_REASON.INVALID_EMAIL_CHANGE_STATUS },
          );
        }

        const collaboratorsSnapshot = await transaction.get(
          collaboratorsCollection,
        );
        const hasDuplicateEmail = collaboratorsSnapshot.docs.some(
          (candidateDocument) => {
            if (candidateDocument.id === collaboratorId) {
              return false;
            }
            const candidateData = candidateDocument.data();
            if (candidateData.is_owner) {
              return false;
            }
            return (
              String(candidateData.email ?? "").toLowerCase() === email
            );
          },
        );
        if (hasDuplicateEmail) {
          throw new CallableFailure(
            "already-exists",
            COLLABORATOR_HANDLER_ERROR.EMAIL_ALREADY_IN_USE,
            { reason: COLLABORATOR_ERROR_REASON.EMAIL_ALREADY_IN_USE },
          );
        }
      }

      await assertServicesAreActive(
        businessReference,
        uniqueServiceIds,
        transaction,
      );

      const previousServiceIds: string[] = Array.isArray(
        collaboratorData.serviceIds,
      )
        ? (collaboratorData.serviceIds as string[])
        : [];
      const removedServiceIds = previousServiceIds.filter(
        (previousServiceId) => !uniqueServiceIds.includes(previousServiceId),
      );

      let affectedCount = 0;
      if (removedServiceIds.length > 0) {
        const activeBookingsQuery = businessReference
          .collection(FIRESTORE_COLLECTION.BOOKINGS)
          .where("collaboratorId", "==", collaboratorId)
          .where("status", "in", [
            BOOKING_STATUS.PENDING,
            BOOKING_STATUS.CONFIRMED,
          ]);
        const activeBookingsSnapshot =
          await transaction.get(activeBookingsQuery);
        affectedCount = activeBookingsSnapshot.docs.filter(
          (bookingDocument) => {
            const bookingData = bookingDocument.data();
            const startsAt = readFirestoreDate(bookingData.startsAt);
            return (
              startsAt.getTime() > now.getTime() &&
              removedServiceIds.includes(String(bookingData.serviceId ?? ""))
            );
          },
        ).length;
      }

      if (willChangeEmail && email && newTokenHash && subscriberLanguage) {
        await invalidatePendingInvitations(
          firestore,
          collaboratorId,
          now,
          transaction,
        );
        const invitationReference = firestore
          .collection(FIRESTORE_COLLECTION.COLLABORATOR_INVITATIONS)
          .doc(newTokenHash);
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
      }

      const updateFields: Record<string, unknown> = {
        fullName,
        phone,
        searchName: normalizeSearchTerm(fullName),
        serviceIds: uniqueServiceIds,
        specialty,
        updatedAt: now,
      };
      if (willChangeEmail && email) {
        updateFields.email = email;
        updateFields.lastEmailSentAt = now;
      }

      transaction.update(collaboratorReference, updateFields);
      return affectedCount;
    },
  );

  const responsePayload: {
    readonly collaboratorId: string;
    readonly emailChanged: boolean;
    readonly invitationToken?: Nullable<string>;
    readonly upcomingAffectedBookingsCount: number;
  } = {
    collaboratorId,
    emailChanged: isEmailChanged,
    ...(isEmailChanged ? { invitationToken: newInvitationToken } : {}),
    upcomingAffectedBookingsCount,
  };

  return responsePayload;
};
