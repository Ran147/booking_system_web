---
name: component-architecture
description: Use when creating a new feature or page, adding state, effects, handlers or data loading to a component, splitting a large component, or deciding where a file goes inside src/portals, src/features or src/shared. Covers feature folders per portal, spec-first development, the ViewModel pattern, local mini components and SOLID.
---

# Component Architecture

This skill is the **single source of truth** for how UI features are structured: feature folders per portal, spec-first development (SDD), SOLID and design patterns, presentation/logic separation with ViewModel hooks, and short composed returns.

## Precedence

| Topic | Owner |
| --- | --- |
| Folder layout, ViewModel split, what may live in `.tsx`, patterns | **this skill** — wins over `component-standards` on structure and logic |
| Format and content of `specs/SPEC.md` | `backlog-to-spec` |
| Which shared primitive to use | `component-standards` |
| Where each kind of state lives | `state-management` |
| Data loading and writing inside the ViewModel | `api-query-standards`, `api-mutation-standards` |
| Tests and Page Objects | `unit-testing-standards` |

---

## 1. Feature folders inside their portal

Every feature lives in **one** folder under the portal that owns it. Features shared by several portals live in `src/features/`. The epic → folder map is in `docs/backlog/epic-map.md`.

```
src/portals/<portal>/features/<feature-name>/     # kebab-case
├── FeatureNamePage.tsx          # route entry: thin composition only
├── components/                  # feature-private minis (presentation only)
│   ├── FeatureNameToolbar.tsx
│   └── FeatureNameTable.tsx
├── hooks/
│   └── useFeatureNamePageViewModel.ts
├── models/                      # *.interface.ts, *.schema.ts, *.mutation.ts
├── constants/                   # *.constants.ts used only by this feature
├── api/                         # query/mutation hooks and Firestore functions
├── specs/SPEC.md                # written with backlog-to-spec before coding
├── tests/                       # *.page.ts + *.test.tsx
└── index.ts                     # the only public entry of the feature
```

### Rules

- **One feature, one folder.** Do not scatter a feature across `src/shared/`.
- **Colocate by default.** Hooks, models, constants and API calls used by one feature stay inside it.
- **Promote to `src/shared/` only when a second feature needs it.**
- **Import another feature only through its `index.ts`.** Never deep-import `../other-feature/hooks/…`.
- **Portals do not import from other portals.** Shared logic goes to `src/features/` or `src/shared/`.
- **No new top-level folders** (`containers/`, `views/`, `smart/`, `helpers/`).
- A portal's `layout/` holds its chrome (sidebar, navbar, footer) and follows the same rules as a feature.

### Incorrect

```
src/portals/business/
├── ServicesPage.tsx              ← loose file, no feature folder
└── useServices.ts
src/shared/hooks/
└── useServiceFilters.ts          ← feature logic parked in shared
src/portals/customer/features/availability/
└── ../../../business/features/services/api/…   ← cross-portal deep import
```

### Correct

```
src/portals/business/features/services/
├── ServicesPage.tsx
├── components/ServicesToolbar.tsx
├── hooks/useServicesPageViewModel.ts
├── hooks/useServiceListFilters.ts
├── models/ServicesPageViewModel.interface.ts
├── api/useServiceListQuery.ts
├── specs/SPEC.md
├── tests/ServicesPage.page.ts
└── index.ts
```

## 2. Spec first (SDD)

Before implementing a new feature or any behavior change, the spec exists and the work is checked against it.

1. **Specify.** `specs/SPEC.md` is generated with `backlog-to-spec` from the KAN stories. Every acceptance criterion cites its KAN key.
2. **Plan.** List the files to touch, the shared components to reuse, and the queries and mutations. Add `specs/plan.md` only for large work.
3. **Implement.** Build task by task inside the feature folder.
4. **Validate.** Each acceptance criterion maps to at least one test (`unit-testing-standards`).

- Do not start non-trivial work without a spec. If the prompt already contains acceptance criteria, persist them into `specs/SPEC.md` first.
- If the spec is marked `BLOCKED`, implement only the parts that are not blocked.
- If requirements change, update the spec **before** the code.
- Style-only tweaks with no behavior change may skip the spec.

## 3. SOLID and patterns

| Principle | Applied here |
| --- | --- |
| **S** — single responsibility | `.tsx` renders, the ViewModel orchestrates, `api/` talks to Firebase, minis render one region |
| **O** — open/closed | Extend with props, variants and composition; never fork a shared primitive |
| **L** — Liskov | Shared components keep their contract. A `Button` never fetches or navigates by itself |
| **I** — interface segregation | Small `Props` and ViewModel interfaces; split hooks when consumers need a subset |
| **D** — dependency inversion | ViewModels depend on feature `api/` hooks, not on the Firebase SDK |

| Pattern | Use it for |
| --- | --- |
| **ViewModel / Presentation** | Every component with logic (§4) |
| **Composition** | Screens built from shared primitives and local minis (§5) |
| **Facade** | A ViewModel that coordinates several hooks (filters + query + pagination) |
| **Adapter** | Mapping Firestore documents to domain models in `api/` (`api-query-standards`) |
| **State** | Mutually exclusive UI modes as one union (`VIEW_STATE`, wizard steps) instead of several booleans |
| **Strategy** | Behavior chosen by a map (status → tone, status → allowed actions) instead of `switch` in JSX |
| **Decorator** | Guards and providers that wrap a subtree (`RequireRole`, `ThemeProvider`) |
| **Template** | Layout shells with slots (`PageTemplate`, `AuthTemplate`) |

**Forbidden:** god components or god ViewModels; copy-pasting a feature "with tweaks"; prop drilling more than two levels (use composition or Context per `state-management`); abstractions without a second consumer; class components and inheritance.

**Design gate.** Before coding, the plan names the responsibilities, the pattern and the shared pieces being reused. If it cannot, the design is not ready.

## 4. Presentation vs logic

| File | Role |
| --- | --- |
| `FeatureNamePage.tsx`, minis | **Presentation only.** JSX, `useTranslation`, binding ViewModel outputs to props |
| `hooks/use<Component>ViewModel.ts` | **Logic.** State, effects, queries, mutations, handlers, derived values, navigation |

- `.tsx` files contain no `useState`, `useEffect`, `useQuery`, `useMutation` or non-trivial handlers.
- The ViewModel is named after its component (`ServicesPage` → `useServicesPageViewModel`) and returns a typed interface from `models/`.
- A component that only maps props to JSX needs no ViewModel.

### Incorrect

```tsx
export const ServicesPage = (): ReactElement => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data } = useQuery({
    queryFn: () => getDocs(collection(firestore, "services")),
    queryKey: ["services"],
  });

  if (!data) return <p>Cargando…</p>;

  return (
    <div>
      <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      {data.docs.map((doc) => <div key={doc.id}>{doc.data().name}</div>)}
    </div>
  );
};
```

Problems: state, data access and Firestore calls in the `.tsx`; no tenant scoping; literal text; abbreviations (`e`, `data`, `doc`); raw HTML controls.

### Correct

```ts
// src/shared/constants/ui/ViewState.constants.ts
export const VIEW_STATE = {
  EMPTY: "empty",
  ERROR: "error",
  LOADING: "loading",
  READY: "ready",
} as const;

export type ViewState = (typeof VIEW_STATE)[keyof typeof VIEW_STATE];
```

```ts
// src/shared/constants/index.ts (append)
export { VIEW_STATE, type ViewState } from "./ui/ViewState.constants";
```

```ts
// src/shared/utils/resolveViewState.ts
import type { UseQueryResult } from "@tanstack/react-query";
import { VIEW_STATE, type ViewState } from "@/shared/constants";

export const resolveViewState = (
  queryResult: Pick<UseQueryResult, "isError" | "isPending">,
  itemCount: number,
): ViewState => {
  if (queryResult.isPending) return VIEW_STATE.LOADING;
  if (queryResult.isError) return VIEW_STATE.ERROR;
  return itemCount === 0 ? VIEW_STATE.EMPTY : VIEW_STATE.READY;
};
```

```ts
// src/portals/business/features/services/models/ServicesPageViewModel.interface.ts
import type { CursorPaginationProps } from "@/shared/components";
import type { ViewState } from "@/shared/constants";
import type { ServicesTableProps } from "./ServicesTableProps.interface";
import type { ServicesToolbarProps } from "./ServicesToolbarProps.interface";

export interface ServicesPageViewModel {
  pagination: CursorPaginationProps;
  table: ServicesTableProps;
  toolbar: ServicesToolbarProps;
  viewState: ViewState;
}
```

```ts
// src/portals/business/features/services/models/ServicesToolbarProps.interface.ts
export interface ServicesToolbarProps {
  onCreateClick: () => void;
  onSearchTermChange: (nextSearchTerm: string) => void;
  searchTerm: string;
}
```

```ts
// src/portals/business/features/services/models/ServicesTableProps.interface.ts
import type { ServiceListItem } from "./ServiceListItem.interface";

export interface ServicesTableProps {
  onEditClick: (serviceId: string) => void;
  serviceList: ServiceListItem[];
}
```

```ts
// src/portals/business/features/services/hooks/useServicesPageViewModel.ts
import { useNavigate } from "react-router";
import { useCurrentBusiness } from "@/features/auth";
import { PAGINATION, ROUTE_PATH } from "@/shared/constants";
import { useCursorPagination } from "@/shared/hooks";
import { resolveViewState } from "@/shared/utils/resolveViewState";
import { useServiceListFilters } from "./useServiceListFilters";
import { useServiceListQuery } from "../api/useServiceListQuery";
import type { ServicesPageViewModel } from "../models/ServicesPageViewModel.interface";

export const useServicesPageViewModel = (): ServicesPageViewModel => {
  const navigate = useNavigate();
  const { businessId } = useCurrentBusiness();
  const { filters, handleSearchTermChange } = useServiceListFilters();
  const pagination = useCursorPagination([filters]);
  const serviceListQuery = useServiceListQuery({
    businessId,
    filters,
    pageCursor: pagination.currentCursor,
    pageSize: PAGINATION.DEFAULT_PAGE_SIZE,
  });

  const serviceList = serviceListQuery.data?.items ?? [];
  const nextCursor = serviceListQuery.data?.nextCursor ?? null;

  return {
    pagination: {
      hasNextPage: nextCursor !== null,
      hasPreviousPage: pagination.hasPreviousPage,
      onNextPageClick: (): void => {
        if (nextCursor) pagination.goToNextPage(nextCursor);
      },
      onPreviousPageClick: pagination.goToPreviousPage,
      pageNumber: pagination.pageNumber,
      totalCount: serviceListQuery.data?.totalCount ?? 0,
    },
    table: {
      onEditClick: (serviceId: string): void => {
        void navigate(serviceId);
      },
      serviceList,
    },
    toolbar: {
      onCreateClick: (): void => {
        void navigate(ROUTE_PATH.BUSINESS.SERVICE_NEW);
      },
      onSearchTermChange: handleSearchTermChange,
      searchTerm: filters.searchTerm,
    },
    viewState: resolveViewState(serviceListQuery, serviceList.length),
  };
};
```

```tsx
// src/portals/business/features/services/ServicesPage.tsx
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  CursorPagination,
  PageTemplate,
  ViewStateSwitch,
} from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import { ServicesTable } from "./components/ServicesTable";
import { ServicesToolbar } from "./components/ServicesToolbar";
import { useServicesPageViewModel } from "./hooks/useServicesPageViewModel";

export const ServicesPage = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const { pagination, table, toolbar, viewState } = useServicesPageViewModel();

  return (
    <PageTemplate title={t("services.list.title")}>
      <ServicesToolbar {...toolbar} />
      <ViewStateSwitch
        emptyMessage={t("services.list.empty")}
        viewState={viewState}
      >
        <ServicesTable {...table} />
      </ViewStateSwitch>
      <CursorPagination {...pagination} />
    </PageTemplate>
  );
};
```

```ts
// src/portals/business/features/services/index.ts
export { ServicesPage } from "./ServicesPage";
```

## 5. Short returns: extract local minis

The main return reads like an outline. When a region grows (toolbar, table, filters, modals, empty state), extract a **mini** inside the feature.

| Situation | Placement |
| --- | --- |
| One or two minis | Next to the page, or in `components/` |
| Several minis | `components/<FeatureName><Region>.tsx` |
| A second feature needs it | Promote to `src/shared/components/` (`component-standards`) |

- Minis are presentation-only: props in, JSX out. No fetching, no effects.
- Name them by region: `ServicesToolbar`, `ServicesTable`. Never `Part1` or `Helper`.

```tsx
// src/portals/business/features/services/components/ServicesToolbar.tsx
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, SearchInput } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { ServicesToolbarProps } from "../models/ServicesToolbarProps.interface";

export const ServicesToolbar = ({
  onCreateClick,
  onSearchTermChange,
  searchTerm,
}: ServicesToolbarProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <div className="flex items-center justify-between gap-4">
      <SearchInput
        label={t("services.toolbar.searchLabel")}
        onValueChange={onSearchTermChange}
        value={searchTerm}
      />
      <Button onClick={onCreateClick}>
        {t("services.toolbar.createAction")}
      </Button>
    </div>
  );
};
```

**`src/i18n/locales/es/business.json`**

```json
{
  "services": {
    "list": {
      "empty": "Todavía no tienes servicios.",
      "title": "Servicios"
    },
    "toolbar": {
      "createAction": "Nuevo servicio",
      "searchLabel": "Buscar servicios"
    }
  }
}
```

**`src/i18n/locales/en/business.json`**

```json
{
  "services": {
    "list": {
      "empty": "You have no services yet.",
      "title": "Services"
    },
    "toolbar": {
      "createAction": "New service",
      "searchLabel": "Search services"
    }
  }
}
```

---

## 6. Enforced by

| Rule | Tool |
| --- | --- |
| No hooks with logic in `.tsx` (`useState`, `useEffect`, `useQuery`, `useMutation`, `useReducer`) | ESLint `no-restricted-imports` / `no-restricted-syntax` on those calls in `src/portals/**/*.tsx` and `src/features/**/*.tsx` |
| No cross-portal imports | ESLint `import-x/no-restricted-paths` (zones between `src/portals/*`) |
| No deep imports into another feature | ESLint `no-restricted-imports` patterns `@/portals/*/features/*/*` |
| No `../../` | ESLint `no-restricted-imports` (`code-style-standards`) |
| Specs exist before implementation | Pull request template checkbox and review |

## 7. Checklist

- [ ] The feature lives in `src/portals/<portal>/features/<kebab-name>/` (or `src/features/` when shared by portals).
- [ ] `specs/SPEC.md` exists (from `backlog-to-spec`) and the work was checked against it.
- [ ] The design names its responsibilities and pattern. No god component, no copy-paste.
- [ ] `.tsx` files hold only composition and `useTranslation`. Logic is in `use<Component>ViewModel.ts` with a typed interface.
- [ ] The main return is short. Regions are extracted into named minis.
- [ ] UI modes use one union (`VIEW_STATE`), not several booleans.
- [ ] Other features are imported only through their `index.ts`. No cross-portal imports.
- [ ] Acceptance criteria are covered by tests (`unit-testing-standards`).
