import { FIRESTORE_COLLECTION } from "@/constants";

export const businessLayoutQueryKeys = Object.freeze({
  collaboratorProfile: (businessId: string, collaboratorId: string) =>
    [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.COLLABORATORS,
      collaboratorId,
    ] as const,
  planName: (planId: string) => [FIRESTORE_COLLECTION.PLANS, planId] as const,
  platformSettings: () =>
    [FIRESTORE_COLLECTION.PLATFORM_SETTINGS, "current"] as const,
  profile: (businessId: string) =>
    [FIRESTORE_COLLECTION.BUSINESSES, businessId, "layout-profile"] as const,
  subscription: (businessId: string) =>
    [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.SUBSCRIPTION,
      "current",
    ] as const,
});
