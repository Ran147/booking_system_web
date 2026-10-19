import { doc, getDoc, updateDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";
import {
  alertSettingsDocumentSchema,
  type AlertSettings,
  type AlertSettingsDocument,
} from "../models/AlertSettings.schema";

export const alertSettingsQueryKey = (businessId: string) =>
  [FIRESTORE_COLLECTION.BUSINESSES, businessId, "alertSettings"] as const;

export const fetchAlertSettings = async (
  businessId: string,
): Promise<AlertSettingsDocument> => {
  const snapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.BUSINESSES, businessId),
  );
  return alertSettingsDocumentSchema.parse(
    snapshot.exists() ? snapshot.data() : {},
  );
};

export const updateAlertSettings = async (
  businessId: string,
  alertSettings: AlertSettings,
): Promise<void> => {
  await updateDoc(doc(firestore, FIRESTORE_COLLECTION.BUSINESSES, businessId), {
    alertSettings,
  });
};
