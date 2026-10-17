import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { BUSINESS_STATUS, type BusinessStatus } from "@/domain";
import { firestore } from "@/services/firebase";
import { DEFAULT_SERVICE_LIST_CURRENCY } from "../constants/ServiceList.constants";

export interface BusinessInfo {
  readonly currency: string;
  readonly status: BusinessStatus;
}

export const fetchBusinessInfo = async (
  businessId: string,
): Promise<BusinessInfo> => {
  const businessDocumentReference = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
  );
  const documentSnapshot = await getDoc(businessDocumentReference);

  if (!documentSnapshot.exists()) {
    return {
      currency: DEFAULT_SERVICE_LIST_CURRENCY,
      status: BUSINESS_STATUS.ACTIVE,
    };
  }

  const documentData = documentSnapshot.data();
  return {
    currency:
      (documentData.currency as string) ?? DEFAULT_SERVICE_LIST_CURRENCY,
    status: (documentData.status as BusinessStatus) ?? BUSINESS_STATUS.ACTIVE,
  };
};
