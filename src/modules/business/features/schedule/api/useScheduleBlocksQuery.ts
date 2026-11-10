import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ScheduleBlock } from "../models";
import { fetchScheduleBlocks } from "./fetchScheduleBlocks";
import { scheduleQueryKeys } from "./scheduleQueryKeys";

export const useScheduleBlocksQuery = (
  businessId: string,
): UseQueryResult<ScheduleBlock[], Error> => {
  return useQuery({
    enabled: Boolean(businessId),
    queryFn: () => fetchScheduleBlocks(businessId),
    queryKey: scheduleQueryKeys.blocks(businessId),
  });
};
