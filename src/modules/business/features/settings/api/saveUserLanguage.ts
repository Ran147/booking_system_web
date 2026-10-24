import { doc, updateDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants";
import { firestore } from "@/services";
import type { SaveUserLanguageInput } from "../models";

export const saveUserLanguage = async ({
  language,
  userId,
}: SaveUserLanguageInput): Promise<void> => {
  await updateDoc(doc(firestore, FIRESTORE_COLLECTION.USERS, userId), {
    language,
  });
};
