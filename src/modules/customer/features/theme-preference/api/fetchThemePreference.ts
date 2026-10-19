import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION, type ThemeMode } from "@/constants";
import { firestore } from "@/services/firebase";
import type { Nullable } from "@/types";
import { parseUserTheme } from "../models/UserTheme.model";

export const fetchThemePreference = async (
  userId: string,
): Promise<Nullable<ThemeMode>> => {
  const snapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.USERS, userId),
  );
  return snapshot.exists() ? parseUserTheme(snapshot.data()) : null;
};
