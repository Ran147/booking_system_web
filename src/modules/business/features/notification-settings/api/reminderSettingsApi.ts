import { doc, getDoc, updateDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";
import {
  reminderSettingsDocumentSchema,
  reminderSettingsSchema,
  type ReminderSettings,
  type ReminderSettingsDocument,
} from "../models/ReminderSettings.schema";

export const reminderSettingsQueryKey = (businessId: string) =>
  [FIRESTORE_COLLECTION.BUSINESSES, businessId, "reminderSettings"] as const;

export const fetchReminderSettings = async (
  businessId: string,
): Promise<ReminderSettingsDocument> => {
  const snapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.BUSINESSES, businessId),
  );
  if (!snapshot.exists()) throw new Error("Business not found");
  return reminderSettingsDocumentSchema.parse(snapshot.data());
};

export const saveReminderSettings = async (
  businessId: string,
  settings: ReminderSettings,
): Promise<void> => {
  const validatedSettings = reminderSettingsSchema.parse(settings);
  await updateDoc(doc(firestore, FIRESTORE_COLLECTION.BUSINESSES, businessId), {
    reminderSettings: validatedSettings,
  });
};
