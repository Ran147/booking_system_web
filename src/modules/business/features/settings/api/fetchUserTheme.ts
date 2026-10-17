import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services";
import { THEME_PREFERENCE_ERROR } from "../constants/ThemePreference.constants";
import type { UserThemePreference } from "../models";
import { UserThemeDocumentSchema } from "./UserThemeDocument.schema";

export const fetchUserTheme = async (
  userId: string,
): Promise<UserThemePreference> => {
  const documentSnapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.USERS, userId),
  );

  if (!documentSnapshot.exists()) {
    throw new Error(THEME_PREFERENCE_ERROR.USER_NOT_FOUND);
  }

  return UserThemeDocumentSchema.parse(documentSnapshot.data());
};
