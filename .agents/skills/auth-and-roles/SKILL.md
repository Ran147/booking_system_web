---
name: auth-and-roles
description: Use when working on sign-in, sign-up, sign-out, password recovery, email verification, inactivity logout or reCAPTCHA; when protecting a route or a portal by role; when reading the current user or business; or when writing firestore.rules, custom claims or any permission check. Covers Firebase Auth, roles, tenant isolation and read-only access.
---

# Auth and Roles

This skill is the **single source of truth** for identity, roles, tenant isolation and every permission check, in the client **and** in `firestore.rules` / Cloud Functions.

## Precedence

| Topic | Owner |
| --- | --- |
| Who can see or do what, tenant isolation, session, reCAPTCHA, idle logout | **this skill** — wins over every feature skill on security |
| Role names and actors | `domain-glossary` |
| How queries and mutations are written | `api-query-standards`, `api-mutation-standards` |
| Where the session Context lives | here (`src/features/auth/`), following `state-management` rules |

Security is enforced on the server. Client checks only decide what to show.

---

## 1. Roles and claims

| Role (`USER_ROLE`) | Portal | Custom claims |
| --- | --- | --- |
| `super_admin` | `admin` | `{ role: "super_admin" }` |
| `subscriber` | `business` | `{ role: "subscriber", businessId }` |
| `customer` | `customer` | `{ role: "customer" }` |
| visitor | `landing`, public customer pages | not signed in |
| collaborator | — | **BLOCKED — Q1** |

- Claims are set **only** by Cloud Functions: when the first payment is confirmed (subscriber, KAN-176), when a customer finishes sign-up (KAN-122), or by the `grantSuperAdmin` script for super admins.
- After a claim changes, the client refreshes the token with `getIdToken(true)`.
- A subscriber owns exactly one business. Its `businessId` comes from the claim, never from the URL.

```ts
// src/shared/domain/user/UserRole.constants.ts
export const USER_ROLE = {
  CUSTOMER: "customer",
  SUBSCRIBER: "subscriber",
  SUPER_ADMIN: "super_admin",
} as const;

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
```

```ts
// src/shared/domain/index.ts (append)
export * from "./user/UserRole.constants";
```

## 2. Session in the client

`src/features/auth/` owns the session. Its public API (`index.ts`) is:

| Export | Returns |
| --- | --- |
| `AuthProvider` | Wraps the app; listens to `onAuthStateChanged` and reads the claims |
| `useSession()` | `Session`: `{ status: "loading" }`, `{ status: "signed_out" }` or `{ status: "signed_in", userId, role, businessId }` |
| `useCurrentBusiness()` | `{ businessId }` for the signed-in subscriber; throws outside the business portal |
| `RequireRole` | Route guard (§3) |
| `useIdleTimeout` | Inactivity logout (§5) |
| `useSignOut()` | Signs out, clears the query cache and goes to sign-in |

```ts
// src/features/auth/constants/SessionStatus.constants.ts
export const SESSION_STATUS = {
  LOADING: "loading",
  SIGNED_IN: "signed_in",
  SIGNED_OUT: "signed_out",
} as const;
```

```ts
// src/features/auth/models/Session.types.ts
import type { UserRole } from "@/shared/domain";
import type { Nullable } from "@/shared/types";
import type { SESSION_STATUS } from "../constants/SessionStatus.constants";

export interface SignedInSession {
  businessId: Nullable<string>;
  role: UserRole;
  status: typeof SESSION_STATUS.SIGNED_IN;
  userId: string;
}

export type Session =
  | { status: typeof SESSION_STATUS.LOADING }
  | { status: typeof SESSION_STATUS.SIGNED_OUT }
  | SignedInSession;
```

```ts
// src/features/auth/models/AuthContextValue.interface.ts
import type { Session } from "./Session.types";

export interface AuthContextValue {
  session: Session;
}
```

```ts
// src/features/auth/context/AuthContext.ts
import { createContext } from "react";
import type { Nullable } from "@/shared/types";
import type { AuthContextValue } from "../models/AuthContextValue.interface";

export const AuthContext = createContext<Nullable<AuthContextValue>>(null);
```

```ts
// src/features/auth/hooks/useSession.ts
import { useContext } from "react";
import { PROVIDER_ERROR } from "@/shared/constants";
import { AuthContext } from "../context/AuthContext";
import type { Session } from "../models/Session.types";

export const useSession = (): Session => {
  const authContextValue = useContext(AuthContext);

  if (!authContextValue) {
    throw new Error(PROVIDER_ERROR.MISSING_AUTH_PROVIDER);
  }

  return authContextValue.session;
};
```

```ts
// src/features/auth/models/CurrentBusiness.interface.ts
export interface CurrentBusiness {
  businessId: string;
}
```

```ts
// src/features/auth/hooks/useCurrentBusiness.ts
import { PROVIDER_ERROR } from "@/shared/constants";
import { USER_ROLE } from "@/shared/domain";
import { useSession } from "./useSession";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";
import type { CurrentBusiness } from "../models/CurrentBusiness.interface";

export const useCurrentBusiness = (): CurrentBusiness => {
  const session = useSession();

  if (
    session.status !== SESSION_STATUS.SIGNED_IN ||
    session.role !== USER_ROLE.SUBSCRIBER ||
    !session.businessId
  ) {
    throw new Error(PROVIDER_ERROR.MISSING_CURRENT_BUSINESS);
  }

  return { businessId: session.businessId };
};
```

`PROVIDER_ERROR` (`theming-standards` §4) holds the developer-facing messages used by these hooks.

## 3. Route guards

Each portal's route tree is wrapped by `RequireRole` (a Decorator, `component-architecture`):

| Portal | Guard |
| --- | --- |
| `landing` | none |
| `customer` public pages (business page, catalog, availability) | none |
| `customer` private pages (my bookings, profile) | `RequireRole allowedRoles={[USER_ROLE.CUSTOMER]}` |
| `business` | `RequireRole allowedRoles={[USER_ROLE.SUBSCRIBER]}` |
| `admin` | `RequireRole allowedRoles={[USER_ROLE.SUPER_ADMIN]}` |
| sign-in, sign-up | `GuestOnly` (redirects signed-in users to their portal) |

- Signed out → redirect to `ROUTE_PATH.AUTH.SIGN_IN` with the current path as `redirectTo`.
- Wrong role → redirect to the home of the user's own portal. Never render a "403" page with data behind it.

```ts
// src/features/auth/constants/RoleGateDecision.constants.ts
export const ROLE_GATE_DECISION = {
  ALLOW: "allow",
  REDIRECT_TO_OWN_PORTAL: "redirect_to_own_portal",
  REDIRECT_TO_SIGN_IN: "redirect_to_sign_in",
  WAIT: "wait",
} as const;

export type RoleGateDecision =
  (typeof ROLE_GATE_DECISION)[keyof typeof ROLE_GATE_DECISION];
```

```ts
// src/features/auth/hooks/useRoleGate.ts
import type { UserRole } from "@/shared/domain";
import { useSession } from "./useSession";
import {
  ROLE_GATE_DECISION,
  type RoleGateDecision,
} from "../constants/RoleGateDecision.constants";
import { SESSION_STATUS } from "../constants/SessionStatus.constants";

export const useRoleGate = (
  allowedRoles: readonly UserRole[],
): RoleGateDecision => {
  const session = useSession();

  if (session.status === SESSION_STATUS.LOADING) return ROLE_GATE_DECISION.WAIT;
  if (session.status === SESSION_STATUS.SIGNED_OUT) {
    return ROLE_GATE_DECISION.REDIRECT_TO_SIGN_IN;
  }
  return allowedRoles.includes(session.role)
    ? ROLE_GATE_DECISION.ALLOW
    : ROLE_GATE_DECISION.REDIRECT_TO_OWN_PORTAL;
};
```

```tsx
// src/features/auth/components/RequireRole.tsx
import type { ReactElement } from "react";
import { Navigate, Outlet } from "react-router";
import { Spinner } from "@/shared/components";
import { ROUTE_PATH } from "@/shared/constants";
import type { UserRole } from "@/shared/domain";
import { ROLE_GATE_DECISION } from "../constants/RoleGateDecision.constants";
import { useRoleGate } from "../hooks/useRoleGate";

export interface RequireRoleProps {
  allowedRoles: readonly UserRole[];
}

export const RequireRole = ({
  allowedRoles,
}: RequireRoleProps): ReactElement => {
  const roleGateDecision = useRoleGate(allowedRoles);

  const elementByDecision = {
    [ROLE_GATE_DECISION.ALLOW]: <Outlet />,
    [ROLE_GATE_DECISION.REDIRECT_TO_OWN_PORTAL]: (
      <Navigate replace to={ROUTE_PATH.LANDING.HOME} />
    ),
    [ROLE_GATE_DECISION.REDIRECT_TO_SIGN_IN]: (
      <Navigate replace to={ROUTE_PATH.AUTH.SIGN_IN} />
    ),
    [ROLE_GATE_DECISION.WAIT]: <Spinner />,
  } satisfies Record<typeof roleGateDecision, ReactElement>;

  return elementByDecision[roleGateDecision];
};
```

The real `REDIRECT_TO_OWN_PORTAL` target is the portal root of the user's role; the landing home is shown here to keep the example short.

## 4. Server-side rules

`firestore.rules` is the real security boundary. Every collection from `domain-glossary` has rules, and every rule change has an emulator test (`unit-testing-standards`).

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isSignedIn() { return request.auth != null; }
    function hasRole(role) { return isSignedIn() && request.auth.token.role == role; }
    function isSuperAdmin() { return hasRole('super_admin'); }
    function ownsBusiness(businessId) {
      return hasRole('subscriber') && request.auth.token.businessId == businessId;
    }
    function businessIsWritable(businessId) {
      return get(/databases/$(database)/documents/businesses/$(businessId)).data.status == 'active';
    }

    match /businesses/{businessId} {
      allow read: if true;                       // public profile (KAN-112)
      allow update: if ownsBusiness(businessId)
        && !request.resource.data.diff(resource.data).affectedKeys()
             .hasAny(['status', 'ownerUserId']);  // status changes only via functions

      match /services/{serviceId} {
        allow read: if resource.data.status == 'active' || ownsBusiness(businessId) || isSuperAdmin();
        allow create, update: if ownsBusiness(businessId) && businessIsWritable(businessId);
        allow delete: if false;                   // via deleteService function (KAN-59)
      }

      match /bookings/{bookingId} {
        allow read: if ownsBusiness(businessId)
          || (hasRole('customer') && resource.data.customerUserId == request.auth.uid);
        allow write: if false;                    // only via booking functions
      }

      match /customers/{customerId} {
        allow read, write: if ownsBusiness(businessId) && businessIsWritable(businessId);
      }
    }

    match /auditLog/{auditLogEntryId} {
      allow read: if isSuperAdmin();
      allow write: if false;                      // functions only
    }
  }
}
```

Rules keep their literals: the rules language cannot import TypeScript constants. The values must match `USER_ROLE`, `FIRESTORE_COLLECTION` and the status constants.

- Customers never read other customers' bookings. Availability for the public page (KAN-139 to KAN-144) comes from a callable `getAvailability` that returns free time slots only.
- An `inactive` or `suspended` business is read-only (KAN-49): rules deny writes and the UI shows an `Alert` and disables create actions.

## 5. Sign-in flow, reCAPTCHA and inactivity

- **Sign-in (KAN-28, KAN-33 to KAN-35, KAN-128):** email + password, `PasswordInput` with show / hide, translated errors mapped from Firebase codes (`api-mutation-standards`). Never reveal whether the email exists.
- **Password recovery (KAN-36, KAN-37):** `sendPasswordResetEmail`; the same neutral message is shown whether or not the email exists.
- **reCAPTCHA:** Firebase App Check with the reCAPTCHA Enterprise provider protects Firestore and Functions for the whole app. Public forms (sign-in, sign-up, contact, recovery) also include `RecaptchaField`; its token is verified by the `verifyRecaptcha` callable before the action runs.
- **Inactivity logout (KAN-38):** `useIdleTimeout` signs the user out after `PlatformSettings.idleTimeoutMinutes` (KAN-182) without activity, with a warning dialog first. The fallback value is `DEFAULT_PLATFORM_SETTINGS.IDLE_TIMEOUT_MINUTES`.
- **Sign-out (KAN-29, KAN-110):** `signOut(auth)`, then `queryClient.clear()`, then navigate to sign-in.

```ts
// src/features/auth/hooks/useIdleTimeout.ts
import { useEffect, useRef } from "react";
import { BROWSER_EVENT } from "@/shared/constants";
import type { NullableRef } from "@/shared/types";

const ACTIVITY_EVENTS = [
  BROWSER_EVENT.KEY_DOWN,
  BROWSER_EVENT.POINTER_DOWN,
  BROWSER_EVENT.SCROLL,
] as const;

export const useIdleTimeout = (
  idleTimeoutMs: number,
  onIdle: () => void,
): void => {
  const timeoutIdRef = useRef<NullableRef<number>>(null);

  useEffect(() => {
    const restartTimer = (): void => {
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
      }
      timeoutIdRef.current = window.setTimeout(onIdle, idleTimeoutMs);
    };

    restartTimer();
    ACTIVITY_EVENTS.forEach((activityEvent) => {
      window.addEventListener(activityEvent, restartTimer, { passive: true });
    });

    return (): void => {
      if (timeoutIdRef.current !== null) {
        window.clearTimeout(timeoutIdRef.current);
      }
      ACTIVITY_EVENTS.forEach((activityEvent) => {
        window.removeEventListener(activityEvent, restartTimer);
      });
    };
  }, [idleTimeoutMs, onIdle]);
};
```

```ts
// src/features/auth/index.ts
export { RequireRole } from "./components/RequireRole";
export { SESSION_STATUS } from "./constants/SessionStatus.constants";
export { useCurrentBusiness } from "./hooks/useCurrentBusiness";
export { useIdleTimeout } from "./hooks/useIdleTimeout";
export { useSession } from "./hooks/useSession";
export type { Session } from "./models/Session.types";
```

`AuthProvider`, `GuestOnly` and `useSignOut` follow the same patterns (`theming-standards` §4 shows the provider layout) and are exported here as they are built.

---

## 6. Enforced by

| Rule | Tool |
| --- | --- |
| Rules allow and deny what this skill says | `@firebase/rules-unit-testing` tests against the emulator |
| `businessId` never read from the URL in the business portal | Code review; `useParams` is not used in `src/portals/business/**` for `businessId` |
| Claims only set by functions | No client code imports `firebase-admin` (it is only in `functions/`) |
| Sign-out clears the cache | Unit test of `useSignOut` |

## 7. Checklist

- [ ] Every new route tree is wrapped in the right guard.
- [ ] `businessId` comes from `useCurrentBusiness()`, never from the URL or a form.
- [ ] Every new collection or field has rules and an emulator test for allow **and** deny.
- [ ] Status fields and cross-document changes are written only by functions.
- [ ] Read-only businesses (inactive / suspended) cannot write, and the UI says why.
- [ ] Public forms include reCAPTCHA; auth errors never reveal whether an email exists.
- [ ] Sign-out clears the query cache.
- [ ] Nothing was added for the collaborator role while Q1 is open.
