# View personal data — KAN-169 (KAN-168)

| Field | Value |
| --- | --- |
| Portal | customer |
| Feature folder | `src/modules/customer/features/profile/` |
| Stories | KAN-169 — Consultar datos personales |
| Epic | KAN-168 — Perfil y configuración |
| Status | Draft — specification only; implementation not started |
| Baseline | `02019d44fc101280766e49f7a3218fbe9d48661b`, current remote develop verified on 2026-11-23 |
| Branch | `KAN-168/HU-169-view-profile-v3`; initially clean, identical to origin/develop (0 ahead / 0 behind) |
| Depends on | Existing session provider, customer routes/layout, own-user Firestore read permission, shared QueryClient and common components |

## Intent, actor and preconditions

A signed-in `customer` can inspect the full name, email and phone associated with their own global account, in a read-only page inside the business portal they are visiting. **The only functional actor and canonical role is `customer`.** `client` is solely the legacy spelling already accepted by the current customer route guard, not a second actor or a new role introduced by KAN-169.

Q10 (`docs/decisions/2026-11-13-Q10-role-and-field-names.md`, Decision and Plan) requires canonical names for writes. Its staged plan explicitly keeps reads accepting both sets during migration and removes compatibility once no account uses legacy names. The current develop guard still accepts CLIENT and CUSTOMER; this source inspection does not establish whether production migration has completed. KAN-169 inherits that existing guard without adding compatibility layers, writing `client`, provisioning legacy accounts or making legacy support permanent. Removing the shared compatibility belongs to Q10's migration/removal step, not this read-only story; when that shared guard changes, the profile inherits its canonical-only behavior.

Preconditions: Firebase session resolution has finished with a permitted role and a nonempty `session.userId`; the business slug resolves through the existing customer layout. A missing user document is a supported page state, not a failed authentication requirement when valid role claims already establish the session.

This document is the standalone, story-specific specification requested under `docs/specs/`, following the dated US/KAN naming already used there. It does not reuse previous KAN-169 implementations or redefine the existing epic-level specification. Other stories of KAN-168 remain outside this deliverable.

## In scope

- Read only `users/{session.userId}` and display full name, email and phone.
- Visible profile access from the customer portal home and a return link preserving the business slug.
- Loading, recoverable read errors, retry, missing document and incomplete fields.
- Ownership, role authorization, account-isolated queries, direct route refresh, Spanish/English copy and accessible responsive presentation.

## Out of scope

KAN-170 editing, KAN-171 password changes, KAN-172 language settings, KAN-173 theme settings and KAN-203 reminders are excluded, rather than classified as deferred from the MVP. No edit action, editable inputs, form, profile creation, writes, email synchronization, Auth-email fallback, Firebase Admin changes, development scripts, devFunctionsPlugin, emulator bootstrap, infrastructure, general authentication refactor or unrelated rules changes are included. Q9 email delivery and scheduling are unrelated to this read.

## Current architecture and evidence

| Area | Baseline evidence and implication |
| --- | --- |
| User contract | `src/domain/user/` contains role and validation constants/utilities, but no complete runtime User entity/schema. Use a feature-specific read projection, not an invented global User contract. |
| Stored profile | `scripts/seed-emulator.ts`, `writeUserProfile`, writes `email`, `fullName`, `phone`, `language`, `theme`. `functions/src/billing/completeSubscriberSignUp.ts` also writes user documents, with optional phone normalized to null; these subscriber writes are not a customer registration implementation. |
| Existing profile reads | `src/modules/auth/api/UserLanguageDocument.schema.ts` projects only language. Business settings project language/theme separately. Neither is a reusable personal-data projection. `functions/src/bookings/handlers/handleCreateBooking.ts` reads the three profile fields to build customer data; do not reuse a booking snapshot as this page's source. |
| Lifecycle | Auth password/Google login read claims, optionally read the user document for legacy role resolution, and read language; they do not create a complete customer profile. No implemented customer registration writer was found in the customer module. Existing accounts and seeded documents suffice; KAN-169 must not fill missing data or create documents. |
| Session | `AuthProvider` delegates to `useAuthSessionController` and `subscribeToSession`; `onAuthStateChanged` resolves a Session. `Session.types.ts` distinguishes loading, signed out and signed in; only the latter has `userId`, role and nullable business/collaborator IDs. `mapTokenClaimsToSession` takes identity from Auth UID, not profile fields. |
| Role compatibility | `src/domain/user/UserRole.constants.ts` still includes `client` and `business_owner`. `customer.routes.tsx` explicitly allows CLIENT and CUSTOMER. This is existing transitional read compatibility under Q10's staged plan, not two functional customer actors. |
| Routes | `appRoutes.tsx` combines static portal routes with `customer.routes.tsx`, rooted at `/:businessSlug`. The index is public; booking and my-bookings routes are nested under RequireRole. No profile route currently exists. |
| Layout | `CustomerLayout.tsx` resolves business public data by slug before rendering Outlet. Loading, error and missing-business states can prevent the profile page from mounting. Pending/rejected businesses resolve as missing in `fetchBusinessPublicProfileBySlug.ts`. Preserve this behavior. |
| Home/navigation | `placeholder/CustomerPlaceholderPage.tsx` uses PageTemplate, Cards and AppLink for booking and my bookings. Add a lightweight profile entry here without mounting the profile query on the home page. |
| Login | `useRoleGateTargets` preserves the current protected location in the sign-in redirect; `useRedirectAfterSignIn` prefers a safe redirectTo. Without that, PORTAL_HOME_BY_ROLE sends customer/client to `/`. Landing navbar resolvePortalPath also returns `/` for them. |
| UI | Common Card family, PageTemplate, AppLink, Spinner, EmptyState, ErrorState, Button and ViewStateSwitch exist. ErrorState accepts a mapped message key; ViewStateSwitch itself has no retry prop and renders a generic ErrorState. Compose the error branch and a common Button locally rather than redesigning that shared switch. |
| Queries | `src/app/providers/query/queryClient.ts` uses 30 s stale time, 300 s garbage collection, one retry and no window-focus refetch, via QUERY_DEFAULTS. Feature queries live in api with key factories. `mapFirebaseError` handles unavailable/network, permission denied, not found and unknown. |
| Session cleanup | `useSignOut.ts` navigates then clears QueryClient. `subscribeToSession` does not clear cache for every external Auth transition. The landing navbar also uses direct Firebase signOut; do not assume all logout paths clear cache. |
| Refresh | Existing `firebase.json` and `vercel.json` rewrite app routes to index.html. A profile deep link needs route registration and session/layout rehydration, not new hosting configuration. |
| Tests | `renderWithProviders`, `renderRoutesWithProviders`, feature Page Objects, router tests and `tests/rules/users.rules.test.ts` already exist. MyBookingsRoutes tests mock the business lookup and assert denied roles never fetch private feature data. |

Investigation used directed source searches and reads after `graphify query` failed because the Graphify executable was unavailable. No knowledge-graph results are claimed. GitHub's develop ref was checked with `git ls-remote`; no branch, commit or production file was changed during investigation.

## Source of truth and data projection

The only source for all three visible values is **`users/{session.userId}`**: `fullName`, **`users/{session.userId}.email`**, and `phone`. This is a confirmed team decision, not an assumption or an open question. Never read `currentUser.email`, fall back to Auth, synchronize email, use booking/customer snapshots or derive identity from the business slug.

Expected feature projection: `CustomerPersonalProfile`, containing exactly `fullName`, `email`, `phone`, each a nullable string using the repository's nullable utility. The document's existence is separate: an absent document returns null; an existing document with all three fields absent remains a profile with three unavailable values.

| Input | Projection / presentation |
| --- | --- |
| Nonblank string | Trim surrounding whitespace; show as text, retaining phone punctuation and email casing otherwise. |
| Missing, undefined, null, empty or whitespace-only string | Normalize to null; show `customer:profile.fields.notProvided` for that field. |
| Number, boolean, array or object in one of these fields | Invalid document shape: typed parsing failure, safe error state; never stringify arbitrary values or show a partial invalid document. |
| Extra internal fields | Strip/ignore; never spread document data into the view model or render it. |
| Document absent | Dedicated `customer:profile.states.notFound`; no three-field placeholder card implying a document exists. |

Use a feature-local Zod document adapter in api. Do not impose registration validation (mandatory phone, email format or minimum full-name length) on historically incomplete read data. No collection, field, index, callable or database migration is introduced. Firestore returns a full document: the projection limits application/cache/display data, not the bytes authorized by Firestore.

## Security and authorization

The query is enabled only for a resolved signed-in CUSTOMER or existing CLIENT session with a nonempty userId. The view model obtains that ID exclusively from useSession. Route params, search params, form values, request payloads, document role fields and businessSlug never choose the profile ID. Do not query users as a list.

Register the page inside the existing RequireRole branch. Signed-out visitors go to sign-in with the safe profile return destination; loading sessions wait; other roles go to their existing own-portal destination. None of those states requests personal profile data. Direct Firestore reads remain protected by the existing single users match: `allow read: if isSignedIn() && request.auth.uid == userId`. This permits own reads independent of role; route authorization is narrower. Do not claim server rules deny every noncustomer's own profile read.

No rule change is needed. Existing users rules tests already prove own read succeeds, other-user read fails and anonymous read fails. Keep their guarantees. Do not display role, businessId/business_id, collaboratorId, language, theme, tokens, metadata, claims or any other field. Never include raw errors or document contents in visible errors or diagnostic logs added for this feature.

## Routing and navigation

Add CUSTOMER.PROFILE = `profile` to the existing route constants and lazy-register `/:businessSlug/profile`. Keep static top-level routes and all existing booking links intact. The slug provides portal context only; the same account shows the same personal profile across different valid business slugs.

Add a profile Card/AppLink on the existing customer home, consistent with the two existing access cards. It may follow the existing public-home pattern of linking to a protected destination: visitors then encounter RequireRole. The profile page provides a persistent AppLink back to `/${businessSlug}`, including on loading, error and missing-profile states once the page mounts. Do not use browser-history back as the only return mechanism.

Supported journeys:

KAN-169 does not redesign the global landing `/` or introduce a profile shortcut there. The expected contextual sequence is login → landing/global navigation → entry to a known business portal → `/:businessSlug` → visible Mi perfil / My profile access → `/:businessSlug/profile`. The business-entry step uses an existing known business link; the current global panel action does not supply it automatically. Preserve that architectural boundary rather than inventing a new global selector or landing shortcut.

1. Business link `/<slug>` → profile entry → sign-in if needed → `/<slug>/profile` → return to `/<slug>`.
2. Direct `/<slug>/profile` → session hydration and business resolution → permitted profile, or existing guard/layout outcome.
3. Login without redirectTo → landing `/`. Its panel action also points to `/` for customer/client; the user must follow a known business link to enter the business portal. There is no existing automatic landing-to-business selection path. KAN-169 does not invent a slug, choose a business from bookings or add a global business selector. This limitation is explicit, not a completed navigation capability.

## Query, cache and state

Use api fetch + useCustomerPersonalProfileQuery + a key factory scoped to `[FIRESTORE_COLLECTION.USERS, session.userId, profile discriminator]`. This is a global account resource: do not scope its ownership by businessId or slug. Use the shared QueryClient/default timings and regular getDoc, not realtime, pagination, persistence or a new Context. Store only the parsed three-field projection in the query result. Derive UI state in useCustomerProfileViewModel.

Never use keepPreviousData, initialData or placeholderData from another identity. On a UID/role/status change, stop rendering the previous observer's data immediately and disable unauthorized reads. Late completion of account A's request may only populate A's key, never B's key or B's view. Existing useSignOut clearing remains useful but is not the sole isolation mechanism. Do not refactor shared Auth or all logout paths in this story; test account changes even with a retained shared QueryClient. A same-account cached read may follow existing stale-time behavior.

## UI states, errors and accessibility

Use PageTemplate with a title and a bounded, centered Card (for example existing Tailwind max-width utilities), semantic theme colors, readable spacing and a semantic description list for labels/values. Long names/emails wrap without horizontal overflow at a 320 px viewport. No editable controls or edit affordances.

| State | Observable outcome |
| --- | --- |
| Session loading | Existing guard Spinner; no private request or values. |
| Business loading/error/missing | Existing CustomerLayout state; do not replace with personal-profile not-found. |
| Initial profile loading | Common Spinner with translated status text; return link remains usable. |
| Ready | Exactly the three labeled values, with per-field not-provided text. |
| Missing user document | Common EmptyState with profile-specific not-found message; return link; no auto-creation. |
| Firestore/adapter error | Common ErrorState with mapFirebaseError message key; common Button to retry the current account's query. No raw exception or stale card displayed while in the error branch. |
| Retry | Pending feedback and no duplicate retry action while a request is active; successful read replaces error with current data. Persistent failures return to error after configured retries. |

Keyboard users can activate profile, return and retry controls with visible focus. Use a page heading, semantic labels/values, alert semantics from ErrorState and accessible loading status. Validate light/dark styling without adding theme controls. These are requirements for the implementation, not claims that a visual screen has been tested in this documentation-only phase.

## i18n

Extend both `src/i18n/locales/es/customer.json` and `en/customer.json` with matching, sorted `profile` keys: `title`, `description`, `navigation.open`, `navigation.back`, `fields.fullName`, `fields.email`, `fields.phone`, `fields.notProvided`, `states.loading`, `states.notFound`, `actions.retry`. Proposed Spanish/English labels: Mi perfil / My profile; Nombre completo / Full name; Correo / Email; Teléfono / Phone; No disponible / Not provided. Reuse existing common error keys through mapFirebaseError. All visible/status/accessibility text uses translation keys. Personal values are plain text; no date/currency formatting is needed.

## Acceptance criteria

### KAN-169 — View personal data

- [ ] **AC-KAN-169-01** · happy · Given a permitted signed-in customer with a complete own user document, when they open their profile, then the labeled full name, email and phone match that document, including when the Auth email differs; the page is read-only and exposes no internal fields or edit action. [KAN-169]
- [ ] **AC-KAN-169-02** · edge · Given an existing document with missing, null, empty or whitespace-only values in any combination, when the profile loads, then each unavailable field shows `customer:profile.fields.notProvided`, available values remain visible, and an all-empty document is not reported as nonexistent. [KAN-169]
- [ ] **AC-KAN-169-03** · edge · Given the personal-data read has not completed, when the page is visible, then an accessible loading status appears without personal values and the return link remains operable. [KAN-169]
- [ ] **AC-KAN-169-04** · error · Given a read fails or a requested field has an invalid nonstring shape, when retries are exhausted, then a safe translated error and retry action appear without raw data; retry after recovery shows the current account's profile. [KAN-169]
- [ ] **AC-KAN-169-05** · edge · Given the signed-in account's user document does not exist, when the read completes, then `customer:profile.states.notFound` appears with return navigation and no profile is created. [KAN-169]
- [ ] **AC-KAN-169-06** · error · Given a loading session, a visitor or a signed-in role outside the existing customer guard, when the profile route is requested, then loading waits, the visitor is sent to sign-in with a safe return target, and the other role is sent to its own portal; none requests or shows personal profile data. The canonical `customer` actor can access their own profile; an existing `client` session receives the same behavior only through the guard's transitional legacy compatibility. [KAN-169]
- [ ] **AC-KAN-169-07** · error · Given customer A opens a profile URL containing a different UID in search parameters or changes the business slug to another valid business, when the page loads, then it still shows only A's own profile; an attempted direct Firestore read of B's user document is denied, as is an unauthenticated read. [KAN-169]
- [ ] **AC-KAN-169-08** · happy · Given the customer has entered a business portal at `/:businessSlug`, when they activate its visible, labeled Mi perfil / My profile access (with login and safe return if necessary), then `/:businessSlug/profile` opens with that same slug and its return link leads to the same business home; existing booking and my-bookings links still work. This access is provided within the customer portal without redesigning `/` or adding a profile shortcut there. [KAN-169]
- [ ] **AC-KAN-169-09** · edge · Given an allowed account and a resolvable business slug, when the profile URL is loaded directly or refreshed, then session and business hydration complete and the own profile renders without prior home navigation; missing businesses retain the existing layout outcome. [KAN-169]
- [ ] **AC-KAN-169-10** · error · Given account A has loaded or is still loading its profile, when session becomes signed out or changes to account B, then A's values disappear and never appear for B, including if A's request completes late or the cache was not cleared; B sees only B's own data. [KAN-169]
- [ ] **AC-KAN-169-11** · edge · Given the feature is rendered in Spanish and English, in light and dark themes, when ready/loading/error/missing-document states are inspected and its controls are used by keyboard, then all feature-introduced labels, actions, status messages and accessible names resolve through the existing i18n system with matching locale keys; loading is exposed as a named status, errors retain the common ErrorState alert semantics, and the missing-document message is exposed as a named status using the common EmptyState within a local semantic wrapper if needed. Profile, return and retry controls have accessible names and visible keyboard focus. At a 320 CSS px viewport, long full-name/email/phone values wrap without clipping, omitted information or page-level horizontal scrolling. [KAN-169]

## Expected implementation files and responsibilities

Paths below are planned, not created by this phase. Keep changes within this story.

| Path | Responsibility |
| --- | --- |
| `src/modules/customer/features/profile/pages/CustomerProfilePage.tsx` | Presentation using shared primitives; optional local presentational field-list component only if needed to keep JSX scannable. |
| `src/modules/customer/features/profile/hooks/useCustomerProfileViewModel.ts` | Session-derived identity, query state, retry and slug-preserving return destination. |
| `src/modules/customer/features/profile/models/customer-profile.model.ts` | Explicit typed/JSDoc contracts for projection and view model, following project nullable types. |
| `src/modules/customer/features/profile/api/CustomerPersonalProfileDocument.schema.ts` | Zod adapter, normalization and stripping unrelated fields. |
| `src/modules/customer/features/profile/api/fetchCustomerPersonalProfile.ts` | Single-document getDoc; null for nonexistent document. |
| `src/modules/customer/features/profile/api/useCustomerPersonalProfileQuery.ts` | Authorized enabled state and shared query behavior. |
| `src/modules/customer/features/profile/api/customerPersonalProfileQueryKeys.ts` | UID-scoped keys; constants centralized under `src/constants/` as required. |
| `src/modules/customer/features/profile/index.ts` | Feature's public page export. |
| `src/modules/customer/customer.routes.tsx`, `src/constants/routes/RoutePath.constants.ts` | Protected lazy route and path constant. |
| `src/modules/customer/placeholder/CustomerPlaceholderPage.tsx` | Small navigation entry only; no feature query or unrelated home redesign. |
| `src/i18n/locales/{es,en}/customer.json` | Matching profile translations. |

Use existing architecture, arrow functions, descriptive identifiers, explicit return types, semantic tokens, frozen sorted constants and public imports; no new implementation in shared reexport folders.

## Test strategy and traceability

Unit/component tests use fresh QueryClients with retries disabled, mocked feature api boundaries and the existing provider helpers. UI tests use a colocated Page Object with role/translated-name selectors and no assertions in the Page Object. Names cite KAN-169 and the relevant AC. The retained-client session-transition tests intentionally reuse one client across the transition; include deferred promises to prove late-response isolation.

| Story | Criteria | Planned test file (relative to profile unless stated) |
| --- | --- | --- |
| KAN-169 | 01, 02, 04, 05, 07 | `tests/CustomerPersonalProfileDocument.test.ts`, `tests/fetchCustomerPersonalProfile.test.ts` |
| KAN-169 | 01–05, 11 | `tests/CustomerProfilePage.test.tsx`, `tests/CustomerProfilePage.page.ts` |
| KAN-169 | 03, 04, 06, 07, 10 | `tests/useCustomerPersonalProfileQuery.test.tsx`, `tests/useCustomerProfileViewModel.test.tsx` |
| KAN-169 | 06, 08, 09 | `tests/CustomerProfileRoutes.test.tsx`; extend root `src/app/router/tests/appRoutes.test.tsx` and customer-home navigation coverage only where necessary |
| KAN-169 | 07 | Root `tests/rules/users.rules.test.ts`: retain existing own/other/anonymous read assertions; add a KAN-169 case only if coverage is missing, with no rule change |
| KAN-169 | 08, 09, 10 | Root `e2e/customer-profile.spec.ts`: seeded customer login/return, known business entry, direct refresh and sign-out/account-switch flow |
| KAN-169 | 11 | Existing locale parity suite plus manual keyboard, 320 px, long-text, light/dark verification |

Explicit test cases: Auth and Firestore email disagree; all combinations of absent fields; invalid field types; missing document versus failed read; unavailable/permission-denied/unknown error mapping and retry; each excluded role; loading session; malicious UID query params; two valid slugs with one account; A→signed out→B with warm cache; A request resolving after B; login redirectTo; unresolved business and successful direct refresh. Mock the independent business-profile lookup in route tests so it does not hide the private-route behavior under test.

Implementation gates: format:check, lint (zero warnings), typecheck, test:run (maxWorkers=4), test:rules and test:e2e as required by AGENTS. Build functions before emulators; follow the documented JDK requirement and cold-start procedure. Dev/seed are local integration setup, not changes to scripts or production data. This phase checks only the specification's formatting/content and diff; it does not claim that application or emulator suites were executed or that the HU passes.

## Risks, contradictions and decisions

1. Q10 defines `customer` as canonical and `client` as legacy; its Plan explicitly retains read compatibility until migration permits removal. The baseline guard still contains that compatibility. This is a transitional implementation state, not a contradictory decision or a second actor. Preserve the shared guard, add no new alias logic and leave migration/removal to Q10's separate work.
2. `docs/CONTEXTO-APP.md` describes `/customer`, while executable routing and decided Q4 use `/:businessSlug`. Follow executable routes/Q4, without changing unrelated documentation in this task.
3. Landing's customer panel destination is `/`, not a business portal. The specification supports known business links and existing redirectTo, and does not assert a nonexistent automatic journey. A global business discovery/selection experience would require separate scope.
4. The users rule currently permits own document creation, whereas the existing test named “US-33: denies creating a profile from the client” expects denial. This contradiction is **preexisting, not caused by KAN-169 and outside this HU's scope**. Own-document reading is already allowed correctly and requires **no Firestore Rules change**. Record the creation contradiction for separate correction; do not weaken rules, change that test or hide a future failing gate in KAN-169.
5. Shared session subscription and direct Auth logout paths do not uniformly clear queries. UID keys and render gating are mandatory here, with retained-cache/late-request tests; a global Auth cleanup refactor is excluded.
6. Valid claims can coexist with a missing profile; legacy fallback sessions may fail earlier when a profile is absent. Test missing-profile UI with a valid permitted claims/session fixture, without changing session resolution.

Confirmed decisions: Firestore owns all three displayed values; session.userId owns identity; businessSlug is navigation context; read-only single-document projection; no rules or infrastructure changes; existing customer/client compatibility; bounded common-component UI and feature-local retry composition. No new product decision or email-source assumption is opened.

## BLOCKED

None for the specified read-only behavior. Q9 does not apply. Existing unrelated failing verification must be reported when implementation is validated and must not be silently waived.

## Assumptions (to confirm)

None beyond the implementation design choices explicitly recorded above. Draft status denotes a reviewable specification, not authorization to implement additional stories.

## Backlog issues and related stories

KAN-169 belongs to KAN-168 in the backlog exports. KAN-170, KAN-171, KAN-172, KAN-173 and KAN-203 remain separate stories with no new criteria here. No prior KAN-169 implementation is treated as evidence. Existing epic-level criteria are not renumbered or rewritten by this standalone document.
