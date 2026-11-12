import { FIRESTORE_COLLECTION } from "@/constants";

export const themePreferenceQueryKeys = Object.freeze({
  detail: (userId: string): readonly [string, string, string] =>
    Object.freeze([FIRESTORE_COLLECTION.USERS, userId, "theme"] as const),
});
