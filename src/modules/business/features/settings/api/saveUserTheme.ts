import { doc, updateDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services";
import type { SaveUserThemeInput } from "../models";

export const saveUserTheme = async ({
  theme,
  userId,
}: SaveUserThemeInput): Promise<void> => {
  await updateDoc(doc(firestore, FIRESTORE_COLLECTION.USERS, userId), {
    theme,
  });
};
