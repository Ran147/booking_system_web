import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type Firestore,
  type QueryConstraint,
} from "firebase/firestore";
import {
  FIRESTORE_COLLECTION,
  FIRESTORE_OPERATOR,
  FIRESTORE_ORDER,
} from "@/constants";
import type { SupportTicket } from "@/domain";
import { firestore } from "@/services/firebase";
import type { CursorPage } from "@/types";
import {
  SUPPORT_TICKET_DEFAULT_PAGE_SIZE,
  SUPPORT_TICKET_FIELD,
} from "../constants";
import type { SupportTicketsQueryParams } from "../models";
import { mapSupportTicket } from "./SupportTicketDocument.schema";

export const fetchSupportTicketsPage = async (
  params: SupportTicketsQueryParams = {},
  firestoreInstance: Firestore = firestore,
): Promise<CursorPage<SupportTicket>> => {
  const pageSize = params.pageSize ?? SUPPORT_TICKET_DEFAULT_PAGE_SIZE;

  const constraints: QueryConstraint[] = [];

  if (params.filters?.status) {
    constraints.push(
      where(
        SUPPORT_TICKET_FIELD.STATUS,
        FIRESTORE_OPERATOR.EQUAL,
        params.filters.status,
      ),
    );
  }

  constraints.push(
    orderBy(SUPPORT_TICKET_FIELD.CREATED_AT, FIRESTORE_ORDER.DESCENDING),
  );

  const ticketCollection = collection(
    firestoreInstance,
    FIRESTORE_COLLECTION.SUPPORT_TICKETS,
  );
  const baseQuery = query(ticketCollection, ...constraints);

  const pageQuery = params.pageCursor
    ? query(baseQuery, startAfter(params.pageCursor), limit(pageSize + 1))
    : query(baseQuery, limit(pageSize + 1));

  const [pageSnapshot, countSnapshot] = await Promise.all([
    getDocs(pageQuery),
    getCountFromServer(baseQuery),
  ]);

  const hasMorePages = pageSnapshot.docs.length > pageSize;
  const pageDocs = pageSnapshot.docs.slice(0, pageSize);

  return {
    items: pageDocs.map(mapSupportTicket),
    nextCursor: hasMorePages ? (pageDocs.at(-1) ?? null) : null,
    totalCount: countSnapshot.data().count,
  };
};
