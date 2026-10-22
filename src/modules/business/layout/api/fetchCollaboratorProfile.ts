import { doc, getDoc } from "firebase/firestore";
import { z } from "zod";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";

export interface CollaboratorProfileData {
  readonly fullName: string;
}

const collaboratorProfileDocumentSchema = z.object({
  fullName: z.string().optional().default(""),
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
    };
  }

  const documentData = collaboratorProfileDocumentSchema.parse(
    documentSnapshot.data() ?? {},
  );

  return {
    fullName: documentData.fullName,
  };
};
