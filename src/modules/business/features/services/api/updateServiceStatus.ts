import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";
import type {
  UpdateServiceStatusPayload,
  UpdateServiceStatusResponse,
} from "../models/UpdateServiceStatus.mutation";

export const updateServiceStatus = async (
  payload: UpdateServiceStatusPayload,
): Promise<UpdateServiceStatusResponse> => {
  const { businessId, serviceId, status } = payload;
  const serviceDocumentReference = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.SERVICES,
    serviceId,
  );

  await updateDoc(serviceDocumentReference, {
    status,
    updatedAt: serverTimestamp(),
  });

  return {
    serviceId,
    status,
  };
};
