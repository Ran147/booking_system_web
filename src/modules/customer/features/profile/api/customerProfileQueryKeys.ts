import type { QueryKey } from "@tanstack/react-query";
import { FIRESTORE_COLLECTION } from "@/constants";

export const customerProfileQueryKeys = {
  detail: (userId: string): QueryKey =>
    [FIRESTORE_COLLECTION.USERS, userId] as const,
};
