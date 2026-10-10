import { FIRESTORE_COLLECTION } from "@/shared/constants";

// Not the catalog's key: the catalog query falls back to sample plans.
export const planDetailQueryKeys = {
  active: (): readonly [string, string, string] =>
    [FIRESTORE_COLLECTION.PLANS, "detail", "active"] as const,
};
