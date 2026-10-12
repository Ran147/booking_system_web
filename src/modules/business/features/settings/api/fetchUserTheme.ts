import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services";
import type { UserThemePreference } from "../models";
import { UserThemeDocumentSchema } from "./UserThemeDocument.schema";

export const fetchUserTheme = async (
  userId: string,
): Promise<UserThemePreference> => {
  const documentSnapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.USERS, userId),
  );

  if (!documentSnapshot.exists()) throw new Error("user-not-found");

  return UserThemeDocumentSchema.parse(documentSnapshot.data());
};
