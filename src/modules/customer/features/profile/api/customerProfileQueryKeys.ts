import { FIRESTORE_COLLECTION } from "@/constants";

export const customerProfileQueryKeys = {
  detail: (userId: string) =>
    [FIRESTORE_COLLECTION.USERS, userId, "profile"] as const,
} as const;
