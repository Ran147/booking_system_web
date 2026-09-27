---
name: unit-testing-standards
description: Use when writing, updating or reviewing tests — component tests with Page Objects, ViewModel and utility tests, Firestore rules tests, Cloud Function tests — or when mapping SPEC.md acceptance criteria (KAN keys) to tests. Covers Vitest, Testing Library, the Page Object Model, renderWithProviders and the Firebase Emulator.
---

# Unit Testing Standards (Page Object Model)

This skill is the **single source of truth** for tests.

## Precedence

| Topic | Owner |
| --- | --- |
| Test tools, layout, Page Objects, mocking, coverage of acceptance criteria | **this skill** |
| What the acceptance criteria are | `backlog-to-spec` (`specs/SPEC.md`) |
| Style of test code (names, arrow functions, no `data`) | `code-style-standards` |
| Which rules the Firestore rules tests must prove | `auth-and-roles` |

---

## 1. Tools

| Layer | Package |
| --- | --- |
| Runner | Vitest (`jsdom` environment for `src/`, `node` for `functions/`) |
| Rendering | `@testing-library/react` |
| Interaction | `@testing-library/user-event` |
| Matchers | `@testing-library/jest-dom` |
| Firestore rules | `@firebase/rules-unit-testing` + Firebase Emulator Suite |
| End-to-end (critical flows only) | Playwright in `e2e/` |

Scripts: `npm test` (watch), `npm run test:run`, `npm run test:coverage`, `npm run test:rules` (starts the emulator).

## 2. Layout

Tests live **inside the feature** (`component-architecture`):

```
<feature>/tests/
├── ServicesPage.page.ts               # Page Object
├── ServicesPage.test.tsx              # component tests through the Page Object
└── useServiceListFilters.test.ts      # hook or pure logic tests, no Page Object
```

| Target | How | Page Object? |
| --- | --- | --- |
| Page / component | Render with `renderWithProviders`, act through the Page Object | Yes |
| ViewModel or other hook | `renderHook` with the same providers | No |
| Pure functions (mappers, reducers, `canTransition`, formatters) | Call directly | No |
| `firestore.rules` | Emulator tests in `tests/rules/` (root) | No |
| Cloud Functions | Emulator tests in `functions/src/**/tests/` | No |

Shared helpers live in `src/shared/test-utils/`. There is no global folder of feature Page Objects.

## 3. Page Object rules

- File `<Screen>.page.ts`, factory `create<Screen>Page` (arrow function).
- It finds elements by **role and accessible name** (`getByRole`, `getByLabelText`), with names taken from the translation files through `testI18n`. `data-testid` only when there is no accessible way.
- It exposes **actions** (`typeSearchTerm`, `clickCreate`) and **queries** (`getEmptyMessage`).
- It contains **no** `expect` and no business logic. Tests own the assertions.

## 4. Test names cite the acceptance criterion

- Every acceptance criterion in `specs/SPEC.md` has at least one test whose name starts with its KAN key: `it("KAN-55: …")`.
- Every story has at least one **error-case** test, because every spec has an error criterion (`backlog-to-spec`).
- Names describe behavior: `"KAN-58: hides an inactive service from the public catalog"`, not `"click button"`.
- Arrange · Act · Assert, one behavior per test.

## 5. Mocking

- Unit tests never reach real Firebase. Mock at the feature's `api/` boundary (`fetch…` functions or `…Mutation` hooks) with `vi.mock`.
- `firestore.rules` and Cloud Functions are tested against the **emulator**, never production.
- Fake timers for debounce and idle timeout (`vi.useFakeTimers()`), with durations from constants.
- A fresh `QueryClient` per test, with retries off.
- No snapshot tests of large DOM trees.

## 5.1 Shared helpers

```ts
// src/shared/test-utils/setupTests.ts
import "@testing-library/jest-dom/vitest";
```

`vitest.config.ts` registers this file in `setupFiles` and enables `globals: true`.

```ts
// src/shared/constants/accessibility/AriaRole.constants.ts
export const ARIA_ROLE = {
  BUTTON: "button",
  DIALOG: "dialog",
  NAVIGATION: "navigation",
  SEARCHBOX: "searchbox",
  TEXTBOX: "textbox",
} as const;
```

```ts
// src/shared/constants/index.ts (append)
export { ARIA_ROLE } from "./accessibility/AriaRole.constants";
```

```ts
// src/shared/test-utils/testI18n.ts
import { createInstance, type i18n as I18nInstance } from "i18next";
import { initReactI18next } from "react-i18next";
import { resources } from "@/i18n/resources";
import { I18N_NAMESPACE, LANGUAGE } from "@/shared/constants";

export const createTestI18n = (): I18nInstance => {
  const testI18nInstance = createInstance();
  void testI18nInstance.use(initReactI18next).init({
    defaultNS: I18N_NAMESPACE.COMMON,
    initAsync: false,
    lng: LANGUAGE.ES,
    resources,
  });
  return testI18nInstance;
};

export const testI18n = createTestI18n();
```

Tests always run in Spanish (`LANGUAGE.ES`), the reference language, so queries match what most users see.

```tsx
// src/shared/test-utils/renderWithProviders.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderResult } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import { MemoryRouter } from "react-router";
import type { Session } from "@/features/auth";
import { AuthContext } from "@/features/auth/context/AuthContext";
import { testI18n } from "./testI18n";

export interface RenderWithProvidersOptions {
  initialPath: string;
  session: Session;
}

export const renderWithProviders = (
  element: ReactElement,
  { initialPath, session }: RenderWithProvidersOptions,
): RenderResult => {
  const testQueryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false }, queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={testQueryClient}>
      <I18nextProvider i18n={testI18n}>
        <AuthContext.Provider value={{ session }}>
          <MemoryRouter initialEntries={[initialPath]}>{element}</MemoryRouter>
        </AuthContext.Provider>
      </I18nextProvider>
    </QueryClientProvider>,
  );
};
```

`test-utils/` is the one place allowed to import a feature's internal `context/` file, because tests need to inject a session.

```ts
// src/shared/test-utils/sessionFixtures.ts
import { SESSION_STATUS, type Session } from "@/features/auth";
import { USER_ROLE } from "@/shared/domain";

export const SUBSCRIBER_SESSION = {
  businessId: "business-test",
  role: USER_ROLE.SUBSCRIBER,
  status: SESSION_STATUS.SIGNED_IN,
  userId: "subscriber-test",
} as const satisfies Session;
```

Fixture values (ids, names) are test data, so they are inline literals. They are never reused outside tests.

## 6. Correct example: services list (KAN-55)

```ts
// src/portals/business/features/services/tests/ServicesPage.page.ts
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE } from "@/shared/constants";
import { testI18n } from "@/shared/test-utils/testI18n";

export interface ServicesPageObject {
  findEmptyMessage: () => Promise<HTMLElement>;
  getCreateButton: () => HTMLElement;
  getSearchInput: () => HTMLElement;
  typeSearchTerm: (searchTerm: string) => Promise<void>;
}

export const createServicesPage = (): ServicesPageObject => {
  const user = userEvent.setup();

  const getSearchInput = (): HTMLElement =>
    screen.getByLabelText(testI18n.t("business:services.toolbar.searchLabel"));

  const getCreateButton = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("business:services.toolbar.createAction"),
    });

  const findEmptyMessage = (): Promise<HTMLElement> =>
    screen.findByText(testI18n.t("business:services.list.empty"));

  const typeSearchTerm = async (searchTerm: string): Promise<void> => {
    await user.type(getSearchInput(), searchTerm);
  };

  return { findEmptyMessage, getCreateButton, getSearchInput, typeSearchTerm };
};
```

```tsx
// src/portals/business/features/services/tests/ServicesPage.test.tsx
import { ROUTE_PATH } from "@/shared/constants";
import { renderWithProviders } from "@/shared/test-utils/renderWithProviders";
import { SUBSCRIBER_SESSION } from "@/shared/test-utils/sessionFixtures";
import { ServicesPage } from "../ServicesPage";
import { createServicesPage } from "./ServicesPage.page";
import { fetchServicePage } from "../api/fetchServicePage";

vi.mock("../api/fetchServicePage");

describe("ServicesPage", () => {
  beforeEach(() => {
    vi.mocked(fetchServicePage).mockResolvedValue({
      items: [],
      nextCursor: null,
      totalCount: 0,
    });
  });

  it("KAN-55: shows the empty message when the business has no services", async () => {
    renderWithProviders(<ServicesPage />, {
      initialPath: ROUTE_PATH.BUSINESS.SERVICES,
      session: SUBSCRIBER_SESSION,
    });
    const servicesPage = createServicesPage();

    expect(await servicesPage.findEmptyMessage()).toBeInTheDocument();
  });

  it("KAN-55: queries only the signed-in subscriber's business", async () => {
    renderWithProviders(<ServicesPage />, {
      initialPath: ROUTE_PATH.BUSINESS.SERVICES,
      session: SUBSCRIBER_SESSION,
    });
    const servicesPage = createServicesPage();

    await servicesPage.findEmptyMessage();

    expect(fetchServicePage).toHaveBeenCalledWith(
      expect.objectContaining({ businessId: SUBSCRIBER_SESSION.businessId }),
    );
  });
});
```

A pure-logic test needs no Page Object:

```ts
// src/shared/domain/tests/canTransition.test.ts
import {
  BOOKING_STATUS,
  BOOKING_STATUS_TRANSITIONS,
  canTransition,
} from "@/shared/domain";

describe("canTransition for bookings", () => {
  it("KAN-73: allows completing a confirmed booking", () => {
    expect(
      canTransition(
        BOOKING_STATUS_TRANSITIONS,
        BOOKING_STATUS.CONFIRMED,
        BOOKING_STATUS.COMPLETED,
      ),
    ).toBe(true);
  });

  it("KAN-74: rejects marking a cancelled booking as no-show", () => {
    expect(
      canTransition(
        BOOKING_STATUS_TRANSITIONS,
        BOOKING_STATUS.CANCELLED,
        BOOKING_STATUS.NO_SHOW,
      ),
    ).toBe(false);
  });
});
```

Locale parity (every key in `es` exists in `en`, `i18n-standards`):

```ts
// src/i18n/tests/localeParity.test.ts
import { resources } from "../resources";

const collectKeys = (translationTree: object, keyPrefix: string): string[] =>
  Object.entries(translationTree).flatMap(([key, value]) => {
    const fullKey = keyPrefix ? `${keyPrefix}.${key}` : key;
    return typeof value === "object" && value !== null
      ? collectKeys(value, fullKey)
      : [fullKey];
  });

describe("locale parity", () => {
  it.each(Object.keys(resources.es))(
    "namespace %s has the same keys in es and en",
    (namespace) => {
      const namespaceName = namespace as keyof typeof resources.es;

      expect(collectKeys(resources.en[namespaceName], "").sort()).toEqual(
        collectKeys(resources.es[namespaceName], "").sort(),
      );
    },
  );
});
```

### Incorrect

```tsx
it("works", async () => {
  render(<ServicesPage />);
  await userEvent.type(screen.getByPlaceholderText("Buscar"), "corte");
  expect(screen.getByTestId("table")).toMatchSnapshot();
});
```

Problems: no providers or mocks (it would hit Firebase), hard-coded Spanish, raw queries in the test, snapshot instead of behavior, no KAN key, vague name.

## 7. Firestore rules tests

`tests/rules/<collection>.rules.test.ts` at the repository root uses `@firebase/rules-unit-testing` against the emulator. For every rule in `auth-and-roles` §4 there is at least one **allowed** and one **denied** case, for example:

- subscriber A can read `businesses/A/bookings`, subscriber B cannot;
- a customer cannot read another customer's booking;
- nobody can write `status` on `businesses/{id}` from the client;
- writes to a `suspended` business are denied (KAN-49).

---

## 8. Enforced by

| Rule | Tool |
| --- | --- |
| Tests pass | `npm run test:run` and `npm run test:rules` in CI and before every PR |
| Coverage | Vitest thresholds: 70 % lines for `src/portals/**`, `src/features/**`, `src/shared/domain/**` |
| No `expect` in Page Objects | ESLint `no-restricted-syntax` on `CallExpression[callee.name="expect"]` in `**/*.page.ts` |
| No snapshots | ESLint `no-restricted-properties` on `toMatchSnapshot` |
| Acceptance criteria covered | PR template checkbox: every KAN key in `SPEC.md` appears in a test name |

## 9. Checklist

- [ ] Tests live in the feature's `tests/` folder.
- [ ] UI tests act through a `*.page.ts` Page Object with no `expect`.
- [ ] Queries use roles and translated names from `testI18n`.
- [ ] Every acceptance criterion has a test named with its KAN key, including at least one error case per story.
- [ ] Firebase is mocked at `api/` in unit tests; rules and functions are tested on the emulator.
- [ ] Each test has one behavior, follows Arrange · Act · Assert and uses a fresh `QueryClient`.
- [ ] No snapshots, no real timers, no real network.
