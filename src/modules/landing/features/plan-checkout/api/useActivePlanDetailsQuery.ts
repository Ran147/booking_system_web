import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { MutationError } from "@/shared/types";
import { fetchActivePlanDetails } from "./fetchActivePlanDetails";
import { planDetailQueryKeys } from "./planDetailQueryKeys";
import type { PlanDetail } from "../models/PlanDetail.interface";

export const useActivePlanDetailsQuery = (): UseQueryResult<
  PlanDetail[],
  MutationError
> =>
  useQuery<PlanDetail[], MutationError>({
    queryFn: fetchActivePlanDetails,
    queryKey: planDetailQueryKeys.active(),
  });
