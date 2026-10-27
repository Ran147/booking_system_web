import { HttpsError } from "firebase-functions/v2/https";
import { COLLABORATOR_PERMISSION } from "./constants/CollaboratorPermission.constants.js";
import { COLLABORATOR_STATUS } from "./constants/CollaboratorStatus.constants.js";
import { FIRESTORE_COLLECTION } from "./constants/FirestoreCollection.constants.js";
import { USER_ROLE } from "./constants/UserRole.constants.js";
import { firestore } from "./firebaseAdmin.js";
import type { NullableUndefined } from "./types/Nullable.js";

interface CallerAuth {
  readonly token?: Record<string, unknown>;
  readonly uid?: string;
}

export const assertCanManageServices = async (
  auth: NullableUndefined<CallerAuth>,
  businessId: string,
): Promise<void> => {
  if (!auth) {
    throw new HttpsError("unauthenticated", "Unauthenticated request");
  }

  const role = auth.token?.role;
  const callerBusinessId = auth.token?.businessId ?? auth.token?.business_id;

  if (callerBusinessId !== businessId) {
    throw new HttpsError(
      "permission-denied",
      "Caller is not part of this business",
    );
  }

  if (role === USER_ROLE.SUBSCRIBER || role === USER_ROLE.BUSINESS_OWNER) {
    return;
  }

  if (
    role === USER_ROLE.COLLABORATOR &&
    typeof auth.token?.collaboratorId === "string"
  ) {
    const collaboratorSnapshot = await firestore
      .collection(FIRESTORE_COLLECTION.BUSINESSES)
      .doc(businessId)
      .collection(FIRESTORE_COLLECTION.COLLABORATORS)
      .doc(auth.token.collaboratorId)
      .get();

    const collaboratorData = collaboratorSnapshot.data();
    if (
      collaboratorData?.status === COLLABORATOR_STATUS.ACTIVE &&
      Array.isArray(collaboratorData?.permissions) &&
      collaboratorData.permissions.includes(
        COLLABORATOR_PERMISSION.MANAGE_SERVICES,
      )
    ) {
      return;
    }
  }

  throw new HttpsError(
    "permission-denied",
    "Caller does not have permission to manage services",
  );
};
