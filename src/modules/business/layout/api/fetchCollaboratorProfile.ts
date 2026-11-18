import { doc, getDoc } from "firebase/firestore";
import { z } from "zod";
import { FIRESTORE_COLLECTION } from "@/constants";
import { COLLABORATOR_PERMISSION, type CollaboratorPermission } from "@/domain";
import { firestore } from "@/services/firebase";

const VALID_COLLABORATOR_PERMISSIONS = new Set<string>(
  Object.values(COLLABORATOR_PERMISSION),
);

const isCollaboratorPermission = (
  permission: string,
): permission is CollaboratorPermission =>
  VALID_COLLABORATOR_PERMISSIONS.has(permission);

export interface CollaboratorProfileData {
  readonly fullName: string;
  readonly permissions?: readonly CollaboratorPermission[];
}

const collaboratorProfileDocumentSchema = z.object({
  fullName: z.string().optional().default(""),
  permissions: z.array(z.string()).optional().default([]),
});

export const fetchCollaboratorProfile = async (
  businessId: string,
  collaboratorId: string,
): Promise<CollaboratorProfileData> => {
  const collaboratorDocumentReference = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.COLLABORATORS,
    collaboratorId,
  );
  const documentSnapshot = await getDoc(collaboratorDocumentReference);

  if (!documentSnapshot.exists()) {
    return {
      fullName: "",
      permissions: [],
    };
  }

  const documentData = collaboratorProfileDocumentSchema.parse(
    documentSnapshot.data() ?? {},
  );

  return {
    fullName: documentData.fullName,
    permissions: documentData.permissions.filter(isCollaboratorPermission),
  };
};
