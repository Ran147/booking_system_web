import { FIRESTORE_COLLECTION } from "@/constants";

export const userLanguageQueryKeys = {
  detail: (userId: string): readonly [string, string] => [
    FIRESTORE_COLLECTION.USERS,
    userId,
  ],
} as const;
