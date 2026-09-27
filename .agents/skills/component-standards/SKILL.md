---
name: component-standards
description: Use when rendering any UI element (button, input, dialog, table, badge, pagination, loading or empty state), when tempted to write raw HTML controls, or when creating or changing a component in src/shared/components. Lists the shared component catalog (built on shadcn/ui) and the reuse and accessibility rules.
---

# Component Standards

This skill is the **single source of truth** for which UI primitive to use, how shared components are created, and their accessibility baseline.

## Precedence

| Topic | Owner |
| --- | --- |
| Which primitive to use, shared component API, accessibility | **this skill** |
| Where logic goes, feature folders, minis | `component-architecture` — wins on structure and logic |
| Colors, tokens, status tones | `theming-standards` — wins on styling |
| Form fields and validation display | `forms-validation-standards` |
| Visible text, `aria-label`, `alt` | `i18n-standards` |

---

## 1. Reuse before you create

Before writing any control:

1. Look in the catalog below (`@/shared/components`).
2. Compose or configure it (props, `variant`, `size`, `className`, children).
3. If nothing fits, build a thin wrapper **on top of** the existing primitives inside your feature.
4. Only when a second feature needs the same UI, promote it to `src/shared/components/` (§4).

If you are about to write `<button>`, `<input>`, `<select>`, `<textarea>`, `<img>`, `<table>`, `<dialog>` or `<a>` inside a feature: **stop** and use the catalog.

### Incorrect

```tsx
<div className="py-8">
  <h2 className="text-2xl font-bold text-gray-900">Mis servicios</h2>
  {isLoading && <div className="animate-spin rounded-full border-4" />}
  <button className="bg-blue-600 px-4 py-2 text-white" onClick={handleCreateClick}>
    Nuevo
  </button>
</div>
```

Problems: native `button`, custom spinner, palette colors (`theming-standards`), literal text (`i18n-standards`), a heading outside `PageTemplate`.

### Correct

```tsx
<PageTemplate title={t("services.list.title")}>
  <Button onClick={onCreateClick}>{t("services.toolbar.createAction")}</Button>
  <ViewStateSwitch emptyMessage={t("services.list.empty")} viewState={viewState}>
    <ServicesTable {...table} />
  </ViewStateSwitch>
</PageTemplate>
```

## 2. Catalog

Everything is imported from `@/shared/components`. "shadcn" means it is generated with `npx shadcn@latest add <name>` into `src/shared/components/ui/` (§3). "ours" means we build it in `src/shared/components/<kebab-name>/`.

### Layout

| Component | Source | Use for |
| --- | --- | --- |
| `PageTemplate` | ours | Every page: title, optional description and actions, content |
| `AuthTemplate` | ours | Sign-in, sign-up and password recovery screens |
| `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` | shadcn | Grouped content |
| `Separator` | shadcn | Dividers |
| `Sheet` | shadcn | Mobile sidebar and side panels |

### Actions and navigation

| Component | Source | Use for |
| --- | --- | --- |
| `Button` | shadcn | Every clickable action (`variant`: default, secondary, outline, ghost, destructive) |
| `AppLink` | ours | In-app links (React Router `Link` with button or text styles) |
| `DropdownMenu` | shadcn | Row actions, user menu |
| `Tabs` | shadcn | Switching views (agenda day / week) |
| `ThemeToggle` | ours | Light / dark / system switch (`theming-standards`) |
| `LanguageSwitcher` | ours | `es` / `en` switch (`i18n-standards`) |

### Forms (details in `forms-validation-standards`)

| Component | Source | Use for |
| --- | --- | --- |
| `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl` | shadcn | Every form field bound to React Hook Form |
| `FormMessage` | ours (on shadcn's `useFormField`) | Shows the field error translated from the `validation` namespace |
| `Input`, `Textarea`, `Select`, `Checkbox`, `Switch`, `RadioGroup`, `Label` | shadcn | Controls inside `FormControl` |
| `SearchInput` | ours | Debounced search boxes in toolbars |
| `PasswordInput` | ours | Password with show / hide toggle (KAN-35) |
| `PasswordStrengthMeter` | ours | Password rules feedback (KAN-37) |
| `DatePicker` | ours (on `Calendar` + `Popover`) | Single date selection |
| `RecaptchaField` | ours | reCAPTCHA on public forms (`auth-and-roles`) |

### Feedback and state

| Component | Source | Use for |
| --- | --- | --- |
| `ViewStateSwitch` | ours | Renders loading, error, empty or content from a `ViewState` |
| `Spinner` | ours | Inline loading indicator |
| `Skeleton` | shadcn | Placeholder while a card or row loads |
| `EmptyState`, `ErrorState` | ours | Empty and error regions (used by `ViewStateSwitch`) |
| `StatusBadge` | ours | Domain statuses with a tone (`theming-standards`) |
| `Badge` | shadcn | Neutral tags (plan features, categories) |
| `Alert` | shadcn | Inline notices (read-only subscription, KAN-49) |
| `Toaster` + `toast` | shadcn (sonner) | Success and error notifications after mutations |

### Overlays

| Component | Source | Use for |
| --- | --- | --- |
| `Dialog` | shadcn | Forms and details in a modal |
| `ConfirmDialog` | ours (on `AlertDialog`) | Every destructive or irreversible confirmation |
| `Popover`, `Tooltip` | shadcn | Small floating content |

### Data display

| Component | Source | Use for |
| --- | --- | --- |
| `Table` family | shadcn | Simple tables |
| `DataTable` | ours (on `Table`) | Lists with column config, sorting and row actions |
| `CursorPagination` | ours | Previous / next pagination backed by Firestore cursors (`api-query-standards`) |
| `ExportButton` | ours | CSV / Excel export of the current filters (`api-query-standards`) |
| `Avatar` | shadcn | Users and business logos |

## 3. The vendored `ui/` folder

- `src/shared/components/ui/` contains files generated by shadcn/ui. They use function declarations and kebab-case file names, so that folder is **excluded** from the `code-style-standards` lint rules.
- Change them only to adjust classes or variants. Never add business logic there.
- Features never import `@/shared/components/ui/…` directly. The barrel `src/shared/components/index.ts` re-exports what the catalog lists.

## 4. Building a shared component

- Folder `src/shared/components/<kebab-name>/` with `<PascalName>.tsx`, its props interface (exported from the same file or `models/`), `index.ts` and `tests/`.
- Arrow function, named export, explicit return type (`code-style-standards`).
- Variants through props mapped to class names (`cva` or a constant map). Never a copy of the component per variant.
- It receives text through props or children. A shared component only calls `useTranslation` for its own generic labels (`common` namespace, e.g. pagination).
- No Storybook in this project. Behavior is covered by unit tests with a Page Object (`unit-testing-standards`).

```ts
// src/shared/utils/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...classValues: ClassValue[]): string =>
  twMerge(clsx(classValues));
```

```ts
// src/shared/components/view-state-switch/ViewStateSwitchProps.interface.ts
import type { ReactNode } from "react";
import type { ViewState } from "@/shared/constants";

export interface ViewStateSwitchProps {
  children: ReactNode;
  emptyMessage: string;
  viewState: ViewState;
}
```

```tsx
// src/shared/components/view-state-switch/ViewStateSwitch.tsx
import type { ReactElement } from "react";
import { VIEW_STATE } from "@/shared/constants";
import type { ViewStateSwitchProps } from "./ViewStateSwitchProps.interface";
import { EmptyState } from "../empty-state/EmptyState";
import { ErrorState } from "../error-state/ErrorState";
import { Spinner } from "../spinner/Spinner";

export const ViewStateSwitch = ({
  children,
  emptyMessage,
  viewState,
}: ViewStateSwitchProps): ReactElement => {
  const contentByViewState = {
    [VIEW_STATE.EMPTY]: <EmptyState message={emptyMessage} />,
    [VIEW_STATE.ERROR]: <ErrorState />,
    [VIEW_STATE.LOADING]: <Spinner />,
    [VIEW_STATE.READY]: <>{children}</>,
  } satisfies Record<typeof viewState, ReactElement>;

  return contentByViewState[viewState];
};
```

```ts
// src/shared/components/cursor-pagination/CursorPaginationProps.interface.ts
export interface CursorPaginationProps {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  onNextPageClick: () => void;
  onPreviousPageClick: () => void;
  pageNumber: number;
  totalCount: number;
}
```

```tsx
// src/shared/components/cursor-pagination/CursorPagination.tsx
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { CursorPaginationProps } from "./CursorPaginationProps.interface";
import { Button } from "../ui/button";

export const CursorPagination = ({
  hasNextPage,
  hasPreviousPage,
  onNextPageClick,
  onPreviousPageClick,
  pageNumber,
  totalCount,
}: CursorPaginationProps): ReactElement => {
  const { t } = useTranslation();

  return (
    <nav
      aria-label={t("pagination.label")}
      className="flex items-center justify-end gap-2"
    >
      <span className="text-sm text-muted-foreground">
        {t("pagination.summary", { count: totalCount, pageNumber })}
      </span>
      <Button
        disabled={!hasPreviousPage}
        onClick={onPreviousPageClick}
        variant="outline"
      >
        {t("pagination.previousAction")}
      </Button>
      <Button
        disabled={!hasNextPage}
        onClick={onNextPageClick}
        variant="outline"
      >
        {t("pagination.nextAction")}
      </Button>
    </nav>
  );
};
```

`variant="outline"` is a typed prop value of the shadcn `Button`, not free text, so it stays inline.

**`src/i18n/locales/es/common.json`**

```json
{
  "pagination": {
    "label": "Paginación",
    "nextAction": "Siguiente",
    "previousAction": "Anterior",
    "summary_one": "Página {{pageNumber}} · {{count}} resultado",
    "summary_other": "Página {{pageNumber}} · {{count}} resultados"
  }
}
```

**`src/i18n/locales/en/common.json`**

```json
{
  "pagination": {
    "label": "Pagination",
    "nextAction": "Next",
    "previousAction": "Previous",
    "summary_one": "Page {{pageNumber}} · {{count}} result",
    "summary_other": "Page {{pageNumber}} · {{count}} results"
  }
}
```

```ts
// src/shared/components/index.ts
export { AppLink } from "./app-link/AppLink";
export { CursorPagination } from "./cursor-pagination/CursorPagination";
export type { CursorPaginationProps } from "./cursor-pagination/CursorPaginationProps.interface";
export { EmptyState } from "./empty-state/EmptyState";
export { ErrorState } from "./error-state/ErrorState";
export { FormMessage } from "./form-message/FormMessage";
export { PageTemplate } from "./page-template/PageTemplate";
export { SearchInput } from "./search-input/SearchInput";
export { Spinner } from "./spinner/Spinner";
export { StatusBadge } from "./status-badge/StatusBadge";
export { Button } from "./ui/button";
export { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
export { Input } from "./ui/input";
export { toast, Toaster } from "./ui/sonner";
export {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
export { ViewStateSwitch } from "./view-state-switch/ViewStateSwitch";
```

The barrel grows as components from the catalog are added. Only this file may import from `./ui/…`, besides the shared components themselves.

## 5. Accessibility baseline

- Every control has a visible label or a translated `aria-label`. Icon-only buttons always have `aria-label`.
- Clickable things are `Button` or `AppLink`. Never `div` or `span` with `onClick`.
- Images have a translated `alt`, or `alt=""` when decorative.
- Focus is visible in both themes (`theming-standards`). Dialogs trap focus and close with Escape (shadcn does this).
- Status is never shown by color alone: `StatusBadge` always includes the translated label.
- Tests query by role and accessible name, which also checks this section (`unit-testing-standards`).

---

## 6. Enforced by

| Rule | Tool |
| --- | --- |
| No raw `button`, `input`, `select`, `textarea`, `img`, `table`, `dialog`, `a` in features | ESLint `react/forbid-elements` in `src/portals/**` and `src/features/**` |
| No direct imports of `ui/` from features | ESLint `no-restricted-imports` pattern `@/shared/components/ui/*` |
| Accessibility basics (labels, alt, no click on `div`) | ESLint `jsx-a11y` recommended rules |
| `ui/` excluded from style rules | ESLint `ignores`/override for `src/shared/components/ui/**` |
| Accessible names exist | Tests using `getByRole(…, { name })` |

## 7. Checklist

- [ ] Searched the catalog first. No new component that duplicates an existing one.
- [ ] No raw HTML controls in features. Everything comes from `@/shared/components`.
- [ ] Features never import from `@/shared/components/ui/…`.
- [ ] New shared components live in `src/shared/components/<kebab-name>/`, have tests, and are exported from the barrel.
- [ ] Loading, empty and error states use `ViewStateSwitch`.
- [ ] Destructive actions go through `ConfirmDialog`.
- [ ] Every control has a translated label or `aria-label`; images have `alt`.
- [ ] Styling uses tokens only (`theming-standards`).
