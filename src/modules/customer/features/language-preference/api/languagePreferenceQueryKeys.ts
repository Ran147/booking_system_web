import { FIRESTORE_COLLECTION } from "@/constants";

export const languagePreferenceQueryKeys = {
  detail: (userId: string) =>
    [FIRESTORE_COLLECTION.USERS, userId, "language"] as const,
} as const;
