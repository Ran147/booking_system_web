import type { QueryKey } from "@tanstack/react-query";
import { FIRESTORE_COLLECTION } from "@/constants";

export const customerProfileQueryKeys = Object.freeze({
  detail: (userId: string): QueryKey =>
    [FIRESTORE_COLLECTION.USERS, userId] as const,
});
