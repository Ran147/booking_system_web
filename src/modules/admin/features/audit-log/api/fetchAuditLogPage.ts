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
import type { AuditLogEntry } from "@/domain";
import { firestore } from "@/services/firebase";
import type { CursorPage } from "@/types";
import { AUDIT_LOG_DEFAULT_PAGE_SIZE, AUDIT_LOG_FIELD } from "../constants";
import type { AuditLogQueryParams } from "../models";
import { isAuditLogDateRangeInvalid, zonedDayBounds } from "../utils";
import { mapAuditLogEntry } from "./AuditLogDocument.schema";

const DEFAULT_TIME_ZONE = "UTC";

export const fetchAuditLogPage = async (
  params: AuditLogQueryParams = {},
  firestoreInstance: Firestore = firestore,
): Promise<CursorPage<AuditLogEntry>> => {
  if (
    isAuditLogDateRangeInvalid(
      params.filters?.from ?? null,
      params.filters?.to ?? null,
    )
  ) {
    return {
      items: [],
      nextCursor: null,
      totalCount: 0,
    };
  }

  const pageSize = params.pageSize ?? AUDIT_LOG_DEFAULT_PAGE_SIZE;
  const timeZone =
    params.timeZone ??
    Intl.DateTimeFormat().resolvedOptions().timeZone ??
    DEFAULT_TIME_ZONE;

  const constraints: QueryConstraint[] = [];

  if (params.filters?.actionType) {
    constraints.push(
      where(
        AUDIT_LOG_FIELD.ACTION_TYPE,
        FIRESTORE_OPERATOR.EQUAL,
        params.filters.actionType,
      ),
    );
  }

  if (params.filters?.from) {
    const { start } = zonedDayBounds(params.filters.from, timeZone);
    constraints.push(
      where(
        AUDIT_LOG_FIELD.CREATED_AT,
        FIRESTORE_OPERATOR.GREATER_OR_EQUAL,
        start,
      ),
    );
  }

  if (params.filters?.to) {
    const { end } = zonedDayBounds(params.filters.to, timeZone);
    constraints.push(
      where(AUDIT_LOG_FIELD.CREATED_AT, FIRESTORE_OPERATOR.LESS_OR_EQUAL, end),
    );
  }

  constraints.push(
    orderBy(AUDIT_LOG_FIELD.CREATED_AT, FIRESTORE_ORDER.DESCENDING),
  );

  const auditCollection = collection(
    firestoreInstance,
    FIRESTORE_COLLECTION.AUDIT_LOG,
  );
  const baseQuery = query(auditCollection, ...constraints);

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
    items: pageDocs.map(mapAuditLogEntry),
    nextCursor: hasMorePages ? (pageDocs.at(-1) ?? null) : null,
    totalCount: countSnapshot.data().count,
  };
};
