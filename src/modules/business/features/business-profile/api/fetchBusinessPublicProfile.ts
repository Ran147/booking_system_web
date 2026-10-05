import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import type { BusinessPublicProfile } from "@/domain";
import { firestore } from "@/services";
import { BusinessPublicProfileDocumentSchema } from "./BusinessPublicProfileDocument.schema";

export const fetchBusinessPublicProfile = async (
  businessId: string,
): Promise<BusinessPublicProfile> => {
  const documentSnapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.BUSINESSES, businessId),
  );

  if (!documentSnapshot.exists()) throw new Error("business-not-found");

  const profile = BusinessPublicProfileDocumentSchema.parse(
    documentSnapshot.data(),
  );

  return { id: documentSnapshot.id, ...profile };
};
