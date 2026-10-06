import { doc, getDoc } from "firebase/firestore";
import { z } from "zod";
import { FIRESTORE_COLLECTION, LANGUAGE, type Language } from "@/constants";
import { firestore } from "@/services/firebase";
import type { Nullable } from "@/types";

const languagePreferenceSchema = z.object({
  language: z.enum([LANGUAGE.EN, LANGUAGE.ES]).optional(),
});

export const fetchLanguagePreference = async (
  userId: string,
): Promise<Nullable<Language>> => {
  const snapshot = await getDoc(
    doc(firestore, FIRESTORE_COLLECTION.USERS, userId),
  );
  if (!snapshot.exists()) return null;

  return languagePreferenceSchema.parse(snapshot.data()).language ?? null;
};
