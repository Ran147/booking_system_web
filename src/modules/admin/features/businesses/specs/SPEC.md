# Business management (KAN-174)

| Field | Value |
| --- | --- |
| Portal | admin |
| Feature folder | `src/portals/admin/features/businesses/` |
| Stories | KAN-175, KAN-176, KAN-177, KAN-178, KAN-179; PROP-1, PROP-2 (proposed, not in Jira yet) |
| Status | Draft |
| Depends on | Q2 + Q3 decided 2026-09-28 (new businesses are `pending` until the super admin approves or rejects them; audited actions); Q7 decided 2026-09-28 (plan checkout, KAN-20 spec; subscriber sign-up, KAN-26 spec); KAN-193 audit log; KAN-32 subscription spec (`Payment` records, KAN-45/KAN-46); KAN-180 plans spec (`Plan`); `features/auth` spec (KAN-28, idle logout KAN-38) |

## Intent
The super admin needs one place to see every business on the platform, approve or reject the new businesses that paid and signed up, suspend and reactivate businesses, and look into a single business's payments. It gives oversight of the whole ecosystem and supports billing questions without touching the business's own data. Every approval, rejection, suspension and reactivation is recorded in the audit log.

## Actors and permissions
| Actor | Can |
| --- | --- |
| super admin (`super_admin`) | List and filter all businesses, approve or reject a `pending` business, suspend an `active` or `inactive` business, reactivate a `suspended` business, see the activations list and any business's payment history |
| subscriber, collaborator, customer, visitor | Nothing in this feature. The admin portal redirects them (signed out → sign-in; other role → their own portal) |

## In scope
- Paginated, filterable table of all businesses (KAN-175), including the `pending` ("awaiting approval") and `rejected` filters.
- Approving or rejecting a `pending` business (PROP-1) and what approval activates (KAN-176).
- Suspending an `active` or `inactive` business (PROP-2).
- Chronological list of activated businesses (KAN-177).
- Payment history of one business from its profile in the admin portal (KAN-178).
- Reactivating a `suspended` business (KAN-179).

## Out of scope
- The plan checkout and the subscriber sign-up that create the `pending` business (KAN-22 to KAN-25, landing specs).
- The "under review" and "rejected" screens the subscriber sees (KAN-33, `src/features/auth` spec, and the business layout spec).
- Editing a business's profile, services, bookings or customers from the admin portal.
- Real refunds or manual payments by the super admin (the gateway is simulated; a rejection only marks the payment refunded, AS-10).
- Reversing a rejection (`rejected` is terminal; the owner would pay again with a new sign-up, AS-12).
- Export to CSV/Excel (no story asks for it).
- Viewing the audit log (KAN-194, audit-log spec); this spec only says which entries its actions write.

## Data
- `Business` (`businesses/{businessId}`, glossary §3): `status` (`pending`, `active`, `inactive`, `suspended`, `rejected`; glossary §4.3), `ownerUserId`, `slug`, `timeZone`, name, `createdAt` (sign-up date).
  - `planCheckoutId`: the paid `PlanCheckout` (KAN-22) the business was created from; gives the plan and amount of a `pending` business.
  - `activatedAt: Date`: when the super admin approved it (KAN-176, KAN-177). Proposed name, to confirm.
  - `rejectionReason: Nullable<string>` (PROP-1) and `suspensionReason: Nullable<string>` (PROP-2, AS-13). Proposed names, to confirm.
  - Proposed new field `searchName` only if search by name is confirmed (AS-3).
- `PlanCheckout` (`planCheckouts/{planCheckoutId}`, glossary §3): `planId`, `amountInCents`, `paidAt`, `email`. Read only.
- `Subscription` (`businesses/{businessId}/subscription/current`, glossary §4.2): created `active` on approval (KAN-176, AS-9); plan and status shown in the table. A `pending` or `rejected` business has none.
- `Plan` (`plans/{planId}`): plan name for display and filter.
- `Payment` (`businesses/{businessId}/payments/{paymentId}`): read only, except `refundedAt` set by the rejection (AS-10). Its other fields are defined by the KAN-32 subscription spec.
- `User` (`users/{userId}`): the owner's name and email shown on the profile and used for the approval, rejection and suspension emails.
- `AuditLogEntry` (`auditLog/`): `business_approved`, `business_rejected`, `business_suspended`, `business_reactivated` (`AUDIT_LOG_ACTION_TYPE`), written in the same function transaction as the status change.
- Status changes used: `pending` → `active` (PROP-1, KAN-176), `pending` → `rejected` (PROP-1), `active` / `inactive` → `suspended` (PROP-2), `suspended` → `active` (KAN-179). Status changes are written only by Cloud Functions (`auth-and-roles`).

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
- [ ] **AC-KAN-175-10** · happy · Given businesses awaiting approval, when the super admin filters by status `pending`, then only `pending` businesses are listed with the badge `admin:businesses.status.pending` ("awaiting approval"), the plan and amount they paid (from their `PlanCheckout`) and their sign-up date, each with a review action that opens the approval screen (PROP-1). [KAN-175, PROP-1]
- [ ] **AC-KAN-175-11** · happy · Given rejected businesses, when the super admin filters by status `rejected`, then only those are listed with the badge `admin:businesses.status.rejected` and their rejection reason in the row detail. [KAN-175, PROP-1]
- [ ] **AC-KAN-175-12** · error · Given a `pending` filter value typed in the URL together with a plan filter, when the table loads, then pending businesses match the plan of their `PlanCheckout`, and an unknown status value in the URL is ignored with the filter reset and `admin:businesses.list.invalidFilter` shown. [KAN-175]

### KAN-176 — The business activates automatically when the super admin approves it, giving the owner immediate access (rewritten by Q2, 2026-09-28)
The Jira text says the business activates when the subscription payment is confirmed. Q2 changed it: payment leaves the business `pending`; approval activates it. The Jira story must be reworded (see Backlog issues).

- [ ] **AC-KAN-176-01** · happy · Given a `pending` business, when the super admin approves it (AC-PROP-1-02), then in one server transaction the business becomes `active` with `activatedAt` set, a `Subscription` is created `active` on the plan of its `PlanCheckout` with the period starting at approval (AS-9), and an `AuditLogEntry` `business_approved` is written. [KAN-176, PROP-1]
- [ ] **AC-KAN-176-02** · happy · Given the owner of a business that was just approved, when they next load the business portal (or are already on the "under review" screen, which checks again), then they get full access without signing in again, and they receive the email `admin:businesses.approval.approvedEmail.*` with a link to sign in. [KAN-176, KAN-33]
- [ ] **AC-KAN-176-03** · error · Given a checkout payment was confirmed (KAN-22) and the owner finished the sign-up (KAN-25), when no super admin has approved the business yet, then it stays `pending`, has no `Subscription`, is not public and its owner sees only the "under review" screen. [KAN-176, KAN-22]
- [ ] **AC-KAN-176-04** · error · Given the activation fails on the server (for example the plan of the checkout was deleted or the write fails), when the super admin approves, then nothing changes: the business stays `pending`, no `Subscription` and no audit entry are written, and `common:errors.unknown` is shown. [KAN-176]
- [ ] **AC-KAN-176-05** · edge · Given two approvals of the same business arrive at the same time (double click or two super admins), when both are processed, then exactly one `Subscription` and one `business_approved` entry exist, and the second request gets `admin:businesses.approval.conflictError`. [KAN-176, PROP-1]
- [ ] **AC-KAN-176-06** · edge · Given the plan of the checkout was deactivated (KAN-184) while the business was `pending`, when the super admin approves it, then the subscription is still created on that plan, because inactive plans keep their subscribers. [KAN-176, KAN-184]

### KAN-177 — See a chronological list of all activated businesses (date, plan and basic data), for information and traceability only
- [ ] **AC-KAN-177-01** · happy · Given businesses that have been activated, when the super admin opens the activations list, then each business appears once with its activation date (`activatedAt`), the plan it activated with (AS-4), its name and owner email, ordered from the most recent activation to the oldest, paginated. [KAN-177]
- [ ] **AC-KAN-177-02** · happy · Given the activations list, when the super admin looks at any row, then no action that changes data is offered (read-only list). [KAN-177]
- [ ] **AC-KAN-177-03** · edge · Given a business that was activated and later became `inactive` or `suspended`, when the list loads, then it still appears with its original activation date and its current `status` badge. [KAN-177]
- [ ] **AC-KAN-177-04** · edge · Given no business has ever been activated, when the list loads, then an empty state with `admin:businesses.activations.empty` is shown. [KAN-177]
- [ ] **AC-KAN-177-05** · error · Given the request fails, when the list loads, then an error state with `common:errors.network` and a retry action is shown. [KAN-177]
- [ ] **AC-KAN-177-06** · edge · Given `pending` and `rejected` businesses, when the activations list loads, then they are not listed; a business appears only once it has been approved (`activatedAt`, KAN-176). [KAN-177, KAN-176]

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
- [ ] **AC-KAN-179-08** · happy · Given a successful reactivation, when it is written, then an `AuditLogEntry` `business_reactivated` with the super admin, the business and the previous and new status is written in the same transaction (KAN-194). [KAN-179, KAN-194]

### PROP-1 — Super admin approves or rejects a pending business (Proposed — not in Jira yet)
- [ ] **AC-PROP-1-01** · happy · Given businesses in `pending`, when the super admin opens the approval screen of one of them (from AC-KAN-175-10), then it shows the business name and `slug`, the owner's name, email and phone, the plan, amount and date of the checkout payment (`PlanCheckout`), the sign-up date, and two actions: approve and reject. [PROP-1]
- [ ] **AC-PROP-1-02** · happy · Given a `pending` business, when the super admin chooses approve and confirms, then the effects of AC-KAN-176-01 happen, the badge changes to `active` and `admin:businesses.approval.approveSuccess` is shown. [PROP-1, KAN-176]
- [ ] **AC-PROP-1-03** · happy · Given a `pending` business, when the super admin chooses reject, writes a reason and confirms, then the business becomes `rejected` with `rejectionReason`, its checkout `Payment` gets `refundedAt` (AS-10), no `Subscription` is created, the owner receives the email `admin:businesses.approval.rejectedEmail.*` with the reason, an `AuditLogEntry` `business_rejected` with the reason is written and `admin:businesses.approval.rejectSuccess` is shown. [PROP-1]
- [ ] **AC-PROP-1-04** · error · Given the reject dialog with an empty reason, or a reason outside the limits of AS-11, when the super admin confirms, then nothing changes and `validation:required`, `validation:tooShort` or `validation:tooLong` is shown on the reason. [PROP-1]
- [ ] **AC-PROP-1-05** · error · Given the business is no longer `pending` (another super admin approved or rejected it), when the super admin confirms either action, then nothing changes, `admin:businesses.approval.conflictError` is shown and the current status is reloaded. [PROP-1]
- [ ] **AC-PROP-1-06** · error · Given the request fails because of the network, when the super admin confirms either action, then the business stays `pending` and `common:errors.network` is shown. [PROP-1]
- [ ] **AC-PROP-1-07** · error · Given a caller without the `super_admin` role, when they call approve or reject directly, then the server rejects it with `common:errors.permissionDenied` and nothing changes. [PROP-1]
- [ ] **AC-PROP-1-08** · edge · Given the owner of a `rejected` business, when they sign in, then they see only the "rejected" screen with the reason and the platform contact (business layout spec); the business has no public page and its `slug` stays taken (AS-12). [PROP-1]
- [ ] **AC-PROP-1-09** · edge · Given no business is `pending`, when the super admin opens the approval queue (the `pending` filter), then `admin:businesses.approval.empty` is shown. [PROP-1]
- [ ] **AC-PROP-1-10** · edge · Given several `pending` businesses, when the `pending` filter is applied, then they are sorted by sign-up date, oldest first, so the longest-waiting business is reviewed first (AS-14). [PROP-1, KAN-175]

### PROP-2 — Super admin suspends a business (Proposed — not in Jira yet)
- [ ] **AC-PROP-2-01** · happy · Given an `active` or `inactive` business, when the super admin chooses suspend, writes a reason and confirms, then the business becomes `suspended` with `suspensionReason`, an `AuditLogEntry` `business_suspended` with the reason is written, the owner receives the email `admin:businesses.suspend.suspendedEmail.*` (AS-13) and `admin:businesses.suspend.success` is shown. [PROP-2]
- [ ] **AC-PROP-2-02** · happy · Given a business was just suspended, when its subscriber or collaborators use the business portal, then it is read-only with `business:errors.suspended`, paying is not offered (AC-KAN-45-05), and customers cannot create new bookings with it. [PROP-2, KAN-49]
- [ ] **AC-PROP-2-03** · edge · Given a business that is `pending`, `rejected` or already `suspended`, when the super admin views it, then the suspend action is not offered. [PROP-2]
- [ ] **AC-PROP-2-04** · error · Given the suspend dialog with an empty reason, when the super admin confirms, then nothing changes and `validation:required` is shown on the reason. [PROP-2]
- [ ] **AC-PROP-2-05** · error · Given the business status changed meanwhile so that it can no longer be suspended, when the super admin confirms, then nothing changes, `admin:businesses.suspend.conflictError` is shown and the current status is reloaded. [PROP-2]
- [ ] **AC-PROP-2-06** · error · Given the request fails because of the network, when the super admin confirms, then the business keeps its status and `common:errors.network` is shown. [PROP-2]
- [ ] **AC-PROP-2-07** · error · Given a caller without the `super_admin` role, when they call suspend directly, then the server rejects it with `common:errors.permissionDenied`. [PROP-2]
- [ ] **AC-PROP-2-08** · edge · Given a suspended business with `pending` or `confirmed` future bookings, when it is suspended, then those bookings are kept unchanged (AS-15). [PROP-2]

## BLOCKED
None. Q2 (the `pending` status and the approval flow) and Q7 (plan checkout, which changes KAN-176) were decided on 2026-09-28.

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | The businesses table is sorted by registration date (`createdAt`), newest first, with `PAGINATION.DEFAULT_PAGE_SIZE` rows per page. | AC-KAN-175-01 |
| AS-2 | The status filter offers all five statuses (`pending`, `active`, `inactive`, `suspended`, `rejected`), although the story lists only "activo, inactivo, pendiente". | AC-KAN-175-02, AC-KAN-175-10, AC-KAN-175-11 |
| AS-3 | No search by business name is required; the story only asks for status, date and plan filters. | In scope |
| AS-4 | "Plan contratado" in the activations list is the plan of the subscription at activation time, not the current plan. | AC-KAN-177-01 |
| AS-5 | Payment amounts are stored in minor units and shown in the currency recorded on the payment. Field names come from the KAN-32 spec. | AC-KAN-178-01 |
| AS-6 | Reactivation is only allowed when the subscription is `active` or `past_due`; with `expired` or `cancelled` the business would be `inactive` anyway (KAN-49), so it is rejected. The glossary shows `suspended → active` without this condition. | AC-KAN-179-01, AC-KAN-179-04 |
| AS-7 | Reactivating a business sends no email to the owner. | AC-KAN-179-01 |
| AS-8 | Registration date filters use whole days in the super admin's browser time zone. | AC-KAN-175-04 |
| AS-9 | The `Subscription` is created at approval, not at payment: its period starts when the super admin approves, so the owner does not lose paid days while waiting. The checkout payment pays that first period. | AC-KAN-176-01 |
| AS-10 | A rejected business's checkout payment is marked refunded (`refundedAt`) by the simulated gateway; no money moves in the MVP. | AC-PROP-1-03 |
| AS-11 | Rejection and suspension reasons are 10–500 characters, stored as written and sent to the owner. | AC-PROP-1-04, AC-PROP-2-04 |
| AS-12 | `rejected` is terminal and the rejected business keeps its `slug` (it is never reused). An owner who wants to try again pays a new checkout and signs up with another email and slug. | AC-PROP-1-08 |
| AS-13 | Suspension needs a reason, which is emailed to the owner; reactivation (KAN-179) sends no email (AS-7). | AC-PROP-2-01 |
| AS-14 | The approval queue is the businesses table filtered by `pending`, sorted oldest sign-up first; there is no separate screen or notification to super admins when a business signs up. | AC-PROP-1-09, AC-PROP-1-10 |
| AS-15 | Suspending a business does not cancel or change its bookings; it only stops new ones and makes the business read-only. | AC-PROP-2-08 |

## Backlog issues
- KAN-176 must be rewritten in Jira: the business activates when the super admin approves it (Q2), not when the payment is confirmed. It also has a typo: "duelo" means "dueño" (owner). Its criteria above follow the new wording.
- KAN-175 has typos ("tofos" = "todos", "cosistema" = "ecosistema"); its `pendiente` filter now means "awaiting approval" (Q2). The Jira text should say so and add `suspendido` and `rechazado`.
- PROP-1 (approve or reject a pending business) and PROP-2 (suspend a business) are not in Jira yet; they should be created in this epic. KAN-179 already reactivates a suspended business, and KAN-194 already audits approvals and suspensions.
- KAN-177 overlaps with KAN-175 (the table filtered by `active` and sorted by date gives almost the same view). Kept as separate views because KAN-177 is ordered by activation date and includes businesses that are no longer `active`.
- KAN-178 overlaps with KAN-46 (subscriber's own payment history, epic KAN-32). Both must read the same `Payment` fields.

## Non-functional
- i18n: new keys under `admin:businesses.list.*`, `admin:businesses.activations.*`, `admin:businesses.payments.*`, `admin:businesses.approval.*` (including the approved and rejected emails), `admin:businesses.suspend.*` (including the suspended email), `admin:businesses.reactivate.*`, `admin:businesses.status.*` (badge labels for the five statuses). Reused: `validation:required`, `validation:tooShort`, `validation:tooLong`, `common:errors.network`, `common:errors.notFound`, `common:errors.permissionDenied`, `common:errors.unknown`, `business:errors.suspended`.
- Pagination: server-side cursor pagination with `totalCount` for all three lists; filters live in the URL and reset the cursor. Every `where` + `orderBy` combination adds its composite index.
- Security: every read is allowed only for `super_admin`; every status change (approve, reject, suspend, reactivate) runs in a Cloud Function that checks the role and `BUSINESS_STATUS_TRANSITIONS` and writes its `AuditLogEntry` in the same transaction (`api-mutation-standards` §6).
- Idle logout applies to the admin portal with `PlatformSettings.idleTimeoutMinutes` (KAN-182, KAN-38).
- No export and no realtime updates.
- Accessibility: the table has column headers and a caption; status badges have text, not only color; the reactivate confirmation is a dialog with focus trapped and returned to the trigger.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-175 | AC-KAN-175-01 … AC-KAN-175-12 | `tests/BusinessListScreen.test.tsx` |
| KAN-176 | AC-KAN-176-01 … AC-KAN-176-06 | `functions/src/businesses/tests/approveBusiness.test.ts` |
| KAN-177 | AC-KAN-177-01 … AC-KAN-177-06 | `tests/BusinessActivationsScreen.test.tsx` |
| KAN-178 | AC-KAN-178-01 … AC-KAN-178-06 | `tests/BusinessPaymentHistory.test.tsx` |
| KAN-179 | AC-KAN-179-01, AC-KAN-179-03, AC-KAN-179-05, AC-KAN-179-06 | `tests/BusinessProfileScreen.test.tsx` |
| KAN-179 | AC-KAN-179-02, AC-KAN-179-04, AC-KAN-179-07, AC-KAN-179-08 | `functions/src/businesses/tests/reactivateBusiness.test.ts` |
| PROP-1 | AC-PROP-1-01 … AC-PROP-1-06, AC-PROP-1-09, AC-PROP-1-10 | `tests/BusinessApprovalScreen.test.tsx` |
| PROP-1 | AC-PROP-1-03, AC-PROP-1-05, AC-PROP-1-07, AC-PROP-1-08 | `functions/src/businesses/tests/rejectBusiness.test.ts` |
| PROP-2 | AC-PROP-2-01, AC-PROP-2-03 … AC-PROP-2-06 | `tests/BusinessProfileScreen.test.tsx` |
| PROP-2 | AC-PROP-2-02, AC-PROP-2-07, AC-PROP-2-08 | `functions/src/businesses/tests/suspendBusiness.test.ts` |

