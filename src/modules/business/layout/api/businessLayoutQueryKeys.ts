import type { QueryKey } from "@tanstack/react-query";
import { FIRESTORE_COLLECTION } from "@/constants";
import { BUSINESS_GATE_QUERY_SCOPE } from "../constants/BusinessGateState.constants";

export const businessLayoutQueryKeys = Object.freeze({
  collaboratorProfile: (businessId: string, collaboratorId: string) =>
    [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.COLLABORATORS,
      collaboratorId,
    ] as const,
  // Status gate of the portal (US-33): read again when the tab regains focus.
  gate: (businessId: string): QueryKey => [
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    BUSINESS_GATE_QUERY_SCOPE,
  ],
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
