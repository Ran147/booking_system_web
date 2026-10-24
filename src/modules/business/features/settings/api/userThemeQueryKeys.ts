import { FIRESTORE_COLLECTION } from "@/constants";

export const userThemeQueryKeys = {
  detail: (userId: string): readonly [string, string, string] => [
    FIRESTORE_COLLECTION.USERS,
    userId,
    "theme",
  ],
} as const;
