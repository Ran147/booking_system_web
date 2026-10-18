import { FIRESTORE_COLLECTION } from "@/constants";
import { businessProfileQueryKeys } from "@/modules/business/features/business-profile";

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
  profile: (businessId: string) => businessProfileQueryKeys.detail(businessId),
  subscription: (businessId: string) =>
    [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.SUBSCRIPTION,
      "current",
    ] as const,
});
