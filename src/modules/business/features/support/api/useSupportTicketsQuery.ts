import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupportTicket } from "@/domain";
import { fetchSupportTickets } from "./fetchSupportTickets";
import { supportQueryKeys } from "./supportQueryKeys";

export const useSupportTicketsQuery = (
  businessId: string,
): UseQueryResult<SupportTicket[], Error> => {
  return useQuery({
    enabled: Boolean(businessId),
    queryFn: () => fetchSupportTickets(businessId),
    queryKey: supportQueryKeys.all(businessId),
  });
};
