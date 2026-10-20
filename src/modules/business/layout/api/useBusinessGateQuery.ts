import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { businessLayoutQueryKeys } from "./businessLayoutQueryKeys";
import { fetchBusinessGate } from "./fetchBusinessGate";
import type { BusinessGate } from "../models/businessStatusGate.model";

// Read again when the tab regains focus, so an approval by the super admin
// shows up without signing in again (AC-KAN-33-10, D-3). No realtime listener.
export const useBusinessGateQuery = (
  businessId: string,
): UseQueryResult<BusinessGate, Error> =>
  useQuery({
    queryFn: () => fetchBusinessGate(businessId),
    queryKey: businessLayoutQueryKeys.gate(businessId),
    refetchOnWindowFocus: true,
  });
