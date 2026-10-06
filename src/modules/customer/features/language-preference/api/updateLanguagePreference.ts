import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";
import type { UpdateLanguagePreferencePayload } from "../models";

export const updateLanguagePreference = async ({
  language,
  userId,
}: UpdateLanguagePreferencePayload): Promise<void> => {
  await updateDoc(doc(firestore, FIRESTORE_COLLECTION.USERS, userId), {
    language,
    updatedAt: serverTimestamp(),
  });
};
