import type { QueryKey } from "@tanstack/react-query";
import { FIRESTORE_COLLECTION } from "@/constants/firestore/FirestoreCollection.constants";
import type { AuditLogQueryParams } from "../models";

export const auditLogQueryKeys = Object.freeze({
  all: [FIRESTORE_COLLECTION.AUDIT_LOG] as const,
  list: (params: AuditLogQueryParams): QueryKey =>
    [
      FIRESTORE_COLLECTION.AUDIT_LOG,
      "list",
      params.pageCursor?.id ?? null,
      params.pageSize ?? null,
      params.filters?.actionType ?? null,
      params.filters?.from ?? null,
      params.filters?.to ?? null,
      params.timeZone ?? null,
    ] as const,
});
