---
name: code-style-standards
description: Use when writing, refactoring or reviewing any TypeScript or TSX file in this repo — components, hooks, utilities, types, Cloud Functions. Covers arrow-function syntax, explicit return types, named exports, descriptive naming, file naming, Nullable types and import style.
---

# Code Style Standards

This skill defines the baseline style for **all** TypeScript in the repo (`src/` and `functions/`). It is the base layer: more specific skills win on their topic.

## Precedence

| Topic | Owner |
| --- | --- |
| Names of domain concepts (`Booking`, `businessId`, statuses) | `domain-glossary` |
| User-visible text | `i18n-standards` |
| Technical literals and magic numbers | `constants-standards` |
| Folder structure, ViewModel split, what goes in `.tsx` | `component-architecture` |
| Which UI primitive to use | `component-standards` |
| Everything else about how TypeScript is written | **this skill** |

If this skill and ESLint/Prettier disagree, the tool config wins and this skill must be fixed.

---

## 1. Arrow functions only

Components, hooks, utilities and callbacks are `const` arrow functions. The `function` keyword is not used.

**Incorrect:**

```tsx
function ServiceCard({ service }: ServiceCardProps) {
  return <Card>{service.name}</Card>;
}

export default function useServiceSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  return { searchTerm, setSearchTerm };
}
```

**Correct:** see §2 and §3.

## 2. Explicit return types everywhere

Every function declares its return type, including hooks and components:

| Kind | Return type |
| --- | --- |
| Component | `ReactElement` (imported as a type from `react`), or `Nullable<ReactElement>` when it can render nothing |
| Hook | A named interface: `Use<HookName>Return` or `<Component>ViewModel`, stored in `models/` |
| Event handler | `void` or `Promise<void>` |
| Utility | The concrete type |

Do not use `JSX.Element`: the global `JSX` namespace was removed in React 19 types.

**Correct:**

```ts
// src/portals/business/features/services/models/UseServiceSearchReturn.interface.ts
export interface UseServiceSearchReturn {
  handleSearchTermChange: (nextSearchTerm: string) => void;
  searchTerm: string;
}
```

```ts
// src/portals/business/features/services/hooks/useServiceSearch.ts
import { useState } from "react";
import { STRING } from "@/shared/constants";
import type { UseServiceSearchReturn } from "../models/UseServiceSearchReturn.interface";

export const useServiceSearch = (): UseServiceSearchReturn => {
  const [searchTerm, setSearchTerm] = useState<string>(STRING.EMPTY);

  const handleSearchTermChange = (nextSearchTerm: string): void => {
    setSearchTerm(nextSearchTerm);
  };

  return { handleSearchTermChange, searchTerm };
};
```

## 3. Named exports only

- Every module uses **named exports**. `export default` is not used anywhere in `src/` or `functions/`.
- The only exception is tool config files that require it (`vite.config.ts`, `vitest.config.ts`, `eslint.config.js`).
- Export inline on the declaration (`export const ServiceCard = …`). Do not add a separate `export { … }` at the bottom of the file that declares it (re-exports in `index.ts` barrels are fine).
- Lazy routes use React Router's `lazy` with the named export, never a default export:

```tsx
// src/portals/business/business.routes.tsx
import type { RouteObject } from "react-router";
import { ROUTE_PATH } from "@/shared/constants";

export const businessRoutes: RouteObject[] = [
  {
    lazy: async (): Promise<Pick<RouteObject, "Component">> => {
      const { ServicesPage } = await import("./features/services");
      return { Component: ServicesPage };
    },
    path: ROUTE_PATH.BUSINESS.SERVICES,
  },
];
```

**Correct component:**

```tsx
// src/portals/business/features/services/components/ServiceCard.tsx
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import type { ServiceCardProps } from "../models/ServiceCardProps.interface";

export const ServiceCard = ({
  onEditClick,
  service,
}: ServiceCardProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{service.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={onEditClick}>{t("services.card.editAction")}</Button>
      </CardContent>
    </Card>
  );
};
```

## 4. Descriptive names

All variables, parameters, destructured bindings and properties use full words.

### Forbidden abbreviations

| Avoid | Use instead |
| --- | --- |
| `err`, `e` (in `catch`) | `error` |
| `errorInfo` | the concrete meaning: `mutationError`, `validationError` |
| `res`, `req` | `response`, `request` |
| `cb`, `fn` | `callback`, `handler`, or a descriptive name (`onSaveCallback`) |
| `ctx` | `context` |
| `vm` | `viewModel`, or destructure the ViewModel directly |
| `val`, `tmp`, `temp` | `value`, or a descriptive name |
| `idx` | `index` |
| `btn`, `img`, `msg`, `evt` | `button`, `image`, `message`, `event` |
| `ref` | `inputRef`, `dialogRef` (what it points to) |
| `data` (alone) | the domain name: `bookingList`, `serviceDetail` |
| `e` (in handlers) | `event`, or `keyboardEvent`, `changeEvent` |

### Allowed short names

- `i`, `j` as plain loop indexes.
- `t` for the translation function returned by `useTranslation` (i18next convention, see `i18n-standards`).
- `_` for an intentionally unused parameter.

### Naming by kind

| Kind | Convention | Example |
| --- | --- | --- |
| Component, interface, type | `PascalCase` | `ServiceCard`, `ServiceCardProps` |
| Hook | `use` + `PascalCase` | `useServiceSearch` |
| Variable, function | `camelCase` | `searchTerm`, `formatPrice` |
| Boolean | `is` / `has` / `can` / `should` prefix | `isLoading`, `hasDiscount`, `canCancel` |
| Event handler (implementation) | `handle` + event | `handleEditClick` |
| Event handler (prop) | `on` + event | `onEditClick` |
| Constant object | `SCREAMING_SNAKE_CASE` | `ROUTE_PATH` (see `constants-standards`) |
| Folder | `kebab-case` | `booking-checkout/` |

**Incorrect:**

```ts
const fetchIt = async (id: string) => {
  try {
    const res = await getDoc(doc(firestore, "services", id));
    const data = res.data();
    return data;
  } catch (err) {
    console.log(err);
  }
};
```

**Correct:**

```ts
// src/portals/business/features/services/api/getServiceDetail.ts
import { doc, getDoc } from "firebase/firestore";
import { FIRESTORE_COLLECTION } from "@/shared/constants";
import { firestore } from "@/shared/lib/firebase";
import type { Nullable } from "@/shared/types";
import { mapServiceDetail } from "./mapServiceDetail";
import type { ServiceDetail } from "../models/ServiceDetail.interface";

export const getServiceDetail = async (
  businessId: string,
  serviceId: string,
): Promise<Nullable<ServiceDetail>> => {
  const serviceSnapshot = await getDoc(
    doc(
      firestore,
      FIRESTORE_COLLECTION.BUSINESSES,
      businessId,
      FIRESTORE_COLLECTION.SERVICES,
      serviceId,
    ),
  );

  return serviceSnapshot.exists() ? mapServiceDetail(serviceSnapshot) : null;
};
```

Error handling for data calls is defined in `api-query-standards` and `api-mutation-standards`. When a `catch` is needed, its parameter is `error`, typed as `unknown`.

## 5. File naming

| File | Pattern | Example |
| --- | --- | --- |
| Component | `PascalCase.tsx` | `ServiceCard.tsx` |
| Hook | `useCamelCase.ts` | `useServicesViewModel.ts` |
| Interface / type file | `PascalCase.interface.ts` / `PascalCase.types.ts` | `ServiceCardProps.interface.ts` |
| Constants | `PascalCase.constants.ts` | `ServiceFilter.constants.ts` |
| Zod schema | `PascalCase.schema.ts` | `ServiceForm.schema.ts` (see `forms-validation-standards`) |
| Utility / API function | `camelCase.ts` | `getServiceDetail.ts` |
| Unit test | `<Name>.test.ts(x)` | `ServiceCard.test.tsx` |
| Page Object | `<Name>.page.ts` | `ServicesPage.page.ts` |
| Barrel | `index.ts` | `features/services/index.ts` |

One exported component per `.tsx` file.

## 6. Types

- **Nullable types.** Never write `| null` or `| undefined` by hand. Use the utility types from `@/shared/types`:

  | Type | Resolves to | Use for |
  | --- | --- | --- |
  | `Nullable<T>` | `T \| null \| undefined` | Data that may be absent (default choice) |
  | `NullableRef<T>` | `T \| null` | React refs (`useRef<NullableRef<HTMLInputElement>>`) |
  | `NullableUndefined<T>` | `T \| undefined` | Values that are never `null` (e.g. `Array.find`) |

  `src/shared/types/Nullable.ts` is the only file allowed to contain `| null` and `| undefined`.

- Optional `?:` is allowed only for component props and function options that have a default.
- `interface` for object shapes; `type` for unions, mapped and derived types.
- No `any`. Use `unknown` and narrow it.
- No TypeScript `enum`. Use a constant object plus a derived type (`constants-standards`).
- Type-only imports use `import type` (or the inline `type` modifier).

**Incorrect:**

```ts
export interface ServiceDetail {
  description: string | null;
  imageUrl?: string;
  status: any;
}
```

**Correct:**

```ts
// src/portals/business/features/services/models/ServiceDetail.interface.ts
import type { ServiceStatus } from "@/shared/domain";
import type { Nullable } from "@/shared/types";

export interface ServiceDetail {
  description: Nullable<string>;
  durationMinutes: number;
  id: string;
  imageUrl: Nullable<string>;
  name: string;
  priceInCents: number;
  status: ServiceStatus;
}
```

## 7. Imports

- Cross-folder imports use the `@/` alias (`@/shared/components`). Relative imports are only allowed inside the same feature (`./`, `../models/…`), never with two or more `../`.
- Import another feature only through its `index.ts`; never deep-import its internal files.
- Order (enforced by the linter): external packages, then `@/` aliases, then relative paths.

## 8. Formatting and comments

- Prettier owns formatting (2 spaces, double quotes, semicolons, trailing commas, 80 columns). Do not format by hand, and do not argue with it in review.
- Comments explain *why*, not *what*. No commented-out code.
- No `console.log` in committed code. Errors go through the error handling in `api-mutation-standards`.

---

## 9. Enforced by

| Rule | Tool |
| --- | --- |
| Arrow functions only | ESLint `func-style: ["error", "expression"]`, `prefer-arrow-callback` |
| Explicit return types | `@typescript-eslint/explicit-function-return-type` |
| No default exports | `import-x/no-default-export` (off for tool config files) |
| Forbidden abbreviations | `id-denylist` (err, res, req, cb, fn, ctx, vm, val, tmp, temp, idx, btn, img, msg, evt, data, errorInfo) and `id-length` (min 2; exceptions `i`, `j`, `t`, `_`) |
| Naming by kind | `@typescript-eslint/naming-convention` |
| No hand-written `\| null` / `\| undefined` | `no-restricted-syntax` on `TSUnionType > TSNullKeyword` and `TSUnionType > TSUndefinedKeyword` (off in `Nullable.ts`) |
| No `any`, no `enum` | `@typescript-eslint/no-explicit-any`, `no-restricted-syntax` on `TSEnumDeclaration` |
| `import type` | `@typescript-eslint/consistent-type-imports` |
| No deep relative imports | `no-restricted-imports` with pattern `../../*` |
| Import order | `import-x/order` |
| No `console.log` | `no-console` |
| Formatting | Prettier + `.editorconfig` |
| Type safety | `tsc --noEmit` with `strict: true` |

`eslint.config.js`, `.prettierrc.json` and `.editorconfig` are delivered together with `AGENTS.md`, at the end of Phase 2.

## 10. Checklist

- [ ] Every function is a `const` arrow function.
- [ ] Every function, hook and component has an explicit return type (`ReactElement`, a named interface, `void`, …).
- [ ] Only named exports, declared inline. No `export default` outside tool config files.
- [ ] No forbidden abbreviations. `catch (error)`, `event` in handlers, no lone `data`.
- [ ] Booleans start with `is` / `has` / `can` / `should`. Handlers are `handleX`, props are `onX`.
- [ ] No `| null` / `| undefined`: `Nullable`, `NullableRef` or `NullableUndefined` instead.
- [ ] No `any`, no `enum`. Type-only imports use `import type`.
- [ ] Cross-folder imports use `@/`. No `../../`.
- [ ] Domain names match `domain-glossary`. No visible text literals (`i18n-standards`). No technical literals or magic numbers (`constants-standards`).
- [ ] `npm run lint` and `npm run typecheck` pass.
