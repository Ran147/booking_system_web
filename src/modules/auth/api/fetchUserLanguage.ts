import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION, type Language } from "@/constants";
import { firestore } from "@/services/firebase";
import type { Nullable } from "@/types";
import { UserLanguageDocumentSchema } from "./UserLanguageDocument.schema";

export const fetchUserLanguage = async (
  userId: string,
): Promise<Nullable<Language>> => {
  const userSnapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.USERS, userId),
  );
  const parsedUserDocument = UserLanguageDocumentSchema.safeParse(
    userSnapshot.data(),
  );

  return parsedUserDocument.success
    ? (parsedUserDocument.data.language ?? null)
    : null;
};
