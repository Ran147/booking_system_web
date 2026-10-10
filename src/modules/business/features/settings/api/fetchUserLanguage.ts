import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services";
import type { UserLanguagePreference } from "../models";
import { UserLanguageDocumentSchema } from "./UserLanguageDocument.schema";

export const fetchUserLanguage = async (
  userId: string,
): Promise<UserLanguagePreference> => {
  const documentSnapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.USERS, userId),
  );

  if (!documentSnapshot.exists()) throw new Error("user-not-found");

  return UserLanguageDocumentSchema.parse(documentSnapshot.data());
};
