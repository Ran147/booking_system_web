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
import { normalizeSearchTerm } from "@/utils";
import {
  collaboratorDocumentSchema,
  mapCollaboratorListItem,
} from "./CollaboratorDocument.schema";
import { COLLABORATOR_FIELD } from "../constants/CollaboratorFeature.constants";
import type {
  CollaboratorListItem,
  CollaboratorListQueryParams,
} from "../models";

export const fetchCollaboratorListPage = async ({
  businessId,
  filters,
  pageCursor,
  pageSize,
}: CollaboratorListQueryParams): Promise<CursorPage<CollaboratorListItem>> => {
  const normalizedSearchTerm = normalizeSearchTerm(filters.searchTerm);
  const collaboratorsCollection = collection(
    firestore,
    FIRESTORE_COLLECTION.BUSINESSES,
    businessId,
    FIRESTORE_COLLECTION.COLLABORATORS,
  );

  const filterConstraints: QueryConstraint[] = [];
  if (filters.status) {
    filterConstraints.push(
      where(
        COLLABORATOR_FIELD.STATUS,
        FIRESTORE_OPERATOR.EQUAL,
        filters.status,
      ),
    );
  }

  // When searching by email or substring, use full client-side match on the
  // business collaborator set so both name and email searches work reliably (AS-2).
  if (!normalizedSearchTerm) {
    const filteredQuery = query(
      collaboratorsCollection,
      ...filterConstraints,
      orderBy(COLLABORATOR_FIELD.FULL_NAME),
    );
    const pageQuery = pageCursor
      ? query(filteredQuery, startAfter(pageCursor), limit(pageSize))
      : query(filteredQuery, limit(pageSize));

    try {
      const [pageSnapshot, countSnapshot] = await Promise.all([
        getDocs(pageQuery),
        getCountFromServer(filteredQuery),
      ]);

      const filteredDocs = pageSnapshot.docs.filter(
        (docSnapshot) =>
          !collaboratorDocumentSchema.parse(docSnapshot.data() ?? {}).is_owner,
      );
      const ownerExcludedOffset =
        pageSnapshot.docs.length - filteredDocs.length;
      const hasMorePages = pageSnapshot.docs.length === pageSize;
      const lastDocument = pageSnapshot.docs.at(-1) ?? null;

      return {
        items: filteredDocs.map(mapCollaboratorListItem),
        nextCursor: hasMorePages ? lastDocument : null,
        totalCount: Math.max(
          0,
          countSnapshot.data().count - ownerExcludedOffset,
        ),
      };
    } catch {
      // Fall back to in-memory filter/sort when composite index is not deployed locally.
    }
  }

  const allSnapshot = await getDocs(collaboratorsCollection);
  const nonOwnerItems = allSnapshot.docs
    .filter(
      (docSnapshot) =>
        !collaboratorDocumentSchema.parse(docSnapshot.data() ?? {}).is_owner,
    )
    .map(mapCollaboratorListItem);

  const filteredItems = nonOwnerItems.filter((item) => {
    if (filters.status && item.status !== filters.status) {
      return false;
    }
    if (normalizedSearchTerm) {
      const normalizedName = normalizeSearchTerm(item.fullName);
      const normalizedEmail = item.email.trim().toLowerCase();
      return (
        normalizedName.includes(normalizedSearchTerm) ||
        normalizedEmail.includes(normalizedSearchTerm) ||
        normalizedName.startsWith(
          normalizedSearchTerm + FIRESTORE_QUERY.PREFIX_UPPER_BOUND,
        )
      );
    }
    return true;
  });

  filteredItems.sort((firstItem, secondItem) =>
    firstItem.fullName.localeCompare(secondItem.fullName),
  );

  return {
    items: filteredItems.slice(0, pageSize),
    nextCursor: null,
    totalCount: filteredItems.length,
  };
};
