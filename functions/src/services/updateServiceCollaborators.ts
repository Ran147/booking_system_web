import { HttpsError, onCall } from "firebase-functions/v2/https";
import {
  UPDATE_SERVICE_COLLABORATORS_ERROR,
  UPDATE_SERVICE_COLLABORATORS_ERROR_REASON,
} from "./constants/UpdateServiceCollaboratorsError.constants.js";
import type {
  UpdateServiceCollaboratorsPayload,
  UpdateServiceCollaboratorsResponse,
} from "./models/UpdateServiceCollaborators.mutation.js";
import { updateServiceCollaboratorsPayloadSchema } from "./models/UpdateServiceCollaborators.schema.js";
import { assertCanManageServices } from "../shared/assertCanManageServices.js";
import { BUSINESS_STATUS } from "../shared/constants/BusinessStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { firestore } from "../shared/firebaseAdmin.js";
import { readPayload } from "../shared/readPayload.js";

export const updateServiceCollaborators = onCall<
  UpdateServiceCollaboratorsPayload,
  Promise<UpdateServiceCollaboratorsResponse>
>(async (request) => {
  const { businessId, collaboratorIds, collaboratorSelection, serviceId } =
    readPayload(
      updateServiceCollaboratorsPayloadSchema,
      request.data,
      UPDATE_SERVICE_COLLABORATORS_ERROR.INVALID_PAYLOAD,
    );

  await assertCanManageServices(request.auth, businessId);

  const businessReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(businessId);
  const serviceReference = businessReference
    .collection(FIRESTORE_COLLECTION.SERVICES)
    .doc(serviceId);

  const businessSnapshot = await businessReference.get();
  if (
    !businessSnapshot.exists ||
    businessSnapshot.data()?.status !== BUSINESS_STATUS.ACTIVE
  ) {
    throw new HttpsError("failed-precondition", "business:errors.readOnly", {
      reason: UPDATE_SERVICE_COLLABORATORS_ERROR_REASON.READ_ONLY,
    });
  }

  return firestore.runTransaction(async (transaction) => {
    const serviceSnapshot = await transaction.get(serviceReference);
    if (!serviceSnapshot.exists) {
      throw new HttpsError(
        "not-found",
        UPDATE_SERVICE_COLLABORATORS_ERROR.NOT_FOUND,
      );
    }

    const collaboratorsQuery = businessReference.collection(
      FIRESTORE_COLLECTION.COLLABORATORS,
    );
    const collaboratorsSnapshot = await transaction.get(collaboratorsQuery);

    const existingCollaboratorIds = new Set(
      collaboratorsSnapshot.docs.map((collaboratorDoc) => collaboratorDoc.id),
    );
    const hasUnknownCollaborator = collaboratorIds.some(
      (collaboratorId) => !existingCollaboratorIds.has(collaboratorId),
    );
    if (hasUnknownCollaborator) {
      throw new HttpsError(
        "invalid-argument",
        UPDATE_SERVICE_COLLABORATORS_ERROR.INVALID_PAYLOAD,
      );
    }

    const effectiveSelection =
      collaboratorIds.length === 0
        ? null
        : (collaboratorSelection ?? "customer_choice");

    transaction.update(serviceReference, {
      collaboratorSelection: effectiveSelection,
    });

    collaboratorsSnapshot.forEach((collaboratorDoc) => {
      const collaboratorData = collaboratorDoc.data();
      const currentServiceIds: string[] = Array.isArray(
        collaboratorData.serviceIds,
      )
        ? collaboratorData.serviceIds
        : [];

      const shouldBeAssigned = collaboratorIds.includes(collaboratorDoc.id);
      const isCurrentlyAssigned = currentServiceIds.includes(serviceId);

      if (shouldBeAssigned && !isCurrentlyAssigned) {
        transaction.update(collaboratorDoc.ref, {
          serviceIds: [...currentServiceIds, serviceId],
        });
      } else if (!shouldBeAssigned && isCurrentlyAssigned) {
        transaction.update(collaboratorDoc.ref, {
          serviceIds: currentServiceIds.filter((id) => id !== serviceId),
        });
      }
    });

    return { updatedServiceId: serviceId };
  });
});
