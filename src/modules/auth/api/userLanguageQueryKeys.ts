import { FIRESTORE_COLLECTION } from "@/constants";

const USER_LANGUAGE_QUERY_KEY_ROOT = "language";

export const userLanguageQueryKeys = Object.freeze({
  detail: (userId: string): readonly [string, string, string] => [
    FIRESTORE_COLLECTION.USERS,
    userId,
    USER_LANGUAGE_QUERY_KEY_ROOT,
  ],
});
