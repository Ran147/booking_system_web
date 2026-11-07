import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type Firestore,
} from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/constants/firestore/FirestoreCollection.constants";
import type { AuditLogEntry } from "@/domain";
import { firestore } from "@/services/firebase";
import type { CursorPage } from "@/types";
import { AUDIT_LOG_DEFAULT_PAGE_SIZE, AUDIT_LOG_FIELD } from "../constants";
import type { AuditLogQueryParams } from "../models";
import { mapAuditLogEntry } from "./AuditLogDocument.schema";

export const fetchAuditLogPage = async (
  params: AuditLogQueryParams = {},
  firestoreInstance: Firestore = firestore,
): Promise<CursorPage<AuditLogEntry>> => {
  const pageSize = params.pageSize ?? AUDIT_LOG_DEFAULT_PAGE_SIZE;
  const auditCollection = collection(
    firestoreInstance,
    FIRESTORE_COLLECTION.AUDIT_LOG,
  );

  const baseQuery = query(
    auditCollection,
    orderBy(AUDIT_LOG_FIELD.CREATED_AT, "desc"),
  );

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
