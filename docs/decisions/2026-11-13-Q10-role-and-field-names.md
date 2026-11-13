# Q10: One set of names for roles, claims and owner fields

| Field | Value |
| --- | --- |
| Id | Q10 (`docs/decisions/open-questions.md`) |
| Status | Decided (2026-11-13): agreed by Randy and Lorenzo |
| Affects | `api/callFunction.ts`, `functions/src`, `src/domain/user`, `src/modules/auth`, `firestore.rules`, `scripts/` and the accounts already in the real project |

## Context

Two sets of names coexist since Sprint 1:

| Concept | Legacy name (Sprint 1, production) | Canonical name (specs, glossary, code) |
| --- | --- | --- |
| Business owner role | `business_owner` | `subscriber` |
| End customer role | `client` | `customer` |
| Business claim and `users` field | `business_id` | `businessId` |
| Owner of a business | `owner_id` | `ownerUserId` |

The sign-up on Vercel wrote both names at the same time (`businessId` and `business_id`, `ownerUserId` and `owner_id`) and the role `business_owner`. On 2026-11-07 the real project `practica1webcourse` had 9 accounts, all `business_owner`. To keep them working, `firestore.rules`, `api/callFunction.ts`, `functions/src/shared` and the client accept both sets.

## Decision

Only the canonical names are used:

- **Roles** (claim `role` and `users/{uid}.role`, which must match): `subscriber`, `collaborator`, `customer`, `super_admin`.
- **Claims:** `role`; `businessId` for `subscriber` and `collaborator`; `collaboratorId` for `collaborator`. The business always comes from the claim, never from the URL or a form.
- **Business:** `businesses/{businessId}.ownerUserId` is the owner's uid.
- **Collaborator:** `businesses/{businessId}/collaborators/{collaboratorId}` with `userId`, `fullName`, `email`, `status` (`invited`, `active`, `inactive`), `serviceIds` (array) and `permissions` (array of `manage_bookings`, `manage_customers`, `manage_schedule_blocks`, `manage_services`, `view_reports`).

## Plan

1. **Write only canonical names** (this change): the Vercel sign-up, `completeSubscriberSignUp`, the client fallback and `scripts/provision-business-account.ts`. Reading still accepts both sets, so nothing breaks.
2. **Migrate the existing accounts** of the real project with a one-off script run by a project owner: claims to `{ role: "subscriber", businessId }`, `users` documents to `role: "subscriber"` without `business_id`, businesses without `owner_id`. The script shows the plan by default and only writes with `--apply`.
3. **Remove the compatibility** once no account uses the legacy names: `USER_ROLE.BUSINESS_OWNER` and `USER_ROLE.CLIENT`, the `business_id` and `owner_id` fallbacks in `firestore.rules`, `api/callFunction.ts`, `functions/src/shared` and `src/modules/auth`.

## Out of scope

Other legacy snake_case fields on `Business` (`plan_id`, `reviewed_by`) are not used by the code that reads businesses; they can be cleaned in step 3 or left until a story needs them.
