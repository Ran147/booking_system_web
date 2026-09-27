# Business management (KAN-174)

| Field | Value |
| --- | --- |
| Portal | admin |
| Feature folder | `src/portals/admin/features/businesses/` |
| Stories | KAN-175, KAN-176, KAN-177, KAN-178, KAN-179 |
| Status | BLOCKED (partially) |
| Depends on | Q2 (`pending` business status), Q7 (initial activation); KAN-32 subscription spec (`Payment` records, KAN-45/KAN-46); KAN-180 plans spec (`Plan`); `features/auth` spec (KAN-28, idle logout KAN-38) |

## Intent
The super admin needs one place to see every business on the platform, look into a single business's payments and restore a business that was suspended. It gives oversight of the whole ecosystem and supports billing questions without touching the business's own data.

## Actors and permissions
| Actor | Can |
| --- | --- |
| super admin (`super_admin`) | List and filter all businesses, see the activations list, see any business's payment history, reactivate a `suspended` business |
| subscriber, customer, visitor | Nothing in this feature. The admin portal redirects them (signed out → sign-in; other role → their own portal) |

## In scope
- Paginated, filterable table of all businesses (KAN-175), without the `pending` filter.
- Chronological list of activated businesses (KAN-177).
- Payment history of one business from its profile in the admin portal (KAN-178).
- Reactivating a `suspended` business (KAN-179).

## Out of scope
- Automatic activation of a business when its first payment is confirmed (KAN-176): BLOCKED, Q7.
- The `pending` business status and filter (KAN-175): BLOCKED, Q2.
- Suspending a business: the glossary allows `active`/`inactive` → `suspended` by the super admin, but no story in this epic asks for it (see Backlog issues).
- Editing a business's profile, services, bookings or customers from the admin portal.
- Refunds or manual payments by the super admin.
- Export to CSV/Excel (no story asks for it).
- Which of these actions appear in the audit log (KAN-194, Q3).

## Data
- `Business` (`businesses/{businessId}`, glossary §3): `status` (`active`, `inactive`, `suspended`; glossary §4.3), `ownerUserId`, `timeZone`, name.
  - Proposed new field `activatedAt: Date`: when the business first became `active` (KAN-177). How that first transition happens is Q7; this spec only reads the date.
  - Proposed new field `searchName` only if search by name is confirmed (AS-3).
- `Subscription` (`businesses/{businessId}/subscription/current`, glossary §4.2): plan and status shown in the table.
- `Plan` (`plans/{planId}`): plan name for display and filter.
- `Payment` (`businesses/{businessId}/payments/{paymentId}`): read only. Its fields and result values are defined by the KAN-32 subscription spec; this spec does not add any.
- `User` (`users/{userId}`): the owner's name and email shown on the profile.
- Status change used: `Business` `suspended` → `active` (KAN-179). Status changes are written only by a Cloud Function (`auth-and-roles`).

## Acceptance criteria

### KAN-175 — See a table of all registered businesses with filters by status, registration date and plan
- [ ] **AC-KAN-175-01** · happy · Given a signed-in super admin and businesses in several statuses, when they open the businesses table, then they see the first page of all businesses with name, owner email, `status` badge, plan name and registration date, sorted by registration date, newest first (AS-1), with a total count and previous/next controls. [KAN-175]
- [ ] **AC-KAN-175-02** · happy · Given the businesses table, when the super admin filters by status `active`, `inactive` or `suspended` (AS-2), then only businesses with that status are listed, the total count matches the filter and pagination restarts at page 1. [KAN-175]
- [ ] **AC-KAN-175-03** · happy · Given the businesses table, when the super admin selects a plan, then only businesses whose current subscription is on that plan are listed, including plans that are `inactive` (KAN-184). [KAN-175]
- [ ] **AC-KAN-175-04** · happy · Given the businesses table, when the super admin sets a registration date range (from / to), then only businesses registered within that range, both days included, are listed. [KAN-175]
- [ ] **AC-KAN-175-05** · happy · Given filters are applied, when the super admin reloads the page or shares its URL, then the same filters and results are shown. [KAN-175]
- [ ] **AC-KAN-175-06** · edge · Given filters that match no business, when the table loads, then an empty state with `admin:businesses.list.emptyFiltered` and an action to clear the filters is shown. [KAN-175]
- [ ] **AC-KAN-175-07** · edge · Given a "from" date later than the "to" date, when the super admin applies the range, then no query runs and `admin:businesses.list.invalidDateRange` is shown next to the range. [KAN-175]
- [ ] **AC-KAN-175-08** · error · Given the request fails because of the network, when the table loads or changes page, then an error state with `common:errors.network` and a retry action is shown, and the previous page stays visible if there was one. [KAN-175]
- [ ] **AC-KAN-175-09** · error · Given a signed-in `subscriber` or `customer`, when they open the admin businesses URL, then they are redirected to their own portal and no business data is loaded. [KAN-175]

### KAN-177 — See a chronological list of all activated businesses (date, plan and basic data), for information and traceability only
- [ ] **AC-KAN-177-01** · happy · Given businesses that have been activated, when the super admin opens the activations list, then each business appears once with its activation date (`activatedAt`), the plan it activated with (AS-4), its name and owner email, ordered from the most recent activation to the oldest, paginated. [KAN-177]
- [ ] **AC-KAN-177-02** · happy · Given the activations list, when the super admin looks at any row, then no action that changes data is offered (read-only list). [KAN-177]
- [ ] **AC-KAN-177-03** · edge · Given a business that was activated and later became `inactive` or `suspended`, when the list loads, then it still appears with its original activation date and its current `status` badge. [KAN-177]
- [ ] **AC-KAN-177-04** · edge · Given no business has ever been activated, when the list loads, then an empty state with `admin:businesses.activations.empty` is shown. [KAN-177]
- [ ] **AC-KAN-177-05** · error · Given the request fails, when the list loads, then an error state with `common:errors.network` and a retry action is shown. [KAN-177]

### KAN-178 — See the full transaction history of one business from its profile
- [ ] **AC-KAN-178-01** · happy · Given a business with payments, when the super admin opens that business's profile and its payments section, then they see its payments ordered newest first, each with date, amount shown from minor units in its currency (AS-5), plan and result as recorded (KAN-46), paginated. [KAN-178]
- [ ] **AC-KAN-178-02** · happy · Given the payment history, when the super admin moves between pages, then the business stays the same and only that business's payments are listed. [KAN-178]
- [ ] **AC-KAN-178-03** · edge · Given a business with no payments, when the section loads, then an empty state with `admin:businesses.payments.empty` is shown. [KAN-178]
- [ ] **AC-KAN-178-04** · edge · Given payments made on different days, when they are listed, then each date is shown in the business `timeZone`. [KAN-178]
- [ ] **AC-KAN-178-05** · error · Given a business id that does not exist, when the super admin opens its profile, then `common:errors.notFound` is shown and no payments are loaded. [KAN-178]
- [ ] **AC-KAN-178-06** · error · Given the request fails because of the network, when the payment history loads, then an error state with `common:errors.network` and a retry action is shown. [KAN-178]

### KAN-179 — Reactivate a previously suspended business
- [ ] **AC-KAN-179-01** · happy · Given a `suspended` business whose subscription is `active` or `past_due` (AS-6), when the super admin chooses reactivate and confirms, then the business `status` becomes `active`, the table and profile show the new badge and `admin:businesses.reactivate.success` is shown. [KAN-179]
- [ ] **AC-KAN-179-02** · happy · Given a business that was just reactivated, when its subscriber next uses the business portal, then they can create and change data again (the read-only `business:errors.readOnly` state no longer applies). [KAN-179, KAN-49]
- [ ] **AC-KAN-179-03** · edge · Given a business whose `status` is `active` or `inactive`, when the super admin views it, then the reactivate action is not offered. [KAN-179]
- [ ] **AC-KAN-179-04** · edge · Given a `suspended` business whose subscription is `expired` or `cancelled`, when the super admin tries to reactivate it, then the business stays `suspended` and `admin:businesses.reactivate.subscriptionNotActiveError` is shown. See AS-6. [KAN-179, KAN-49]
- [ ] **AC-KAN-179-05** · error · Given the business was changed by someone else so that it is no longer `suspended`, when the super admin confirms the reactivation, then nothing changes, `admin:businesses.reactivate.conflictError` is shown and the current status is reloaded. [KAN-179]
- [ ] **AC-KAN-179-06** · error · Given the request fails because of the network, when the super admin confirms, then the business keeps `suspended` and `common:errors.network` is shown. [KAN-179]
- [ ] **AC-KAN-179-07** · error · Given a caller without the `super_admin` role, when they request the reactivation directly, then the server rejects it with `common:errors.permissionDenied` and the status does not change. [KAN-179]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| KAN-176 | Q7 — checkout in the MVP or business created by hand | The whole story: automatic activation on payment confirmation, the initial `Subscription.active` / `Business.active` transitions and the owner's immediate access |
| KAN-175 (`pending` status filter only) | Q2 — does a `pending` business status exist | The `pending` option in the status filter and any badge for it |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | The businesses table is sorted by registration date (`createdAt`), newest first, with `PAGINATION.DEFAULT_PAGE_SIZE` rows per page. | AC-KAN-175-01 |
| AS-2 | The status filter also offers `suspended`, although the story lists only "activo, inactivo, pendiente", because it is a real status in the glossary. | AC-KAN-175-02 |
| AS-3 | No search by business name is required; the story only asks for status, date and plan filters. | In scope |
| AS-4 | "Plan contratado" in the activations list is the plan of the subscription at activation time, not the current plan. | AC-KAN-177-01 |
| AS-5 | Payment amounts are stored in minor units and shown in the currency recorded on the payment. Field names come from the KAN-32 spec. | AC-KAN-178-01 |
| AS-6 | Reactivation is only allowed when the subscription is `active` or `past_due`; with `expired` or `cancelled` the business would be `inactive` anyway (KAN-49), so it is rejected. The glossary shows `suspended → active` without this condition. | AC-KAN-179-01, AC-KAN-179-04 |
| AS-7 | Reactivating a business sends no email to the owner. | AC-KAN-179-01 |
| AS-8 | Registration date filters use whole days in the super admin's browser time zone. | AC-KAN-175-04 |

## Backlog issues
- KAN-176 has a typo: "duelo" means "dueño" (owner). It is also an automatic system behavior, not a super admin action, and it overlaps with KAN-22 (checkout) in epic KAN-20. Both wait on Q7.
- KAN-175 has typos: "tofos" = "todos", "cosistema" = "ecosistema".
- KAN-175 lists the status `pendiente`, which does not exist in the glossary (Q2), and omits `suspended`, which does.
- KAN-179 reactivates a `suspended` business, but no story lets the super admin suspend one. The glossary has the transition (`active`/`inactive` → `suspended`) without a KAN key. A suspension story should be added, or the transition removed.
- KAN-177 overlaps with KAN-175 (the table filtered by `active` and sorted by date gives almost the same view). Kept as separate views because KAN-177 is ordered by activation date and includes businesses that are no longer `active`.
- KAN-178 overlaps with KAN-46 (subscriber's own payment history, epic KAN-32). Both must read the same `Payment` fields.
- KAN-194 lists "suspensiones" as an audited action, but suspension has no story here.

## Non-functional
- i18n: new keys under `admin:businesses.list.*`, `admin:businesses.activations.*`, `admin:businesses.payments.*`, `admin:businesses.reactivate.*`, `admin:businesses.status.*` (badge labels). Reused: `common:errors.network`, `common:errors.notFound`, `common:errors.permissionDenied`.
- Pagination: server-side cursor pagination with `totalCount` for all three lists; filters live in the URL and reset the cursor. Every `where` + `orderBy` combination adds its composite index.
- Security: every read is allowed only for `super_admin`; the status change runs in a Cloud Function that checks the role and the glossary transition.
- Idle logout applies to the admin portal with `PlatformSettings.idleTimeoutMinutes` (KAN-182, KAN-38).
- No export and no realtime updates.
- Accessibility: the table has column headers and a caption; status badges have text, not only color; the reactivate confirmation is a dialog with focus trapped and returned to the trigger.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-175 | AC-KAN-175-01 … AC-KAN-175-09 | `tests/BusinessListScreen.test.tsx` |
| KAN-176 | BLOCKED (Q7) | — |
| KAN-177 | AC-KAN-177-01 … AC-KAN-177-05 | `tests/BusinessActivationsScreen.test.tsx` |
| KAN-178 | AC-KAN-178-01 … AC-KAN-178-06 | `tests/BusinessPaymentHistory.test.tsx` |
| KAN-179 | AC-KAN-179-01, AC-KAN-179-03, AC-KAN-179-05, AC-KAN-179-06 | `tests/BusinessProfileScreen.test.tsx` |
| KAN-179 | AC-KAN-179-02, AC-KAN-179-04, AC-KAN-179-07 | `functions/src/businesses/tests/reactivateBusiness.test.ts` |
