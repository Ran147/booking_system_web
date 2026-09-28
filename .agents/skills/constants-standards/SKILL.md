---
name: constants-standards
description: Use when a technical string literal or a magic number appears in code (route paths, Firestore collection or field names, storage keys, namespaces, sizes, timeouts, limits), or when creating, naming or exporting a constants file. Not for user-visible text, which goes to i18n-standards.
---

# Constants Standards

This skill is the **single source of truth** for:

1. Replacing **technical** string literals and magic numbers with named constants.
2. Where constants files live and how they are named, typed, sorted and exported.

## Precedence

| Topic | Owner |
| --- | --- |
| Text a user can read (labels, titles, messages, errors, emails) | `i18n-standards` — never a constant |
| Domain status values and transitions (`BOOKING_STATUS`, …) and other domain value lists (`COLLABORATOR_PERMISSION`, `AUDIT_LOG_ACTION_TYPE`) | `domain-glossary` (they follow this skill's format) |
| Values the super admin can change at runtime (idle timeout, grace days, limits) | Read from `PlatformSettings` (`api-query-standards`); only their fallback defaults are constants |
| Colors, spacing, font sizes | `theming-standards` (design tokens, not TS constants) |
| General naming and typing | `code-style-standards` |
| Technical literals and magic numbers | **this skill** |

### Visible text vs technical literal

The teacher's original rule sent *every* string to constants. With i18n that is wrong: visible text must be translatable. Apply this table:

| Is the string… | Goes to | Example |
| --- | --- | --- |
| Read by a person on screen or in an email | `src/i18n/locales/{en,es}/*.json` | `"Mis servicios"`, `"Guardar"` |
| A translation key | Stays inline as `t("…")`, type-checked by i18next | `t("services.list.title")` |
| A technical identifier (route, collection, field, storage key, namespace, event name) | A constants file | `FIRESTORE_COLLECTION.BOOKINGS` |
| A domain status value | `src/shared/domain` (see `domain-glossary`) | `BOOKING_STATUS.CONFIRMED` |
| A Tailwind class list in `className` | Stays inline (see `theming-standards`) | `"flex gap-4"` |
| A test name in `describe` / `it` | Stays inline (see `unit-testing-standards`) | `it("shows an error when …")` |

---

## 1. Replace technical literals and magic numbers

- No raw technical strings in components, hooks, API functions or Cloud Functions: `"bookings"`, `"/business"`, `"theme"`, `""`.
- No unexplained numbers: `20`, `300`, `8000`.
- No comparisons against raw strings: `status === "confirmed"`.

**Allowed without a constant:** `0`, `1` and `-1` as indexes, increments or "none" sentinels; loop bounds tied to `array.length`; array indexes.

### Incorrect

```ts
// Visible text in a constant, PascalCase key, unsorted keys, no `as const`
export const SERVICE_TEXT = {
  TITLE: "Mis servicios",
  EMPTY_MESSAGE: "No tienes servicios",
};

export const STRING = {
  Empty: "",
};

// Magic number and raw technical strings inside a query
const servicesQuery = query(
  collection(firestore, "businesses", businessId, "services"),
  orderBy("name"),
  limit(20),
);
```

Problems: visible text belongs to `i18n-standards`; `Empty` is not `SCREAMING_SNAKE_CASE`; keys are not sorted; objects are missing `as const`; `"businesses"`, `"services"`, `"name"` and `20` are technical literals.

### Correct

```ts
// src/portals/business/features/services/api/buildServiceListQuery.ts
import {
  collection,
  limit,
  orderBy,
  query,
  type Query,
} from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/shared/constants";
import { firestore } from "@/shared/lib/firebase";
import { SERVICE_SORT_FIELD } from "../constants/ServiceList.constants";

export const buildServiceListQuery = (
  businessId: string,
  pageSize: number,
): Query =>
  query(
    collection(
      firestore,
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.SERVICES,
    ),
    orderBy(SERVICE_SORT_FIELD.NAME),
    limit(pageSize),
  );
```

The page size comes from the caller (`PAGINATION.DEFAULT_PAGE_SIZE`, see §7). Cursor pagination belongs to `api-query-standards`.

---

## 2. Where constants live

| Kind | Location | Imported as |
| --- | --- | --- |
| Shared technical constants | `src/shared/constants/<domain>/<Name>.constants.ts` | `@/shared/constants` |
| Domain statuses | `src/shared/domain/<entity>/<Entity>Status.constants.ts` | `@/shared/domain` |
| Other domain value lists (permissions, audit action types) | `src/shared/domain/<entity>/<Entity><Concept>.constants.ts` | `@/shared/domain` |
| Constants used by one feature only | `<feature>/constants/<Name>.constants.ts` | relative, inside the feature |
| Cloud Functions | `functions/src/shared/constants/<Name>.constants.ts` | relative, inside `functions/` |

- Promote a feature constant to `src/shared/constants/` only when a second feature needs it.
- `functions/` cannot import from `src/`. It keeps its own copy of `FIRESTORE_COLLECTION`. Any change to one copy is applied to the other **in the same PR**.

### Initial catalog

| Object | File | Contents |
| --- | --- | --- |
| `STRING` | `common/String.constants.ts` | `EMPTY`, `SPACE` |
| `ROUTE_PATH` | `routes/RoutePath.constants.ts` | Route segments per portal |
| `FIRESTORE_COLLECTION` | `firestore/FirestoreCollection.constants.ts` | Collection names from `domain-glossary` §3 |
| `I18N_NAMESPACE` | `i18n/I18nNamespace.constants.ts` | `common`, `validation` and one per portal |
| `STORAGE_KEY` | `storage/StorageKey.constants.ts` | `localStorage` keys (theme, language) |
| `PAGINATION` | `numbers/Pagination.constants.ts` | Page sizes |
| `TIME_MS` | `numbers/Time.constants.ts` | Debounce, toast and polling durations |

## 3. `as const` on every constant object

Every constant object ends with `as const`. The only exception is an object whose declared type is already readonly and must be wider than its literal, such as `TransitionMap<Status>` in `domain-glossary`. When a constant must match an interface, use `as const satisfies TheInterface`.

## 4. Keys sorted alphabetically, at every level

Keys are sorted A→Z inside every object and every nested object. This prevents duplicates and keeps diffs small.

## 5. `SCREAMING_SNAKE_CASE` keys that match their meaning

- Object names and keys are `SCREAMING_SNAKE_CASE`: `STRING.EMPTY`, never `STRING.Empty`.
- The key describes the value. No abbreviations unless the value itself is abbreviated.
- Numeric keys describe meaning and unit, never the digit: `TIME_MS.DEBOUNCE.SEARCH`, not `THREE_HUNDRED`.

## 6. One semantic group per object; derive types from it

- Split by meaning: `ROUTE_PATH`, `STORAGE_KEY`, `FIRESTORE_COLLECTION`. Never a catch-all `CONSTANTS` or `NUMBERS` object.
- Never hand-write a union of the values. Derive it: `(typeof X)[keyof typeof X]`.
- Never use a TypeScript `enum` (`code-style-standards`).

## 7. Correct examples

```ts
// src/shared/constants/common/String.constants.ts
export const STRING = {
  EMPTY: "",
  SPACE: " ",
} as const;
```

```ts
// src/shared/constants/firestore/FirestoreCollection.constants.ts
export const FIRESTORE_COLLECTION = {
  AUDIT_LOG: "auditLog",
  BOOKINGS: "bookings",
  BUSINESSES: "businesses",
  COLLABORATORS: "collaborators",
  CUSTOMERS: "customers",
  NOTIFICATIONS: "notifications",
  PAYMENTS: "payments",
  PLAN_CHECKOUTS: "planCheckouts",
  PLANS: "plans",
  PLATFORM_SETTINGS: "platformSettings",
  SCHEDULE_BLOCKS: "scheduleBlocks",
  SERVICES: "services",
  SUBSCRIPTION: "subscription",
  SUPPORT_TICKETS: "supportTickets",
  USERS: "users",
} as const;

export type FirestoreCollection =
  (typeof FIRESTORE_COLLECTION)[keyof typeof FIRESTORE_COLLECTION];
```

```ts
// src/shared/constants/i18n/I18nNamespace.constants.ts
export const I18N_NAMESPACE = {
  ADMIN: "admin",
  BUSINESS: "business",
  COMMON: "common",
  CUSTOMER: "customer",
  LANDING: "landing",
  VALIDATION: "validation",
} as const;

export type I18nNamespace =
  (typeof I18N_NAMESPACE)[keyof typeof I18N_NAMESPACE];
```

```ts
// src/shared/constants/routes/RoutePath.constants.ts
// The customer portal lives under the business slug (Q4).
export const ROUTE_PATH = {
  ADMIN: {
    AUDIT_LOG: "audit-log",
    BUSINESSES: "businesses",
    DASHBOARD: "dashboard",
    PLANS: "plans",
    ROOT: "/admin",
    SUPPORT_TICKETS: "support-tickets",
  },
  AUTH: {
    PASSWORD_RECOVERY: "/password-recovery",
    SIGN_IN: "/sign-in",
  },
  BUSINESS: {
    CUSTOMERS: "customers",
    REPORTS: "reports",
    ROOT: "/business",
    SCHEDULE: "schedule",
    SERVICE_NEW: "services/new",
    SERVICES: "services",
    SETTINGS: "settings",
    SUBSCRIPTION: "subscription",
  },
  CUSTOMER: {
    ROOT: "/:businessSlug",
  },
  LANDING: {
    CONTACT: "/contact",
    HOME: "/",
    SIGN_UP: "/sign-up",
  },
} as const;
```

```ts
// src/shared/constants/storage/StorageKey.constants.ts
export const STORAGE_KEY = {
  LANGUAGE: "booking.language",
  THEME: "booking.theme",
} as const;
```

```ts
// src/shared/constants/numbers/Pagination.constants.ts
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50],
} as const;
```

```ts
// src/shared/constants/numbers/Time.constants.ts
export const TIME_MS = {
  DEBOUNCE: {
    SEARCH: 300,
  },
  TOAST: {
    ERROR: 8_000,
    SUCCESS: 4_000,
  },
} as const;
```

A feature-only constant, typed against the feature's model:

```ts
// src/portals/business/features/services/constants/ServiceList.constants.ts
import { PAGINATION } from "@/shared/constants";
import type { ServiceListParams } from "../models/ServiceListParams.interface";

export const SERVICE_SORT_FIELD = {
  CREATED_AT: "createdAt",
  NAME: "name",
  PRICE_IN_CENTS: "priceInCents",
} as const;

export type ServiceSortField =
  (typeof SERVICE_SORT_FIELD)[keyof typeof SERVICE_SORT_FIELD];

export const DEFAULT_SERVICE_LIST_PARAMS = {
  pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  sortField: SERVICE_SORT_FIELD.NAME,
} as const satisfies ServiceListParams;
```

```ts
// src/portals/business/features/services/models/ServiceListParams.interface.ts
import type { ServiceSortField } from "../constants/ServiceList.constants";

export interface ServiceListParams {
  pageSize: number;
  sortField: ServiceSortField;
}
```

`DEFAULT_SERVICE_LIST_PARAMS` is a runtime value typed by an interface, so its keys follow the interface's `camelCase` fields. It still uses `as const` and alphabetical keys.

## 8. Export from the barrel

Every file in `src/shared/constants/` is re-exported from `src/shared/constants/index.ts`. Values and their types from the same file go in **one** `export { … }` block, using the inline `type` modifier. Lines are sorted by path; other skills add their lines in the same order.

```ts
// src/shared/constants/index.ts
export { STRING } from "./common/String.constants";
export {
  FIRESTORE_COLLECTION,
  type FirestoreCollection,
} from "./firestore/FirestoreCollection.constants";
export {
  I18N_NAMESPACE,
  type I18nNamespace,
} from "./i18n/I18nNamespace.constants";
export { PAGINATION } from "./numbers/Pagination.constants";
export { TIME_MS } from "./numbers/Time.constants";
export { ROUTE_PATH } from "./routes/RoutePath.constants";
export { STORAGE_KEY } from "./storage/StorageKey.constants";
```

Feature constants are **not** added to the shared barrel.

---

## 9. Enforced by

| Rule | Tool |
| --- | --- |
| Sorted keys | ESLint `sort-keys` (`natural: true`) on `**/*.constants.ts` |
| `SCREAMING_SNAKE_CASE` object names | `@typescript-eslint/naming-convention` on `**/*.constants.ts` |
| No magic numbers | `@typescript-eslint/no-magic-numbers` (ignores `0`, `1`, `-1` and array indexes; off in `*.constants.ts` and tests). A number assigned to a local `const` passes the linter, so review checks that shared values are not parked in local constants |
| No comparisons against raw strings | `no-restricted-syntax` on `BinaryExpression[operator=/^[!=]==$/] > Literal[value=/./]` |
| No visible text in JSX | `i18next/no-literal-string` in `.tsx` (see `i18n-standards`) |
| No `enum` | `no-restricted-syntax` on `TSEnumDeclaration` |
| Derived types stay in sync | `tsc` |
| `as const`, semantic grouping, barrel exports | Code review (no reliable lint rule) |

## 10. Checklist

- [ ] No visible text in constants. It is in `locales/{en,es}` (`i18n-standards`).
- [ ] No technical string literal or magic number outside a constants file (except `0`, `1`, `-1`).
- [ ] The constant is in the right place: shared, domain, feature or `functions/`.
- [ ] Every object ends with `as const` (or `as const satisfies …`).
- [ ] Keys are `SCREAMING_SNAKE_CASE`, describe their meaning and are sorted A→Z at every level.
- [ ] Value unions are derived with `(typeof X)[keyof typeof X]`, never written by hand.
- [ ] New shared constants are exported from `src/shared/constants/index.ts`, values and types in one block.
- [ ] If `FIRESTORE_COLLECTION` changed, the copy in `functions/` changed too.
- [ ] Runtime-configurable values come from `PlatformSettings`, not from a constant.
