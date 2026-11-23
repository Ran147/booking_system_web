import { CUSTOMER_PROFILE_QUERY, FIRESTORE_COLLECTION } from "@/constants";

export const customerPersonalProfileQueryKeys = Object.freeze({
  detail: (userId: string): readonly [string, string, string] => [
    FIRESTORE_COLLECTION.USERS,
    userId,
    CUSTOMER_PROFILE_QUERY.DETAIL,
  ],
});
