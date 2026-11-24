import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
  fetchBusinessHours,
  type BusinessHoursResult,
} from "./fetchBusinessHours";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export const useBusinessHoursQuery = (
  businessId: string,
): UseQueryResult<BusinessHoursResult, Error> => {
  return useQuery({
    enabled: Boolean(businessId),
    queryFn: () => fetchBusinessHours(businessId),
    queryKey: scheduleQueryKeys.hours(businessId),
  });
};
