import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { SupportTicket } from "@/domain";
import type { CursorPage } from "@/types";
import type { SupportTicketsQueryParams } from "../models";
import { fetchSupportTicketsPage } from "./fetchSupportTicketsPage";
import { supportTicketsQueryKeys } from "./supportTicketsQueryKeys";

export const useSupportTicketsQuery = (
  params: SupportTicketsQueryParams = {},
  options?: { readonly enabled?: boolean },
): UseQueryResult<CursorPage<SupportTicket>, Error> =>
  useQuery({
    enabled: options?.enabled ?? true,
    queryFn: () => fetchSupportTicketsPage(params),
    queryKey: supportTicketsQueryKeys.list(params),
  });
