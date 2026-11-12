import type { QueryKey } from "@tanstack/react-query";
import { FIRESTORE_COLLECTION } from "@/constants/firestore/FirestoreCollection.constants";
import type { SupportTicketsQueryParams } from "../models";

export const supportTicketsQueryKeys = Object.freeze({
  all: [FIRESTORE_COLLECTION.SUPPORT_TICKETS] as const,
  detail: (ticketId: string): QueryKey =>
    [FIRESTORE_COLLECTION.SUPPORT_TICKETS, "detail", ticketId] as const,
  list: (params: SupportTicketsQueryParams): QueryKey =>
    [
      FIRESTORE_COLLECTION.SUPPORT_TICKETS,
      "list",
      params.pageCursor?.id ?? null,
      params.pageSize ?? null,
      params.filters?.status ?? null,
    ] as const,
});
