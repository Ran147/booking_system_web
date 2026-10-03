---
name: constants-standards
description: Single source of truth for replacing hardcoded technical literals and magic numbers with @/constants, enforcing alphabetical key sorting (A-Z), Object.freeze immutability, and semantic domain grouping.
---

# Constants Standards and Magic Numbers

This skill is the **single source of truth** for:

1. Centralizing shared values into `src/constants/` (Global) vs colocating feature-private values into `constants/` (Local).
2. Replacing technical string literals and magic numbers with structured, immutable objects (`Object.freeze`, `as const`).
3. Structuring, naming, nesting, and alphabetically sorting constant objects (A $\rightarrow$ Z).
4. Respecting precedence: visible text belongs in `i18n`, domain status machines and lists (`BOOKING_STATUS`, `COLLABORATOR_PERMISSION`, `AUDIT_LOG_ACTION_TYPE`) belong in `src/domain/`.


---

## 1. Technical Literals vs User-Visible Text (Mandatory Rule)

| Type of String | Where it lives | Example |
| :--- | :--- | :--- |
| **User-Visible Text** (UI labels, titles, error messages, placeholders, button text) | `src/i18n/locales/{es,en}/*.json` | `t("home.plans.title")`, `t("validation:required")` |
| **Technical Identifier** (Route paths, Firestore collections, storage keys, DOM IDs) | `src/constants/` (Global) | `ROUTE_PATH.LANDING.HOME`, `FIRESTORE_COLLECTION.PLANS` |
| **Domain Status Values** (Booking status, subscription state, business status) | `src/constants/` or `src/domain/` | `BOOKING_STATUS.CONFIRMED`, `PLAN_STATUS.ACTIVE` |
| **Magic Numbers** (Timeouts, intervals, page limits, upload sizes, durations) | `src/constants/` | `TIMEOUTS.DEBOUNCE_SEARCH_MS`, `PAGINATION.DEFAULT_PAGE_SIZE` |

---

## 2. Global vs. Local Constants (Scope Separation)

| Scope | Location | When to use |
| :--- | :--- | :--- |
| **Global Constants** | `src/constants/` | Values shared across multiple modules/features (e.g. `ROUTE_PATH`, `FIRESTORE_COLLECTION`, `BOOKING_STATUS`, global timeouts, global pagination). |
| **Local Constants** | `<module-or-feature>/constants/` | Values strictly specific to a single component or feature (e.g. layout grid classes, feature-private default configurations). |

---

## 3. Zero Hardcoded Technical Strings or Magic Numbers in Code

Never embed raw string literals or unexplained numeric literals directly inside components, hooks, services, or utilities.

### Forbidden in Application Code:
- Raw route paths (`'/business/services'`, `'/admin/planes'`, `'/'`).
- Firestore collection names (`'businesses'`, `'bookings'`, `'plans'`).
- Status values (`'confirmed'`, `'active'`, `'cancelled'`).
- Storage keys (`'theme-mode'`, `'auth-token'`).
- Magic numbers:
  - Debounce/throttle timeouts (`300`, `500`).
  - Session inactivity timeout (`15`, `30`).
  - Pagination limits (`10`, `25`, `50`).
  - Currency conversion factors (`100` cents per unit).

### Allowed Numeric Exceptions (Do NOT create constants for these):
- Universal identity/math values: `0`, `1`, `-1` used as basic indexes, increment counters, or length checks (`array.length === 0`).
- Standard loop counters (`for (let index = 0; index < array.length; index++)`).

---

## 4. Strict Alphabetical Sorting (A $\rightarrow$ Z)

All keys inside every constant object MUST be sorted in ascending alphabetical order (A $\rightarrow$ Z) at every nesting level. This prevents duplicates, eases visual scanning, and creates clean git diffs.

### Incorrect

```javascript
// ❌ Keys out of alphabetical order
export const FIRESTORE_COLLECTION = Object.freeze({
  USERS: 'users',
  BOOKINGS: 'bookings',
  BUSINESSES: 'businesses',
});
```

### Correct

```javascript
// ✅ Keys sorted alphabetically A-Z
export const FIRESTORE_COLLECTION = Object.freeze({
  BOOKINGS: 'bookings',
  BUSINESSES: 'businesses',
  USERS: 'users',
});
```

---

## 5. Semantic Domain Grouping & Nesting

<<<<<<< HEAD
| Kind | Location | Imported as |
| --- | --- | --- |
| Shared technical constants | `src/shared/constants/<domain>/<Name>.constants.ts` | `@/shared/constants` |
| Domain statuses | `src/shared/domain/<entity>/<Entity>Status.constants.ts` | `@/shared/domain` |
| Other domain value lists (permissions, audit action types) | `src/shared/domain/<entity>/<Entity><Concept>.constants.ts` | `@/shared/domain` |
| Constants used by one feature only | `<feature>/constants/<Name>.constants.ts` | relative, inside the feature |
| Cloud Functions | `functions/src/shared/constants/<Name>.constants.ts` | relative, inside `functions/` |
=======
Group related constants into focused, domain-specific objects. When a domain has multiple subdomains, use nested objects, keeping each level sorted alphabetically.
>>>>>>> a5bdb6c (refactor(arch): reestructurar proyecto a arquitectura modular senior y configurar graphify)

### Common Domain Groupings for Booking System Web:

#### 1. Route Paths (`src/constants/routes.constants.ts`):
```javascript
export const ROUTE_PATH = Object.freeze({
  ADMIN: Object.freeze({
    AUDIT_LOG: '/admin/auditoria',
    BUSINESSES: '/admin/negocios',
    DASHBOARD: '/admin/dashboard',
    PARAMETERS: '/admin/parametros',
    PLANS: '/admin/planes',
    SUPPORT_TICKETS: '/admin/soporte',
  }),
  AUTH: Object.freeze({
    FORGOT_PASSWORD: '/auth/recuperar-clave',
    SIGN_IN: '/auth/login',
    SIGN_UP: '/auth/registro',
  }),
  BUSINESS: Object.freeze({
    CLIENTS: '/business/clientes',
    COLLABORATORS: '/business/colaboradores',
    DASHBOARD: '/business/dashboard',
    REPORTS: '/business/reportes',
    SCHEDULE: '/business/agenda',
    SERVICES: '/business/servicios',
    SETTINGS: '/business/configuracion',
    SUBSCRIPTION: '/business/suscripcion',
  }),
  CUSTOMER: Object.freeze({
    BOOKING_FLOW: '/reservar',
    MY_BOOKINGS: '/mis-reservas',
    PROFILE: '/perfil',
  }),
  LANDING: Object.freeze({
    CONTACT: '/contacto',
    HOME: '/',
    PLANS: '/planes',
  }),
});
```

<<<<<<< HEAD
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
=======
#### 2. Firestore Collections (`src/constants/firestore.constants.ts`):
```javascript
export const FIRESTORE_COLLECTION = Object.freeze({
  AUDIT_LOG: 'auditLog',
  BOOKINGS: 'bookings',
  BUSINESSES: 'businesses',
  CUSTOMERS: 'customers',
  NOTIFICATIONS: 'notifications',
  PAYMENTS: 'payments',
  PLANS: 'plans',
  PLATFORM_SETTINGS: 'platformSettings',
  SCHEDULE_BLOCKS: 'scheduleBlocks',
  SERVICES: 'services',
  SUBSCRIPTIONS: 'subscriptions',
  SUPPORT_TICKETS: 'supportTickets',
  USERS: 'users',
});
>>>>>>> a5bdb6c (refactor(arch): reestructurar proyecto a arquitectura modular senior y configurar graphify)
```

#### 3. Statuses (`src/constants/statuses.constants.ts`):
```javascript
export const BOOKING_STATUS = Object.freeze({
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  CONFIRMED: 'confirmed',
  NO_SHOW: 'no_show',
  PENDING: 'pending',
});

export const SUBSCRIPTION_STATUS = Object.freeze({
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PAST_DUE: 'past_due',
});
```

<<<<<<< HEAD
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
=======
#### 4. Timeouts & Delays (`src/constants/timeouts.constants.ts`):
```javascript
export const TIMEOUTS = Object.freeze({
  DEBOUNCE_SEARCH_MS: 300,
  POLLING_NOTIFICATION_INTERVAL_MS: 15000,
  SESSION_IDLE_TIMEOUT_MINUTES: 15,
  TOAST_DURATION_MS: 4000,
});
>>>>>>> a5bdb6c (refactor(arch): reestructurar proyecto a arquitectura modular senior y configurar graphify)
```

#### 5. Pagination Limits (`src/constants/pagination.constants.ts`):
```javascript
export const PAGINATION = Object.freeze({
  ADMIN_BUSINESSES_PER_PAGE: 20,
  ADMIN_TICKETS_PER_PAGE: 20,
  BOOKINGS_PER_PAGE: 15,
  CUSTOMERS_PER_PAGE: 20,
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_BUTTONS_SHOWN: 5,
  SERVICES_PER_PAGE: 12,
});
```

---

## 6. Key Naming Rules (`SCREAMING_SNAKE_CASE`)

1. Keys must always use `SCREAMING_SNAKE_CASE`.
2. Keys must describe **meaning and domain context**, never just the number itself (`TIMEOUTS.DEBOUNCE_SEARCH_MS`, NEVER `THREE_HUNDRED`).
3. Include explicit units in the key name whenever applicable (`_MS`, `_MINUTES`, `_PER_PAGE`, `_BYTES`).

---

## 7. Frozen Objects (`Object.freeze`)

Always wrap exported constant objects with `Object.freeze()` (including all nested child objects) to guarantee immutability at runtime.

---

## 8. Checklist Before Submitting Code

- [ ] Zero raw technical strings or magic numbers embedded directly in JSX/logic (except universal `0`, `1`, `-1`).
- [ ] User-visible text resides in `src/i18n/locales/` (not in constants).
- [ ] All keys within every constant object are sorted alphabetically from A to Z at every level.
- [ ] Constant keys use `SCREAMING_SNAKE_CASE` and describe intent with units.
- [ ] Objects and nested sub-objects are frozen with `Object.freeze()`.
- [ ] Clean barrel export from `src/constants/index.ts`.
