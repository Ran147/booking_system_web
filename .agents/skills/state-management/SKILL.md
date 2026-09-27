---
name: state-management
description: Use when deciding where a piece of state should live — server data, filters and pagination in the URL, session/theme/language, form values, or local UI state — or when adding a React Context, a reducer or the TanStack Query client setup. This project uses TanStack Query + React Context; there is no Redux or Zustand.
---

# State Management

This skill is the **single source of truth** for *where* each kind of state lives. The project uses **TanStack Query** for server data and **React Context** for a few app-wide values. There is no Redux, Zustand or other global store.

## Precedence

| Topic | Owner |
| --- | --- |
| Where state lives, Context rules, QueryClient defaults | **this skill** |
| How queries are written (keys, adapters, pagination, realtime) | `api-query-standards` |
| How writes and cache invalidation work | `api-mutation-standards` |
| Form state | `forms-validation-standards` (React Hook Form) |
| Session and current business Context | `auth-and-roles` |
| Theme Context | `theming-standards` |
| ViewModel as the place that wires state to UI | `component-architecture` |

---

## 1. Decision table

| Kind of state | Lives in | Example |
| --- | --- | --- |
| Data from Firestore or Cloud Functions | TanStack Query cache | Service list, bookings, plans |
| Live data (agenda) | TanStack Query cache, fed by `onSnapshot` | Weekly agenda (KAN-67) |
| Filters, search, sort, selected tab | URL search params | `?q=corte&status=active` |
| Page cursor | Local state in the ViewModel (`useCursorPagination`) | Previous / next page |
| Session, role, current business | `AuthContext` (`auth-and-roles`) | `useSession()`, `useCurrentBusiness()` |
| Theme | `ThemeContext` (`theming-standards`) | `useTheme()` |
| Language | i18next itself | `i18n.changeLanguage()` |
| Form values and errors | React Hook Form | Service form |
| Multi-step flow (booking checkout, plan checkout) | `useReducer` in the flow's ViewModel | Service → slot → summary → confirm |
| Open dialog, hovered row, toggles | `useState` in the ViewModel | `isDeleteDialogOpen` |

If a value can be **derived** from others, it is computed in the ViewModel, never stored.

## 2. Rules

- **Never copy server data into `useState` or Context.** Read it from the query each time; TanStack Query already caches it.
- **Filters live in the URL**, so a filtered list can be refreshed, shared and navigated back to. Reading and writing them goes through a feature hook (`use<Feature>ListFilters`).
- **Context only for app-wide values that change rarely:** session, current business, theme. A new Context needs a reason in the PR description.
- One Context per concern. Each has: `<Name>Context.ts`, `<Name>Provider.tsx`, `use<Name>.ts` (throws `PROVIDER_ERROR.…` when used outside its provider) and a `…ContextValue.interface.ts`. All live in `src/app/providers/<name>/`, except `auth`, which lives in `src/features/auth/`.
- Context values are memoized (`useMemo`) so consumers do not re-render on every parent render.
- Mutually exclusive UI modes are one union (`VIEW_STATE`, wizard step) instead of several booleans (`component-architecture`).
- No `window` globals, no module-level mutable variables for state.

### Incorrect

```tsx
// Server data copied into state, filters lost on refresh, flags that can contradict each other
const [serviceList, setServiceList] = useState<ServiceListItem[]>([]);
const [searchTerm, setSearchTerm] = useState("");
const [isLoading, setIsLoading] = useState(true);
const [hasError, setHasError] = useState(false);

useEffect(() => {
  fetchServices(searchTerm)
    .then(setServiceList)
    .catch(() => setHasError(true))
    .finally(() => setIsLoading(false));
}, [searchTerm]);
```

### Correct

Filters in the URL, data from the query, view state derived (see the full ViewModel in `component-architecture`):

```ts
// src/shared/constants/routes/SearchParam.constants.ts
export const SEARCH_PARAM = {
  SEARCH: "q",
  STATUS: "status",
} as const;
```

```ts
// src/shared/constants/index.ts (append)
export { SEARCH_PARAM } from "./routes/SearchParam.constants";
```

```ts
// src/portals/business/features/services/models/ServiceListFilters.interface.ts
import type { ServiceStatus } from "@/shared/domain";
import type { Nullable } from "@/shared/types";

export interface ServiceListFilters {
  searchTerm: string;
  status: Nullable<ServiceStatus>;
}
```

```ts
// src/portals/business/features/services/models/UseServiceListFiltersReturn.interface.ts
import type { ServiceStatus } from "@/shared/domain";
import type { Nullable } from "@/shared/types";
import type { ServiceListFilters } from "./ServiceListFilters.interface";

export interface UseServiceListFiltersReturn {
  filters: ServiceListFilters;
  handleSearchTermChange: (nextSearchTerm: string) => void;
  handleStatusChange: (nextStatus: Nullable<ServiceStatus>) => void;
}
```

```ts
// src/portals/business/features/services/hooks/useServiceListFilters.ts
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { SEARCH_PARAM, STRING } from "@/shared/constants";
import { SERVICE_STATUS, type ServiceStatus } from "@/shared/domain";
import type { Nullable } from "@/shared/types";
import type { UseServiceListFiltersReturn } from "../models/UseServiceListFiltersReturn.interface";

const isServiceStatus = (
  paramValue: Nullable<string>,
): paramValue is ServiceStatus =>
  Object.values(SERVICE_STATUS).some((status) => status === paramValue);

export const useServiceListFilters = (): UseServiceListFiltersReturn => {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get(SEARCH_PARAM.STATUS);
  const searchTerm = searchParams.get(SEARCH_PARAM.SEARCH) ?? STRING.EMPTY;
  const status = isServiceStatus(statusParam) ? statusParam : null;

  const updateSearchParam = (
    paramName: string,
    paramValue: Nullable<string>,
  ): void => {
    setSearchParams((currentSearchParams) => {
      if (paramValue) {
        currentSearchParams.set(paramName, paramValue);
      } else {
        currentSearchParams.delete(paramName);
      }
      return currentSearchParams;
    });
  };

  const filters = useMemo(() => ({ searchTerm, status }), [searchTerm, status]);

  return {
    filters,
    handleSearchTermChange: (nextSearchTerm: string): void => {
      updateSearchParam(SEARCH_PARAM.SEARCH, nextSearchTerm);
    },
    handleStatusChange: (nextStatus: Nullable<ServiceStatus>): void => {
      updateSearchParam(SEARCH_PARAM.STATUS, nextStatus);
    },
  };
};
```

## 3. Multi-step flows with `useReducer`

Booking checkout (KAN-134 → KAN-149) and plan checkout (KAN-21 → KAN-24) are wizards. Their ViewModel owns a reducer:

- The step is a union from a constant (`BOOKING_CHECKOUT_STEP`). Never booleans such as `isOnSummary`.
- Actions are a discriminated union with a `type` from a constant object (`BOOKING_CHECKOUT_ACTION`).
- The reducer is a pure function in `hooks/<flow>Reducer.ts` and is unit-tested without rendering.
- Server checks (slot still free, KAN-144) happen in the confirm mutation, not in the reducer.

## 4. The QueryClient

One client for the whole app, created in `src/app/providers/query/queryClient.ts` and provided in `src/app/providers/AppProviders.tsx`.

```ts
// src/shared/constants/numbers/Query.constants.ts
export const QUERY_DEFAULTS = {
  GARBAGE_COLLECTION_TIME_MS: 300_000,
  RETRY_COUNT: 1,
  STALE_TIME_MS: 30_000,
} as const;
```

```ts
// src/shared/constants/index.ts (append)
export { QUERY_DEFAULTS } from "./numbers/Query.constants";
```

```ts
// src/app/providers/query/queryClient.ts
import { QueryClient } from "@tanstack/react-query";
import { QUERY_DEFAULTS } from "@/shared/constants";

export const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: false,
    },
    queries: {
      gcTime: QUERY_DEFAULTS.GARBAGE_COLLECTION_TIME_MS,
      refetchOnWindowFocus: false,
      retry: QUERY_DEFAULTS.RETRY_COUNT,
      staleTime: QUERY_DEFAULTS.STALE_TIME_MS,
    },
  },
});
```

- Features do not create their own `QueryClient`. Tests create a fresh one per test (`unit-testing-standards`).
- On sign-out, `queryClient.clear()` runs so no business data leaks into the next session (`auth-and-roles`).

---

## 5. Enforced by

| Rule | Tool |
| --- | --- |
| No Redux, Zustand, Jotai, MobX | ESLint `no-restricted-imports` on those packages |
| No `useState` / `useEffect` in `.tsx` | ESLint rule from `component-architecture` |
| Server data not copied into state | Code review (look for `setX(query.data)`) |
| Context naming and file layout | Code review |

## 6. Checklist

- [ ] Server data is read from TanStack Query, never copied into `useState` or Context.
- [ ] Filters, search and sort are in the URL through a `use<Feature>ListFilters` hook.
- [ ] Derived values are computed, not stored.
- [ ] No new Context unless it is app-wide and rarely changing; if added, it follows the four-file layout and is memoized.
- [ ] Multi-step flows use `useReducer` with a step union and typed actions.
- [ ] No global store library, no module-level mutable state.
