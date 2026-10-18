import { FirebaseError } from "firebase/app";
import { doc, getDoc } from "firebase/firestore";
import { FIREBASE_ERROR_CODE, FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";
import { mapServiceDetail } from "./ServiceDocument.schema";
import type { ServiceDetail } from "../models";

export const fetchServiceDetail = async (
  businessId: string,
  serviceId: string,
): Promise<ServiceDetail> => {
  const documentReference = doc(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.SERVICES,
    serviceId,
  );

  const documentSnapshot = await getDoc(documentReference);

  if (!documentSnapshot.exists()) {
    throw new FirebaseError(
      FIREBASE_ERROR_CODE.FIRESTORE_NOT_FOUND,
      "Service not found",
    );
  }

  return mapServiceDetail(documentSnapshot);
};
