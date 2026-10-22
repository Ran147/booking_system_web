import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchActivePlans } from "./fetchActivePlans";
import { planQueryKeys } from "./planQueryKeys";
import type { Plan } from "../models/Plan.interface";

export const useActivePlansQuery = (): UseQueryResult<Plan[], Error> =>
  useQuery({
    queryFn: fetchActivePlans,
    queryKey: planQueryKeys.active(),
  });
