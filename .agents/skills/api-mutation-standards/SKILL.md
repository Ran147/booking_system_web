---
name: api-mutation-standards
description: Use when creating, updating, deleting or changing the status of any data — Firestore writes, calls to Cloud Functions (bookings, payments, admin actions, invitations, exports) — or when handling a write error, showing a success/error toast, or invalidating cached queries after a change.
---

# API Mutation Standards

This skill is the **single source of truth** for **writes**: where a write runs (client or Cloud Function), how payloads and responses are typed, how errors become translated messages, and how the cache is refreshed.

## Precedence

| Topic | Owner |
| --- | --- |
| Writes, callable functions, error mapping, cache invalidation, audit trail | **this skill** |
| Code inside `functions/` (validation, `HttpsError`, transactions, claims) | `cloud-functions-standards` |
| Permissions and tenant checks | `auth-and-roles` — wins on security |
| Allowed status transitions | `domain-glossary` |
| Query keys being invalidated | `api-query-standards` |
| Form values and field errors | `forms-validation-standards` |
| Message text | `i18n-standards` |

---

## 1. Client write or Cloud Function?

| Write | Where | Why |
| --- | --- | --- |
| Create / edit one document that rules can fully validate (service, customer note, profile, business settings) | Direct Firestore write from `api/` | Simple, fast, rules protect it |
| Anything touching several documents or needing a server check: create, confirm, reschedule or cancel a booking (KAN-69, KAN-144, KAN-158) | Callable function (transaction) | Prevents double booking |
| Delete a service only without active bookings (KAN-59) | Callable function | Needs a query the client cannot be trusted with |
| Payments, subscription changes, renewals (KAN-22, KAN-45, KAN-47, KAN-48) | Callable / scheduled function | Simulated gateway runs on the server |
| Super admin actions: approve / reject a `pending` business, suspend / reactivate business, plan and price changes, platform settings (PROP-1, PROP-2, KAN-179, KAN-181–184) | Callable function | Writes the audit entry in the same transaction |
| Plan checkout from the landing and subscriber sign-up (KAN-22, KAN-25) | Callable function | Simulated gateway, `PlanCheckout`, business `pending`, claims |
| Invite, edit, deactivate, reactivate a collaborator, change their permissions (KAN-78–86) | Callable function | Also sets Auth claims and checks `Plan.limits.maxCollaborators` |
| Emails and invitations (KAN-24, KAN-97, KAN-164) | Function triggered by the write | The client never sends email |
| Export (KAN-89, reports) | Callable `exportCollection` | See `api-query-standards` |
| Anonymize a customer (KAN-98) | Callable function | Touches bookings and customer records together |

When in doubt, use a callable function.

## 2. Types: payload and response

- Every mutation has a `<Action><Entity>Payload` and a `<Action><Entity>Response` interface in `<feature>/models/<Action><Entity>.mutation.ts`.
- Callable function names come from `FUNCTION_NAME` (`src/shared/constants/firebase/FunctionName.constants.ts`), and `functions/` exports functions with the same names.
- Generic types are always given explicitly. `unknown` or `any` payloads are not allowed.

## 3. Errors

- Every error is converted **once**, at the `api/` boundary, into a `MutationError` with `mapFirebaseError`.
- `MutationError.messageKey` is a typed key of the `common` namespace. The ViewModel shows it with `t()`.
- A feature that needs a more specific message checks `mutationError.code` against `FIREBASE_ERROR_CODE` and uses its own key.
- Field-level errors from the server go to the form with `setError` (`forms-validation-standards`).
- Never show `error.message` from Firebase to the user. It is English and technical.

## 4. After a successful write

- Invalidate the entity's broadest correct key: `queryClient.invalidateQueries({ queryKey: serviceQueryKeys.all(businessId) })`.
- Optimistic updates only for instant toggles (activate / deactivate service, KAN-57/58), always with rollback in `onError`.
- Show a success toast with a translated `…Success` key.
- Buttons that trigger a mutation are disabled while `isPending`, so nothing is submitted twice.

## 5. Status changes

Before calling a status-changing mutation, the ViewModel checks `canTransition(...)` (`domain-glossary`) to hide or disable the action. The server (function or rules) checks it again.

## 6. Audit trail

Super admin mutations write an `AuditLogEntry` (`auditLog/`) inside the same function transaction: actor, action type, target, before/after values, timestamp. The action type is an `AUDIT_LOG_ACTION_TYPE` value (`@/shared/domain`, Q3 decided 2026-09-28):

| Action | `AUDIT_LOG_ACTION_TYPE` | Story |
| --- | --- | --- |
| Approve a `pending` business | `BUSINESS_APPROVED` | PROP-1, KAN-176 |
| Reject a `pending` business (with reason) | `BUSINESS_REJECTED` | PROP-1 |
| Suspend a business | `BUSINESS_SUSPENDED` | PROP-2 |
| Reactivate a suspended business | `BUSINESS_REACTIVATED` | KAN-179 |
| Create a plan | `PLAN_CREATED` | KAN-181 |
| Edit a plan (features, billing period, limits) | `PLAN_UPDATED` | KAN-183 |
| Change a plan's price | `PLAN_PRICE_CHANGED` | KAN-183 |
| Activate / deactivate a plan | `PLAN_ACTIVATED` / `PLAN_DEACTIVATED` | KAN-184 |
| Change platform settings | `PLATFORM_SETTINGS_UPDATED` | KAN-182 |

An edit that changes the price and other fields writes one `PLAN_PRICE_CHANGED` entry and one `PLAN_UPDATED` entry. A new audited action adds its value to `AUDIT_LOG_ACTION_TYPE` and to `domain-glossary` in the same PR.

## 7. Correct example: delete a service (KAN-59)

```ts
// src/shared/constants/firebase/FunctionName.constants.ts
export const FUNCTION_NAME = {
  CANCEL_BOOKING: "cancelBooking",
  CREATE_BOOKING: "createBooking",
  DELETE_SERVICE: "deleteService",
  EXPORT_COLLECTION: "exportCollection",
} as const;

export type FunctionName = (typeof FUNCTION_NAME)[keyof typeof FUNCTION_NAME];
```

```ts
// src/shared/constants/firebase/FirebaseErrorCode.constants.ts
export const FIREBASE_ERROR_CODE = {
  FAILED_PRECONDITION: "functions/failed-precondition",
  NETWORK_REQUEST_FAILED: "auth/network-request-failed",
  NOT_FOUND: "functions/not-found",
  PERMISSION_DENIED: "permission-denied",
  UNAVAILABLE: "unavailable",
  UNKNOWN: "unknown",
} as const;
```

```ts
// src/shared/constants/i18n/ErrorMessageKey.constants.ts
export const ERROR_MESSAGE_KEY = {
  NETWORK: "errors.network",
  NOT_FOUND: "errors.notFound",
  PERMISSION_DENIED: "errors.permissionDenied",
  UNKNOWN: "errors.unknown",
} as const;

export type ErrorMessageKey =
  (typeof ERROR_MESSAGE_KEY)[keyof typeof ERROR_MESSAGE_KEY];
```

```ts
// src/shared/constants/index.ts (append)
export {
  FUNCTION_NAME,
  type FunctionName,
} from "./firebase/FunctionName.constants";
export { FIREBASE_ERROR_CODE } from "./firebase/FirebaseErrorCode.constants";
export {
  ERROR_MESSAGE_KEY,
  type ErrorMessageKey,
} from "./i18n/ErrorMessageKey.constants";
```

**`src/i18n/locales/es/common.json`**

```json
{
  "errors": {
    "network": "Sin conexión. Revisa tu internet e inténtalo de nuevo.",
    "notFound": "No encontramos lo que buscabas.",
    "permissionDenied": "No tienes permiso para realizar esta acción.",
    "unknown": "Ocurrió un error inesperado. Inténtalo de nuevo."
  }
}
```

**`src/i18n/locales/en/common.json`**

```json
{
  "errors": {
    "network": "You are offline. Check your connection and try again.",
    "notFound": "We could not find what you were looking for.",
    "permissionDenied": "You do not have permission to do this.",
    "unknown": "Something went wrong. Please try again."
  }
}
```

```ts
// src/shared/types/MutationError.ts
import type { ErrorMessageKey } from "@/shared/constants";

export interface MutationError {
  code: string;
  messageKey: ErrorMessageKey;
}
```

```ts
// src/shared/types/index.ts (append)
export type * from "./MutationError";
```

```ts
// src/shared/lib/firebase/mapFirebaseError.ts
import { FirebaseError } from "firebase/app";
import {
  ERROR_MESSAGE_KEY,
  FIREBASE_ERROR_CODE,
  type ErrorMessageKey,
} from "@/shared/constants";
import type { MutationError } from "@/shared/types";

const MESSAGE_KEY_BY_CODE: Readonly<Record<string, ErrorMessageKey>> = {
  [FIREBASE_ERROR_CODE.NETWORK_REQUEST_FAILED]: ERROR_MESSAGE_KEY.NETWORK,
  [FIREBASE_ERROR_CODE.NOT_FOUND]: ERROR_MESSAGE_KEY.NOT_FOUND,
  [FIREBASE_ERROR_CODE.PERMISSION_DENIED]: ERROR_MESSAGE_KEY.PERMISSION_DENIED,
  [FIREBASE_ERROR_CODE.UNAVAILABLE]: ERROR_MESSAGE_KEY.NETWORK,
};

export const mapFirebaseError = (error: unknown): MutationError => {
  if (error instanceof FirebaseError) {
    return {
      code: error.code,
      messageKey: MESSAGE_KEY_BY_CODE[error.code] ?? ERROR_MESSAGE_KEY.UNKNOWN,
    };
  }

  return {
    code: FIREBASE_ERROR_CODE.UNKNOWN,
    messageKey: ERROR_MESSAGE_KEY.UNKNOWN,
  };
};
```

```ts
// src/shared/lib/firebase/callFunction.ts
import { httpsCallable } from "firebase/functions";
import type { FunctionName } from "@/shared/constants";
import { functions } from "./firebaseApp";

export const callFunction = async <Payload, Response>(
  functionName: FunctionName,
  payload: Payload,
): Promise<Response> => {
  const callable = httpsCallable<Payload, Response>(functions, functionName);
  const callableResult = await callable(payload);
  return callableResult.data;
};
```

```ts
// src/portals/business/features/services/models/DeleteService.mutation.ts
export interface DeleteServicePayload {
  businessId: string;
  serviceId: string;
}

export interface DeleteServiceResponse {
  deletedServiceId: string;
}
```

```ts
// src/portals/business/features/services/api/useDeleteServiceMutation.ts
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from "@tanstack/react-query";
import { FUNCTION_NAME } from "@/shared/constants";
import { callFunction, mapFirebaseError } from "@/shared/lib/firebase";
import type { MutationError } from "@/shared/types";
import { serviceQueryKeys } from "./serviceQueryKeys";
import type {
  DeleteServicePayload,
  DeleteServiceResponse,
} from "../models/DeleteService.mutation";

export const useDeleteServiceMutation = (): UseMutationResult<
  DeleteServiceResponse,
  MutationError,
  DeleteServicePayload
> => {
  const queryClient = useQueryClient();

  return useMutation<
    DeleteServiceResponse,
    MutationError,
    DeleteServicePayload
  >({
    mutationFn: async (deleteServicePayload) => {
      try {
        return await callFunction<DeleteServicePayload, DeleteServiceResponse>(
          FUNCTION_NAME.DELETE_SERVICE,
          deleteServicePayload,
        );
      } catch (error) {
        throw mapFirebaseError(error);
      }
    },
    onSuccess: async (_deleteServiceResponse, deleteServicePayload) => {
      await queryClient.invalidateQueries({
        queryKey: serviceQueryKeys.all(deleteServicePayload.businessId),
      });
    },
  });
};
```

Using it in a ViewModel, with a feature-specific message for the precondition error:

```ts
// src/portals/business/features/services/models/UseDeleteServiceActionReturn.interface.ts
export interface UseDeleteServiceActionReturn {
  handleDeleteConfirm: (serviceId: string) => void;
  isDeleting: boolean;
}
```

```ts
// src/portals/business/features/services/hooks/useDeleteServiceAction.ts
import { useTranslation } from "react-i18next";
import { useCurrentBusiness } from "@/features/auth";
import { toast } from "@/shared/components";
import { FIREBASE_ERROR_CODE, I18N_NAMESPACE } from "@/shared/constants";
import type { MutationError } from "@/shared/types";
import { useDeleteServiceMutation } from "../api/useDeleteServiceMutation";
import type { UseDeleteServiceActionReturn } from "../models/UseDeleteServiceActionReturn.interface";

export const useDeleteServiceAction = (): UseDeleteServiceActionReturn => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const { businessId } = useCurrentBusiness();
  const deleteServiceMutation = useDeleteServiceMutation();

  const handleDeleteError = (mutationError: MutationError): void => {
    const errorMessage =
      mutationError.code === FIREBASE_ERROR_CODE.FAILED_PRECONDITION
        ? t("business:services.delete.hasBookingsError")
        : t(`common:${mutationError.messageKey}`);
    toast.error(errorMessage);
  };

  return {
    handleDeleteConfirm: (serviceId: string): void => {
      deleteServiceMutation.mutate(
        { businessId, serviceId },
        {
          onError: handleDeleteError,
          onSuccess: () => {
            toast.success(t("business:services.delete.success"));
          },
        },
      );
    },
    isDeleting: deleteServiceMutation.isPending,
  };
};
```

**`src/i18n/locales/es/business.json`**

```json
{
  "services": {
    "delete": {
      "hasBookingsError": "No puedes eliminar un servicio con reservas pendientes o confirmadas.",
      "success": "Servicio eliminado."
    }
  }
}
```

**`src/i18n/locales/en/business.json`**

```json
{
  "services": {
    "delete": {
      "hasBookingsError": "You cannot delete a service with pending or confirmed bookings.",
      "success": "Service deleted."
    }
  }
}
```

### Incorrect (the teacher's original, with its syntax error and loose error handling)

```ts
const { mutateAsync: myFeatureMutation } = useApiMutation
  MyFeaturePayload,
  MyFeatureResponse
>(API.ROUTES.MY_FEATURE);

try {
  await myFeatureMutation(payload);
} catch (errorInfo) {
  alert(errorInfo.message);
}
```

Problems: the opening `<` of the generic is missing; `errorInfo` is a forbidden name; the raw English message reaches the user; no cache invalidation.

## 8. Direct Firestore writes

For simple single-document writes (§1), the `api/` function uses `setDoc` / `updateDoc` with `serverTimestamp()` for `createdAt` / `updatedAt`, writes derived fields such as `searchName` (`api-query-standards`), and is wrapped in a `use<Action><Entity>Mutation` hook exactly like the example above.

---

## 9. Enforced by

| Rule | Tool |
| --- | --- |
| Only `api/` imports `firebase/firestore` and `firebase/functions` | ESLint `no-restricted-imports` (see `api-query-standards`) |
| Typed payloads | `tsc` (`callFunction` requires both generics to be inferred or given) |
| No `alert` / `window.confirm` | ESLint `no-alert` |
| Server-side checks | `firestore.rules` and function tests with the emulator (`unit-testing-standards`) |

## 10. Checklist

- [ ] The write runs where §1 says (client for one simple document, function for anything else).
- [ ] `<Action><Entity>Payload` and `Response` interfaces exist in `models/<Action><Entity>.mutation.ts`.
- [ ] Callable names come from `FUNCTION_NAME` and match `functions/`.
- [ ] Errors go through `mapFirebaseError`; the UI shows translated keys only.
- [ ] The entity's queries are invalidated on success; optimistic updates only for toggles, with rollback.
- [ ] Buttons are disabled while `isPending`.
- [ ] Status changes are checked with `canTransition` before calling.
- [ ] Super admin actions write an audit entry with its `AUDIT_LOG_ACTION_TYPE` value in the same transaction.
