import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { AuditLogEntry } from "@/domain";
import type { CursorPage } from "@/types";
import type { AuditLogQueryParams } from "../models";
import { auditLogQueryKeys } from "./auditLogQueryKeys";
import { fetchAuditLogPage } from "./fetchAuditLogPage";

export const useAuditLogEntriesQuery = (
  params: AuditLogQueryParams = {},
  options?: { readonly enabled?: boolean },
): UseQueryResult<CursorPage<AuditLogEntry>, Error> =>
  useQuery({
    enabled: options?.enabled ?? true,
    queryFn: () => fetchAuditLogPage(params),
    queryKey: auditLogQueryKeys.list(params),
  });
