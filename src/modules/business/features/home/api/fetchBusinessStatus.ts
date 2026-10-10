import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { BUSINESS_STATUS, type BusinessStatus } from "@/domain";
import { firestore } from "@/services/firebase";

export const fetchBusinessStatus = async (
  businessId: string,
): Promise<BusinessStatus> => {
  const businessDocumentReference = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
  );
  const documentSnapshot = await getDoc(businessDocumentReference);

  if (!documentSnapshot.exists()) {
    return BUSINESS_STATUS.ACTIVE;
  }

  const documentData = documentSnapshot.data();
  return (documentData.status as BusinessStatus) ?? BUSINESS_STATUS.ACTIVE;
};
