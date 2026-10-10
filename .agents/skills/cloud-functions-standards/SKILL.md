---
name: cloud-functions-standards
description: Use when writing or changing code inside functions/ — callable functions (onCall), Firestore-triggered or scheduled functions, Admin SDK writes, transactions, custom claims, secrets, or their emulator tests. Covers folder layout, payload validation, HttpsError codes, permission checks on the server, reCAPTCHA verification inside the action, transactions, idempotency, Auth + Firestore rollback and registering a function.
---

# Cloud Functions Standards

This skill is the **single source of truth** for the **server side** of Cloud Functions: how a function inside `functions/` is laid out, how it validates its input, checks permissions, writes data and reports errors.

Calling a function from React (the `api/` hook, `mapFirebaseError`, toasts, cache invalidation) is **not** here: it is `api-mutation-standards` (writes) and `api-query-standards` (reads).

## Precedence

| Topic | Owner |
| --- | --- |
| Code inside `functions/`: layout, validation, `HttpsError`, transactions, idempotency, registration | **this skill** |
| Whether a write runs on the client or in a function | `api-mutation-standards` §1 |
| Calling the function from the client, mapping its errors to messages | `api-mutation-standards` |
| Who may call it, claims, tenant isolation, reCAPTCHA policy | `auth-and-roles` — wins on security |
| Entity, field and status names, allowed transitions | `domain-glossary` |
| How the function is tested | `unit-testing-standards` |
| Style (arrow functions, no abbreviations, explicit return types) | `code-style-standards` |
| Constant objects (`Object.freeze`, `as const`, A → Z keys) | `constants-standards` |

---

## 1. Layout

`functions/` is a separate Node package (`functions/package.json`, `module: NodeNext`). It **cannot import from `src/`**.

```
functions/src/
├── index.ts                          # the only entry point: re-exports every function
├── shared/
│   ├── firebaseAdmin.ts              # initializeApp() once; exports auth and firestore
│   ├── constants/                    # mirrors of src/ constants the server needs
│   └── <helper>.ts                   # helpers used by several domains (assertRecaptcha…)
└── <domain>/                         # audit, auth, billing, bookings, exports, notifications
    ├── <functionName>.ts             # one exported function per file, same name as the file
    ├── constants/                    # constants private to the domain
    ├── models/                       # <Action><Entity>Payload / Response interfaces
    └── tests/
        └── <functionName>.test.ts
```

- **One function per file**, file named like the function (`completeSubscriberSignUp.ts`). Helpers used only by that function stay private in the same file.
- Relative imports end in `.js` (`"../shared/firebaseAdmin.js"`), because the package compiles to Node ESM.
- **Mirrors:** a value the server needs from `src/` (a collection name, a status, a reserved slug list) is copied into `functions/src/shared/constants/` with a first-line comment naming its source: `// Mirror of src/constants/firestore/FirestoreCollection.constants.ts — keep in sync.` A PR that changes the source updates the mirror.
- **Payload and response types** use the same names as the client (`<Action><Entity>Payload`, `<Action><Entity>Response`, `api-mutation-standards` §2) and live in `<domain>/models/<Action><Entity>.mutation.ts`.

## 2. Anatomy of a callable

Every `onCall` handler runs these steps **in this order** and stops at the first failure:

| Step | What | Fails with |
| --- | --- | --- |
| 1. Read the payload | Parse `request.data` (§3). Never trust its shape. | `invalid-argument` |
| 2. Who is calling | `request.auth`, then its claims (§5). | `unauthenticated` / `permission-denied` |
| 3. reCAPTCHA (public forms only) | `await assertRecaptcha(payload.recaptchaToken)` (§5). | `permission-denied` / `unavailable` |
| 4. Business rules and writes | Inside a transaction when more than one document is read or written (§6). Re-check everything the client already checked. | `not-found` / `already-exists` / `failed-precondition` |
| 5. Answer | Return the smallest typed response. Never return whole documents or secrets. | — |

```ts
export const <functionName> = onCall<
  <Action><Entity>Payload,
  Promise<<Action><Entity>Response>
>(async (request) => {
  const payload = read<Action><Entity>Payload(request.data); // 1
  const callerClaims = assertSubscriber(request.auth);       // 2
  // 3 only on public callables
  return firestore.runTransaction(async (transaction) => {   // 4
    …
    return { … };                                             // 5
  });
});
```

## 3. Validating the payload

- `request.data` is `unknown` until it is parsed. Read it with a **Zod schema** (`<domain>/models/<Action><Entity>.schema.ts`, the same library as `forms-validation-standards`), or with small type guards like `verifyRecaptcha` does when the payload has one field.
- Normalize while parsing: `trim()` strings, lower-case emails and slugs.
- Limits (lengths, ranges, patterns) are the same as the form's. They come from the mirrored constants, never from new magic numbers.
- Any parse failure throws `invalid-argument`. The function never continues with a half-valid payload.

## 4. Errors

Throw `HttpsError` for every **expected** failure. Anything else (a bug, a Firestore outage) is left to throw: the client receives `internal` and the stack trace stays in the logs.

| `HttpsError` code | When | Client sees (`FirebaseError.code`) |
| --- | --- | --- |
| `invalid-argument` | Payload missing, wrong type, out of limits | `functions/invalid-argument` |
| `unauthenticated` | The function needs a signed-in user and there is none | `functions/unauthenticated` |
| `permission-denied` | Wrong role or tenant; reCAPTCHA rejected | `functions/permission-denied` |
| `not-found` | The target document does not exist | `functions/not-found` |
| `already-exists` | A unique value is taken (slug, email) | `functions/already-exists` |
| `failed-precondition` | The current state forbids the action (service with bookings, link expired or used, business not `active`) | `functions/failed-precondition` |
| `resource-exhausted` | A rate limit was hit (resend email once per minute) | `functions/resource-exhausted` |
| `unavailable` | An external service could not be reached (Google reCAPTCHA, email provider) | `functions/unavailable` |
| `internal` | Thrown for you on any non-`HttpsError` | `functions/internal` |

- The **message** is a short English sentence for developers, taken from a `<DOMAIN>_ERROR` constant. The user never sees it (`api-mutation-standards` §3).
- When one code has several meanings the client must tell apart, add a **reason** in `details`, from a constant the client mirrors:

  ```ts
  throw new HttpsError(
    "failed-precondition",
    SIGN_UP_LINK_ERROR.EXPIRED,
    { reason: SIGN_UP_LINK_ERROR_REASON.EXPIRED },
  );
  ```

- Errors must not reveal private facts. A sign-up with an email that already has an account fails with the same code and reason no matter who owns it (`auth-and-roles` §5).
- Log with `logger` from `firebase-functions` (`logger.error(message, { businessId })`), never `console`. Never log passwords, tokens or full payloads.

## 5. Who is calling

- `request.auth` is `undefined` for visitors. A function that needs a user throws `unauthenticated` first.
- Roles and tenant come **only from the token claims** (`request.auth.token.role`, `request.auth.token.businessId`, `auth-and-roles` §1). If the payload also carries a `businessId`, it must equal the claim, or the call fails with `permission-denied`.
- Read the claims through small helpers in `functions/src/shared/` (`assertSubscriber`, `assertSuperAdmin`, …) so every function checks them the same way.
- Collaborator permissions are read from their `Collaborator` document inside the function, never from the payload (`auth-and-roles` §1).
- **reCAPTCHA on public actions:** the token is verified **inside the same function** that performs the action, with the shared helper `assertRecaptcha(recaptchaToken)`, before step 4. Calling a separate `verifyRecaptcha` first and the action second can be skipped by a script that calls only the action. The `verifyRecaptcha` callable may stay for forms that verify before a client-only action (Firebase Auth sign-in).
- Claims are set only here, with `auth.setCustomUserClaims`, and only **after** the Firestore transaction commits (§6).

## 6. Transactions, idempotency and rollback

- More than one document read or written ⇒ `firestore.runTransaction`. All reads come before all writes.
- Re-check inside the transaction every rule that a concurrent call could break (a slug still free, a link still unused, a slot still open). Checks done before the transaction are only for a fast, friendly error.
- **Uniqueness** across documents uses a lock document whose id is the unique value (`businessSlugs/{slug}`): the transaction `get`s it, fails with `already-exists` if it exists, and `create`s it otherwise.
- **Idempotency:** an action the client may retry (network error, double click) is safe to run twice. Either the state makes the second run fail cleanly (`signUpCompletedAt` already set ⇒ `failed-precondition`), or the payload carries an `attemptId` stored with the result and checked first (payments).
- Timestamps come from `FieldValue.serverTimestamp()` (or `Timestamp.now()` when the value must be read back in the same call).
- **Firebase Auth is outside Firestore transactions.** When a function creates an Auth user and Firestore documents:
  1. Create the Auth user.
  2. Run the transaction. If it throws, **delete the Auth user** in a `catch`, then re-throw.
  3. Set the claims. If that fails, log it; the next call or a repair script sets them again from the stored documents.

  Nothing is left half done: no Auth user without its documents, no documents without their Auth user.

## 7. Constants, secrets and the emulator

- Constants follow `constants-standards`: `Object.freeze({ … } as const)`, keys A → Z, no magic numbers or raw strings in handlers.
- Secrets use `defineSecret("<NAME>")` and are listed in the function's `secrets` option. Real secrets are never in the code or the repo.
- Inside the Emulator Suite (`process.env.FUNCTIONS_EMULATOR === "true"`) a function may use the public test values documented by the provider (as `verifyRecaptcha` does). That switch lives in one constant, never spread across handlers.
- The seed script (`scripts/seed-emulator.ts`) is the only other place that imports `firebase-admin` (`auth-and-roles` §6).

## 8. Registering a function

A new function is complete only when, **in the same PR**:

1. `functions/src/index.ts` re-exports it: `export { deleteService } from "./bookings/deleteService.js";` (A → Z by name).
2. `FUNCTION_NAME` (`src/constants/firebase/FunctionName.constants.ts`) has the same name, so the client calls it by constant (`api-mutation-standards` §2).
3. The client `Payload` / `Response` interfaces match the server ones field by field.
4. `firestore.rules` deny client writes to whatever only the function may write, with rules tests (`auth-and-roles` §4).

## 9. Tests

Follows `unit-testing-standards` (Vitest, `node` environment, Emulator Suite, never production).

- `functions/src/<domain>/tests/<functionName>.test.ts`. Each test name starts with the KAN key of the criterion it proves.
- Call the handler through `firebase-functions-test` (`wrap(<functionName>)`) against the Auth and Firestore emulators, with a fresh dataset per test.
- At least one test per row of §2 that applies: a happy path, `invalid-argument`, a denied caller, and every business-rule error the spec lists.
- Functions with a transaction get a **concurrency** test (two calls racing for the same slug or slot ⇒ one succeeds, one fails with `already-exists`).
- Functions that create an Auth user get a **rollback** test (the transaction fails ⇒ no Auth user is left).

---

## 10. Correct example: delete a service (KAN-59)

The server side of the `api-mutation-standards` §7 example.

```ts
// functions/src/shared/constants/FirestoreCollection.constants.ts
// Mirror of src/constants/firestore/FirestoreCollection.constants.ts — keep in sync.
export const FIRESTORE_COLLECTION = Object.freeze({
  BOOKINGS: "bookings",
  BUSINESSES: "businesses",
  SERVICES: "services",
} as const);
```

```ts
// functions/src/shared/constants/BookingStatus.constants.ts
// Mirror of src/domain/booking/BookingStatus.constants.ts — keep in sync.
export const BOOKING_STATUS = Object.freeze({
  CONFIRMED: "confirmed",
  PENDING: "pending",
} as const);
```

```ts
// functions/src/bookings/constants/DeleteServiceError.constants.ts
// Developer-facing messages; the client maps the code, never shows these.
export const DELETE_SERVICE_ERROR = Object.freeze({
  HAS_ACTIVE_BOOKINGS: "The service has pending or confirmed bookings",
  INVALID_PAYLOAD: "businessId and serviceId are required strings",
  NOT_FOUND: "The service does not exist",
} as const);
```

```ts
// functions/src/bookings/models/DeleteService.mutation.ts
export interface DeleteServicePayload {
  readonly businessId: string;
  readonly serviceId: string;
}

export interface DeleteServiceResponse {
  readonly deletedServiceId: string;
}
```

```ts
// functions/src/bookings/models/DeleteService.schema.ts
import { z } from "zod";

export const deleteServicePayloadSchema = z.object({
  businessId: z.string().trim().min(1),
  serviceId: z.string().trim().min(1),
});
```

```ts
// functions/src/bookings/deleteService.ts
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { DELETE_SERVICE_ERROR } from "./constants/DeleteServiceError.constants.js";
import type {
  DeleteServicePayload,
  DeleteServiceResponse,
} from "./models/DeleteService.mutation.js";
import { deleteServicePayloadSchema } from "./models/DeleteService.schema.js";
import { assertSubscriberOf } from "../shared/assertSubscriberOf.js";
import { BOOKING_STATUS } from "../shared/constants/BookingStatus.constants.js";
import { FIRESTORE_COLLECTION } from "../shared/constants/FirestoreCollection.constants.js";
import { firestore } from "../shared/firebaseAdmin.js";

const readDeleteServicePayload = (payload: unknown): DeleteServicePayload => {
  const parseResult = deleteServicePayloadSchema.safeParse(payload);
  if (!parseResult.success) {
    throw new HttpsError("invalid-argument", DELETE_SERVICE_ERROR.INVALID_PAYLOAD);
  }
  return parseResult.data;
};

export const deleteService = onCall<
  DeleteServicePayload,
  Promise<DeleteServiceResponse>
>(async (request) => {
  const { businessId, serviceId } = readDeleteServicePayload(request.data);
  // Throws unauthenticated / permission-denied unless the caller is the
  // subscriber of this business (claim businessId === payload businessId).
  assertSubscriberOf(request.auth, businessId);

  const businessReference = firestore
    .collection(FIRESTORE_COLLECTION.BUSINESSES)
    .doc(businessId);
  const serviceReference = businessReference
    .collection(FIRESTORE_COLLECTION.SERVICES)
    .doc(serviceId);
  const activeBookingsQuery = businessReference
    .collection(FIRESTORE_COLLECTION.BOOKINGS)
    .where("serviceId", "==", serviceId)
    .where("status", "in", [BOOKING_STATUS.PENDING, BOOKING_STATUS.CONFIRMED])
    .limit(1);

  return firestore.runTransaction(async (transaction) => {
    const serviceSnapshot = await transaction.get(serviceReference);
    if (!serviceSnapshot.exists) {
      throw new HttpsError("not-found", DELETE_SERVICE_ERROR.NOT_FOUND);
    }
    const activeBookingsSnapshot = await transaction.get(activeBookingsQuery);
    if (!activeBookingsSnapshot.empty) {
      throw new HttpsError(
        "failed-precondition",
        DELETE_SERVICE_ERROR.HAS_ACTIVE_BOOKINGS,
      );
    }
    transaction.delete(serviceReference);
    return { deletedServiceId: serviceId };
  });
});
```

```ts
// functions/src/index.ts (append, A → Z)
export { deleteService } from "./bookings/deleteService.js";
```

### Incorrect

```ts
export const deleteService = onCall(async (req) => {
  const { businessId, serviceId } = req.data;
  const bookings = await db
    .collection(`businesses/${businessId}/bookings`)
    .where("serviceId", "==", serviceId)
    .where("status", "in", ["pending", "confirmed"])
    .get();
  if (!bookings.empty) throw new Error("No puedes borrar este servicio");
  await db.doc(`businesses/${businessId}/services/${serviceId}`).delete();
  return { ok: true };
});
```

Problems: the payload is trusted as is; nobody checks that the caller owns `businessId`, so any signed-in user can delete any business's services; the check and the delete are not in a transaction, so a booking created in between is lost; a plain `Error` reaches the client as `internal` and the Spanish text is a user message in the wrong place; raw collection names and statuses; `req` and `db` are abbreviations; the response is untyped.

---

## 11. Enforced by

| Rule | Tool |
| --- | --- |
| Style, no abbreviations, explicit return types | ESLint (`functions/src/**/*.ts` is linted with `src/`) |
| Types of payload and response | `tsc` in `functions/` (`npm --prefix functions run build`) |
| Permissions, errors, transactions, rollback | Function tests on the emulator (`unit-testing-standards`) |
| Client cannot write what only functions write | `firestore.rules` and its emulator tests (`auth-and-roles`) |
| Registration and mirrors in sync | Code review (`revisor-agente`), checklist below |

## 12. Checklist

- [ ] One function per file in `functions/src/<domain>/`, re-exported from `index.ts` and listed in `FUNCTION_NAME`.
- [ ] The payload is parsed (Zod or type guards) and normalized before anything else; failures throw `invalid-argument`.
- [ ] Role and tenant come from the token claims; a `businessId` in the payload must match the claim.
- [ ] Public actions verify reCAPTCHA inside the same function with `assertRecaptcha`.
- [ ] Multi-document work runs in a transaction that re-checks every rule; unique values use a lock document.
- [ ] Retries and double clicks cannot create duplicates.
- [ ] Auth user creation has a rollback; claims are set after the commit.
- [ ] Expected failures throw `HttpsError` with the code from §4 and a developer message from a constant; no private facts leak.
- [ ] No raw strings or magic numbers; mirrors of `src/` constants name their source.
- [ ] Emulator tests cover the happy path, invalid payload, denied caller, each business-rule error, and concurrency / rollback where they apply.
