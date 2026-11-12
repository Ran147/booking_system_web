import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION, type ThemeMode } from "@/constants";
import { firestore } from "@/services/firebase";

export interface UpdateThemePreferencePayload {
  themeMode: ThemeMode;
  userId: string;
}

export const updateThemePreference = async ({
  themeMode,
  userId,
}: UpdateThemePreferencePayload): Promise<void> => {
  await updateDoc(doc(firestore, FIRESTORE_COLLECTION.USERS, userId), {
    theme: themeMode,
    updatedAt: serverTimestamp(),
  });
};
