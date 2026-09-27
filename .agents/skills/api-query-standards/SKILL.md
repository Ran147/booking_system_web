---
name: api-query-standards
description: Use when reading data from Firestore or a Cloud Function — list and detail screens, paginated tables with filters and search, realtime agenda views, dashboards and reports, or CSV/Excel export. Covers TanStack Query hooks, query keys, tenant scoping, document adapters, cursor pagination and indexes.
---

# API Query Standards

This skill is the **single source of truth** for **reading** data: how queries are written, keyed, scoped to a business, paginated, adapted into domain models and exported.

## Precedence

| Topic | Owner |
| --- | --- |
| Reads, query keys, pagination, adapters, export flow | **this skill** |
| Who may read what; the current `businessId` | `auth-and-roles` — wins on scoping and permissions |
| Where filter state lives (URL) | `state-management` |
| Writes, cache invalidation, error → message mapping | `api-mutation-standards` |
| Entity and field names, statuses | `domain-glossary` |
| Collection names, field-name constants | `constants-standards` |

---

## 1. Shape of a feature's `api/` folder

```
<feature>/api/
├── <entity>QueryKeys.ts          # query key factory
├── <Entity>Document.schema.ts    # Zod adapter: Firestore document → domain model
├── fetch<Entity>Page.ts          # plain async function, no React
└── use<Entity>ListQuery.ts       # TanStack Query hook used by the ViewModel
```

- The ViewModel calls the hook. The hook calls the fetch function. Only `api/` imports `firebase/firestore`.
- Hook names: `use<Entity><Purpose>Query` (`useServiceListQuery`, `useBookingDetailQuery`).

## 2. Tenant scoping

- Every business-owned collection is under `businesses/{businessId}/…` (`domain-glossary`).
- In the business portal, `businessId` comes **only** from `useCurrentBusiness()` (`auth-and-roles`). Never from the URL, a form or local storage.
- `businessId` is always part of the query key, so two businesses never share cache entries.
- Security is enforced by `firestore.rules`. Scoping in the client is for correctness, not for security.

## 3. Query keys

- One key factory per entity, built from `FIRESTORE_COLLECTION` values, so keys mirror Firestore paths and need no new string literals.
- Invalidation uses the broadest key that is correct (`serviceQueryKeys.all(businessId)`).

## 4. Adapters: validate and convert every document

Firestore returns untyped data. Every document passes through a Zod schema that validates the fields and converts `Timestamp` to `Date`. Raw `DocumentData` never leaves `api/`.

## 5. Pagination with cursors

Firestore paginates with cursors, not page numbers. The standard shape is:

- `CursorPage<Item>` = `{ items, nextCursor, totalCount }`.
- `useCursorPagination(resetKeys)` keeps a stack of cursors in the ViewModel for previous / next, and resets when filters change.
- `totalCount` comes from `getCountFromServer` on the same filtered query (without cursor and limit).
- `CursorPagination` renders the controls (`component-standards`).
- Page size comes from `PAGINATION` (`constants-standards`). The backend returns only one page: never fetch a whole collection to paginate in the browser.

## 6. Filters, search and indexes

- Equality filters (`status`) use `where`. Only one field may have range filters, and it must be the first `orderBy`.
- Firestore has no full-text search. Search by name uses a prefix range on a normalized field `searchName` (lowercase, no accents), written on every create and update (`api-mutation-standards`).
- Every new combination of `where` + `orderBy` adds its composite index to `firestore.indexes.json` **in the same PR**.

## 7. Correct example: paginated service list

```ts
// src/shared/types/CursorPage.ts
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import type { Nullable } from "./Nullable";

export type PageCursor = QueryDocumentSnapshot<DocumentData>;

export interface CursorPage<Item> {
  items: Item[];
  nextCursor: Nullable<PageCursor>;
  totalCount: number;
}
```

```ts
// src/shared/types/index.ts (append)
export type * from "./CursorPage";
```

```ts
// src/shared/constants/firestore/FirestoreQuery.constants.ts
import type { WhereFilterOp } from "firebase/firestore";

export const FIRESTORE_OPERATOR = {
  EQUAL: "==",
  GREATER_OR_EQUAL: ">=",
  LESS_OR_EQUAL: "<=",
} as const satisfies Record<string, WhereFilterOp>;

export const FIRESTORE_QUERY = {
  PREFIX_UPPER_BOUND: "",
} as const;
```

```ts
// src/shared/constants/index.ts (append)
export {
  FIRESTORE_OPERATOR,
  FIRESTORE_QUERY,
} from "./firestore/FirestoreQuery.constants";
```

```ts
// src/shared/utils/normalizeSearchTerm.ts
import { STRING } from "@/shared/constants";

const DIACRITIC_PATTERN = /\p{Diacritic}/gu;

export const normalizeSearchTerm = (searchTerm: string): string =>
  searchTerm
    .normalize("NFD")
    .replace(DIACRITIC_PATTERN, STRING.EMPTY)
    .trim()
    .toLowerCase();
```

```ts
// src/shared/hooks/UseCursorPaginationReturn.interface.ts
import type { Nullable, PageCursor } from "@/shared/types";

export interface UseCursorPaginationReturn {
  currentCursor: Nullable<PageCursor>;
  goToNextPage: (nextCursor: PageCursor) => void;
  goToPreviousPage: () => void;
  hasPreviousPage: boolean;
  pageNumber: number;
}
```

```ts
// src/shared/hooks/useCursorPagination.ts
import { useState } from "react";
import type { PageCursor } from "@/shared/types";
import type { UseCursorPaginationReturn } from "./UseCursorPaginationReturn.interface";

export const useCursorPagination = (
  resetKeys: readonly unknown[],
): UseCursorPaginationReturn => {
  const resetSignature = JSON.stringify(resetKeys);
  const [cursorStack, setCursorStack] = useState<PageCursor[]>([]);
  const [previousResetSignature, setPreviousResetSignature] =
    useState(resetSignature);

  if (previousResetSignature !== resetSignature) {
    setPreviousResetSignature(resetSignature);
    setCursorStack([]);
  }

  return {
    currentCursor: cursorStack.at(-1) ?? null,
    goToNextPage: (nextCursor: PageCursor): void => {
      setCursorStack((currentStack) => [...currentStack, nextCursor]);
    },
    goToPreviousPage: (): void => {
      setCursorStack((currentStack) => currentStack.slice(0, -1));
    },
    hasPreviousPage: cursorStack.length > 0,
    pageNumber: cursorStack.length + 1,
  };
};
```

```ts
// src/shared/hooks/index.ts
export { useCursorPagination } from "./useCursorPagination";
export type { UseCursorPaginationReturn } from "./UseCursorPaginationReturn.interface";
```

```ts
// src/portals/business/features/services/constants/ServiceField.constants.ts
export const SERVICE_FIELD = {
  SEARCH_NAME: "searchName",
  STATUS: "status",
} as const;
```

```ts
// src/portals/business/features/services/models/ServiceListItem.interface.ts
import type { ServiceStatus } from "@/shared/domain";

export interface ServiceListItem {
  durationMinutes: number;
  id: string;
  name: string;
  priceInCents: number;
  status: ServiceStatus;
}
```

```ts
// src/portals/business/features/services/models/ServiceListQueryParams.interface.ts
import type { Nullable, PageCursor } from "@/shared/types";
import type { ServiceListFilters } from "./ServiceListFilters.interface";

export interface ServiceListQueryParams {
  businessId: string;
  filters: ServiceListFilters;
  pageCursor: Nullable<PageCursor>;
  pageSize: number;
}
```

```ts
// src/portals/business/features/services/api/ServiceDocument.schema.ts
import type { QueryDocumentSnapshot } from "firebase/firestore";
import { z } from "zod";
import { SERVICE_STATUS } from "@/shared/domain";
import type { ServiceListItem } from "../models/ServiceListItem.interface";

const serviceDocumentSchema = z.object({
  durationMinutes: z.number().int().positive(),
  name: z.string(),
  priceInCents: z.number().int().nonnegative(),
  status: z.enum([SERVICE_STATUS.ACTIVE, SERVICE_STATUS.INACTIVE]),
});

export const mapServiceListItem = (
  serviceDocument: QueryDocumentSnapshot,
): ServiceListItem => ({
  ...serviceDocumentSchema.parse(serviceDocument.data()),
  id: serviceDocument.id,
});
```

```ts
// src/portals/business/features/services/api/serviceQueryKeys.ts
import type { QueryKey } from "@tanstack/react-query";
import { FIRESTORE_COLLECTION } from "@/shared/constants";
import type { ServiceListQueryParams } from "../models/ServiceListQueryParams.interface";

export const serviceQueryKeys = {
  all: (businessId: string): QueryKey =>
    [
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.SERVICES,
    ] as const,
  list: ({
    businessId,
    filters,
    pageCursor,
    pageSize,
  }: ServiceListQueryParams): QueryKey =>
    [
      ...serviceQueryKeys.all(businessId),
      filters,
      pageCursor?.id ?? null,
      pageSize,
    ] as const,
};
```

```ts
// src/portals/business/features/services/api/fetchServicePage.ts
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
} from "@/shared/constants";
import { firestore } from "@/shared/lib/firebase";
import type { CursorPage } from "@/shared/types";
import { normalizeSearchTerm } from "@/shared/utils/normalizeSearchTerm";
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

  const filteredQuery = query(
    collection(
      firestore,
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.SERVICES,
    ),
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

  return {
    items: pageSnapshot.docs.map(mapServiceListItem),
    nextCursor: hasMorePages ? (pageSnapshot.docs.at(-1) ?? null) : null,
    totalCount: countSnapshot.data().count,
  };
};
```

```ts
// src/portals/business/features/services/api/useServiceListQuery.ts
import {
  keepPreviousData,
  useQuery,
  type UseQueryResult,
} from "@tanstack/react-query";
import type { CursorPage } from "@/shared/types";
import { fetchServicePage } from "./fetchServicePage";
import { serviceQueryKeys } from "./serviceQueryKeys";
import type { ServiceListItem } from "../models/ServiceListItem.interface";
import type { ServiceListQueryParams } from "../models/ServiceListQueryParams.interface";

export const useServiceListQuery = (
  serviceListQueryParams: ServiceListQueryParams,
): UseQueryResult<CursorPage<ServiceListItem>> =>
  useQuery({
    placeholderData: keepPreviousData,
    queryFn: () => fetchServicePage(serviceListQueryParams),
    queryKey: serviceQueryKeys.list(serviceListQueryParams),
  });
```

`"NFD"` is a typed argument of `String.prototype.normalize`, so it stays inline like the `Intl` options in `i18n-standards`.

The ViewModel that consumes it is in `component-architecture` §4. The index this query needs:

```json
{
  "collectionGroup": "services",
  "fields": [
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "searchName", "order": "ASCENDING" }
  ],
  "queryScope": "COLLECTION"
}
```

### Incorrect

```ts
// Whole collection downloaded, paginated and filtered in the browser, no adapter, no tenant
const snapshot = await getDocs(collection(firestore, "services"));
const all = snapshot.docs.map((d) => d.data());
const page = all.filter((s) => s.name.includes(term)).slice(page * 20, page * 20 + 20);
```

## 8. Loading, empty and error

- The ViewModel turns the query into a `ViewState` with `resolveViewState` (`component-architecture`) and the page renders it with `ViewStateSwitch`.
- `placeholderData: keepPreviousData` keeps the current page visible while the next one loads.
- A query error shows `ErrorState`. The user-facing message comes from `mapFirebaseError` (`api-mutation-standards`).

## 9. Realtime data

- Use `onSnapshot` **only** where the screen must update live: the business agenda (KAN-67, KAN-68) and the availability check before confirming (KAN-144).
- The listener lives in a hook in `api/`, writes into the query cache with `queryClient.setQueryData(queryKey, …)`, and unsubscribes in the effect cleanup.
- Everything else uses regular queries.

## 10. Export to CSV / Excel

- Export always runs **on the server** with the same filters as the screen, because the client only has one page.
- The `ExportButton` (`component-standards`) calls a mutation hook (`useExport<Entity>Mutation`, `api-mutation-standards`) that invokes the callable function `exportCollection` with `{ entity, filters, format }`.
- The function checks permissions, streams every matching document, builds CSV (UTF-8 with BOM, so Excel opens accents correctly) or XLSX, stores it in Cloud Storage and returns a short-lived download URL.
- Column headers are translated with the requester's `User.language` (`i18n-standards`).

---

## 11. Enforced by

| Rule | Tool |
| --- | --- |
| Only `api/` imports `firebase/firestore` | ESLint `no-restricted-imports` for `firebase/firestore` outside `**/api/**`, `src/shared/lib/**` and `src/shared/types/**` |
| Documents are validated | Code review: every `api/` read maps through a `*Document.schema.ts` |
| Index exists for each query | Firestore emulator error during tests, plus review of `firestore.indexes.json` |
| `businessId` in every business query key | Code review |

## 12. Checklist

- [ ] The read lives in `api/` as fetch function + `use…Query` hook with a key from the entity's key factory.
- [ ] Business data is scoped with `businessId` from `useCurrentBusiness()`, and the key includes it.
- [ ] Every document goes through a Zod adapter; `Timestamp` becomes `Date`.
- [ ] Lists are paginated on the server with cursors and return `CursorPage<Item>`; the count uses `getCountFromServer`.
- [ ] Filters come from the URL; search uses the normalized `searchName` prefix.
- [ ] New `where` + `orderBy` combinations have their index in `firestore.indexes.json`.
- [ ] Realtime listeners are used only where required and are unsubscribed.
- [ ] Export runs through the `exportCollection` function, never by paging in the browser.
