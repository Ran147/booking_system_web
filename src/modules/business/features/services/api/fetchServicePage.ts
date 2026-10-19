import {
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
  type QueryConstraint,
} from "firebase/firestore";
import {
  FIRESTORE_COLLECTION,
  FIRESTORE_OPERATOR,
  FIRESTORE_QUERY,
} from "@/constants";
import { firestore } from "@/services/firebase";
import type { CursorPage } from "@/types";
import { normalizeSearchTerm } from "@/utils/normalizeSearchTerm";
import { mapServiceListItem } from "./ServiceDocument.schema";
import { SERVICE_FIELD } from "../constants/ServiceField.constants";
import type { ServiceListItem } from "../models/ServiceListItem.interface";
import type { ServiceListQueryParams } from "../models/ServiceListQueryParams.interface";

export const fetchServicePage = async ({
  businessId,
  filters,
  pageCursor,
  pageSize,
}: ServiceListQueryParams): Promise<CursorPage<ServiceListItem>> => {
  const filterConstraints: QueryConstraint[] = [];
  const normalizedSearchTerm = normalizeSearchTerm(filters.searchTerm);

  if (filters.status) {
    filterConstraints.push(
      where(SERVICE_FIELD.STATUS, FIRESTORE_OPERATOR.EQUAL, filters.status),
    );
  }

  if (normalizedSearchTerm) {
    filterConstraints.push(
      where(
        SERVICE_FIELD.SEARCH_NAME,
        FIRESTORE_OPERATOR.GREATER_OR_EQUAL,
        normalizedSearchTerm,
      ),
      where(
        SERVICE_FIELD.SEARCH_NAME,
        FIRESTORE_OPERATOR.LESS_OR_EQUAL,
        normalizedSearchTerm + FIRESTORE_QUERY.PREFIX_UPPER_BOUND,
      ),
    );
  }

  const servicesCollectionReference = collection(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.SERVICES,
  );

  const filteredQuery = query(
    servicesCollectionReference,
    ...filterConstraints,
    orderBy(SERVICE_FIELD.SEARCH_NAME),
  );

  const pageQuery = pageCursor
    ? query(filteredQuery, startAfter(pageCursor), limit(pageSize))
    : query(filteredQuery, limit(pageSize));

  const [pageSnapshot, countSnapshot] = await Promise.all([
    getDocs(pageQuery),
    getCountFromServer(filteredQuery),
  ]);

  const hasMorePages = pageSnapshot.docs.length === pageSize;
  const lastDocument = pageSnapshot.docs.at(-1) ?? null;

  return {
    items: pageSnapshot.docs.map(mapServiceListItem),
    nextCursor: hasMorePages ? lastDocument : null,
    totalCount: countSnapshot.data().count,
  };
};
