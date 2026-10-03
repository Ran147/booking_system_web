import { FIRESTORE_COLLECTION } from "@/shared/constants";

export const planQueryKeys = {
  active: (): readonly [string, string] =>
    [FIRESTORE_COLLECTION.PLANS, "active"] as const,
  all: [FIRESTORE_COLLECTION.PLANS] as const,
};
