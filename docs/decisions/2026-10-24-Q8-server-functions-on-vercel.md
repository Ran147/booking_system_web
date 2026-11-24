# Q8: Server functions run on Vercel, not on Firebase Cloud Functions

| Field | Value |
| --- | --- |
| Id | Q8 (`docs/decisions/open-questions.md`) |
| Status | Decided (2026-10-24): proposed by the team, confirmed by Lorenzo |
| Affects | Every callable in `functions/src`, `src/services/firebase/callFunction.ts`, `src/services/firebase/clientFunctionsFallback.ts`, `scripts/devFunctionsPlugin.ts`, `firestore.rules` |
| Leaves open | Q9: scheduled jobs and emails that react to booking changes |

## Context

- The project cannot pay for the Firebase Blaze plan, so Cloud Functions cannot be deployed. Firebase stays on the free Spark plan.
- Since Sprint 1 (PR #57 to `main`, PR #59 to `develop`), production is hosted on Vercel.
- To work without functions, Sprint 1 added `clientFunctionsFallback.ts` and opened `firestore.rules` (commit `53c2751`).

Checked in the code on 2026-10-24, that workaround has these effects:

- `callFunction` falls back to the client simulation on **any** error of the callable, not only when the function is missing.
- The simulation of `verifyRecaptcha` always returns `{ isVerified: true }`, so reCAPTCHA protects nothing.
- The simulation of `requestPasswordReset` returns `{ isRequested: true }` without sending any email.
- The plan checkout is a `setTimeout` in the browser, and the sign-up "token" is the email in the URL (`/sign-up?token=<email>`).
- `firestore.rules` lets a signed-in user:
  - create a business owned by themselves and write its subscription (activate a plan without paying);
  - create their own `users` document with any `role`;
  - create a collaborator record with their own uid in any business;
  - claim business slugs.
- `npm run test:rules` fails 4 tests: KAN-33, KAN-40, US-33 and KAN-25.
- In development, `/__api/callFunction` (`scripts/devFunctionsPlugin.ts`) runs privileged code without checking who calls it.

## Options considered

| Option | What it means | Why it was not chosen, or was |
| --- | --- | --- |
| A. Strict rules only | Restore the rules `develop` had before Sprint 1 (103 of 103 rules tests passed) and keep everything in the client | Without a server, nobody can set role claims, charge a payment or create a business safely. The subscriber sign-up and checkout flows break. |
| **B. The same functions on Vercel** | Run the existing callables in a Vercel Function that uses `firebase-admin` | **Chosen.** Reuses the tested server code, lets the rules be strict again and keeps Firebase on Spark. |
| C. Demo mode | Keep the client simulation behind an explicit flag | Not secure. Only good for a presentation. |

## Decision

1. **One Vercel Function, `api/call.ts`, runs every callable.**
   - On Hobby, without Next.js, every file in `api/` is one Vercel Function, with at most 12 per deployment.
   - With a single dispatcher the project uses 1 of the 12.
2. **The request contract:**
   - `POST /api/call` with body `{ functionName, payload }`.
   - Header `Authorization: Bearer <Firebase ID token>`. The token is optional, because some callables run for visitors.
   - The endpoint verifies the token with `firebase-admin` (`verifyIdToken`).
   - It builds the same `auth` data (`uid` and claims) that the handlers read today.
   - It rejects any `functionName` that is not in the list of registered callables.
3. **`functions/src` stays the only source of server logic.**
   - The logic of each callable moves into a plain handler that receives `(payload, auth)`.
   - The `onCall` export (emulator tests) and the Vercel dispatcher both call that same handler.
   - The rules of `cloud-functions-standards` still apply in full: payload validation, `HttpsError` codes, permission and reCAPTCHA checks on the server, transactions and idempotency.
4. **Errors keep the `HttpsError` codes.**
   - The dispatcher answers with the matching HTTP status and `{ code, message }`.
   - The client maps errors by code, as it does today.
5. **Secrets live only in server variables on Vercel.**
   - These are the service account credentials for `firebase-admin` and `RECAPTCHA_SECRET_KEY`.
   - They never have the `VITE_` prefix, so they never reach the browser bundle.
6. **The client calls the endpoint, and the simulation disappears.**
   - `callFunction` sends the request to `/api/call` with the user's ID token.
   - `clientFunctionsFallback.ts` is deleted: production never simulates a server response.
   - Local development uses the Firebase emulators, as before Sprint 1. The dev bridge is removed, or it reuses the dispatcher with the same token check.
7. **The rules go back to strict.**
   - Every write that only the server may do returns to `allow ... if false`: subscription, collaborators, business creation, business slugs, and the `role` field of `users`.
   - `firebase-admin` does not go through the rules, so the server can still do those writes.
   - Target: `npm run test:rules` passes 100%.
8. **Only claims decide the session's role.**
   - The session reads the role from the custom claims, never from the `users` document.
   - The claims are set by the server (`setCustomUserClaims`).

## Limits that apply

Vercel Hobby, from the Vercel docs read on 2026-10-24:

| Limit | Hobby | Effect here |
| --- | --- | --- |
| Functions per deployment (no framework) | 12, one per file in `api/` | One dispatcher uses 1 |
| Maximum duration | 300 s | Enough for every callable |
| Memory and CPU | 2 GB / 1 vCPU | Enough |
| Cron jobs | Once per day, ±59 min | Not enough for reminders, see Q9 |
| Runtime logs | Kept for 1 hour | Errors must be logged on purpose to be seen later |
| Archiving | After 2 weeks without calls | The next call takes at least 1 s longer |

Hobby is meant for personal, non-commercial use (Vercel fair use guidelines). This is an academic project, so it qualifies; a commercial launch needs the Pro plan or another host.

Firebase Spark allows `firebase-admin` from a server outside Google. Spark's daily Firestore quotas still apply.

## What this decision does not decide (Q9, open)

The notification specs (`functions/src/notifications/specs/SPEC.md`, KAN-163 to KAN-166) expect Cloud Functions that react to booking changes and a scheduled function for reminders. The KAN-24 email also has to reach the subscriber with the sign-up link. With option B, those still need answers:

- **Scheduled jobs:** the Hobby cron is not precise enough for reminders "N hours before the booking". The options (daily cron, an external scheduler calling the endpoint with a secret, or simpler reminder rules) are for the team.
- **Emails:** Spark has no email service for app emails, and no provider has been chosen.

While Q9 is open, nobody implements email sending or reminder scheduling. The reminder **settings** screens (KAN-99 to KAN-101) are not blocked: they only store preferences.

## Consequences and follow-up

- **Wording in the docs:** "Cloud Function" in `AGENTS.md`, the skills and the specs now means "a server callable run by the Vercel dispatcher". The specs do not need changes for this decision.
- **Docs to update with the implementation:** `cloud-functions-standards` (deploy target, registration in the dispatcher) and the stack line of `AGENTS.md`. They change in the PR that adds the dispatcher.
- **Implementation order.** Each step is a small PR against `develop`, with its spec first:
  1. Spec of the dispatcher and the request contract.
  2. The dispatcher plus `verifyRecaptcha`. It goes first because today reCAPTCHA protects nothing.
  3. The remaining callables, `callFunction` pointed at the endpoint, and deletion of `clientFunctionsFallback.ts`.
  4. Strict rules, with `test:rules` back to 100%, and the session reading the role only from claims.
- **Data migration:** the data already in production that was written by the simulation (with names like `business_id`, `owner_id` or `business_owner`) is migrated when the team decides the field and role names. That is a separate decision.
