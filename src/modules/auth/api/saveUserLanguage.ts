import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services";
import type { SaveUserLanguageInput } from "../models/UserLanguagePreference.model";

export const saveUserLanguage = async ({
  includeUpdatedAt = false,
  language,
  userId,
}: SaveUserLanguageInput): Promise<void> => {
  await updateDoc(doc(firestore, FIRESTORE_COLLECTION.USERS, userId), {
    language,
    ...(includeUpdatedAt ? { updatedAt: serverTimestamp() } : {}),
  });
};
