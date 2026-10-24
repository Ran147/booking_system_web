import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services/firebase";
import { UserLanguageDocumentSchema } from "./UserLanguageDocument.schema";
import type { UserLanguagePreference } from "../models/UserLanguagePreference.model";

export const fetchUserLanguage = async (
  userId: string,
): Promise<UserLanguagePreference> => {
  const userSnapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.USERS, userId),
  );
  const parsedUserDocument = UserLanguageDocumentSchema.safeParse(
    userSnapshot.data(),
  );

  return parsedUserDocument.success
    ? parsedUserDocument.data
    : { language: null };
};
