import type { QueryKey } from "@tanstack/react-query";
import { FIRESTORE_COLLECTION } from "@/constants";
import { BUSINESS_GATE_QUERY_SCOPE } from "../constants/BusinessGateState.constants";

export const businessLayoutQueryKeys = Object.freeze({
  gate: (businessId: string): QueryKey => [
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    BUSINESS_GATE_QUERY_SCOPE,
  ],
});
