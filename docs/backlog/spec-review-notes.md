# Spec review notes (Phase 3)

31 `SPEC.md` files: one per feature folder (31 epics; `features/auth` and `portals/customer/layout` each hold two), plus two proposed features (`portals/business/features/support`, PROP-3; `portals/business/features/business-profile`, PROP-4). 1,125 acceptance criteria ids (1,119 active, 6 struck through: AC-KAN-25-05, AC-KAN-25-12, AC-KAN-41-02, AC-KAN-135-02, AC-KAN-141-02, AC-KAN-144-05). Every one of the 164 stories appears with criteria (162) or under "Deferred (out of MVP)" (KAN-48, KAN-50). No story is BLOCKED. The four proposed stories PROP-1 … PROP-4 have criteria too.

Status: 31 Draft, 0 BLOCKED.

Update 2026-09-28, round 1 (decisions Q4, Q5, Q6): 24 criteria added; business-home, subscription and the business layout moved to Draft.

Update 2026-09-28, round 2 (decisions Q1, Q2 + Q3 and Q7, confirmed by Lorenzo; see `docs/decisions/open-questions.md`): 245 criteria ids added. Collaborators 67; admin businesses 29 (KAN-176 rewritten, PROP-1, PROP-2); plan-checkout 24; service-selection 13; reports 11; schedule 12; availability 10; subscriber-sign-up 10; business support 10 (PROP-3); business profile 10 (PROP-4); audit-log 9; services 7; auth 6; landing home 5; booking-checkout 4; business layout 4; plans 3; my-bookings 3; booking-changes 2; settings 2; subscription 2; business-home 1; admin dashboard 1. Five criteria were struck through and replaced (listed above, except AC-KAN-41-02 from round 1). Every spec is now Draft.

Items below cut across several specs. Each spec also has its own "Assumptions" and "Backlog issues".

## 1. Fields proposed but not yet in `domain-glossary`

When the team accepts them, add them to `domain-glossary` §3 in the same PR as the spec approval.

Accepted on 2026-09-28 and already in the glossary: `Business.slug` (Q4), `Business` statuses `pending` and `rejected`, `Business.planCheckoutId`, `activatedAt` and `rejectionReason` (Q2), `User.fullName` / `phone` (Q6), `Collaborator` with `CollaboratorPermission` and its status machine, `Booking.collaboratorId`, `ScheduleBlock.collaboratorId`, `Service.collaboratorSelection`, `Plan.limits.maxCollaborators` (Q1), `PlanCheckout` (Q7), `Payment.refundedAt` (Q2), `AuditLogEntry.actionType` values `AUDIT_LOG_ACTION_TYPE` (Q3).

| Entity | Proposed fields | Specs |
| --- | --- | --- |
| `Business` | `logoUrl`, `description`, `contactPhone`, `contactEmail`, `socialLinks` (edited by PROP-4), `currency`, `bookingConfirmationMode` (KAN-70), `suspensionReason` (PROP-2) | business layout, customer layout, business-home, business-profile, schedule, admin businesses |
| `Service` | `imageUrl`, `features`; `ServiceDiscount`: `type` (`percentage` / `fixed_amount`), `value`, `startsAt`, `endsAt` | services, business-home |
| `Plan` | `priceInCents`, `billingPeriod` (`monthly` / `annual`), `features`, `limits.maxBookings` | admin plans, landing home, plan-checkout |
| `PlanCheckout` | `termsVersion`, `paymentReference`, `language` (besides the accepted fields) | plan-checkout, subscriber-sign-up |
| `Collaborator` | photo (optional, customer-facing) | service-selection |
| `PlatformSettings` | `gracePeriodDays`, `maxBookingsPerBusiness` (with `idleTimeoutMinutes`) | admin plans |
| `Payment` | amount, result, reference (besides `refundedAt`) | subscription, admin businesses, dashboard |
| `SupportTicket`, `AuditLogEntry` | field sets | support-tickets, business support, audit-log |

## 2. Gaps in the backlog

Covered by proposed stories (not in Jira yet; `docs/decisions/open-questions.md`):

- PROP-1: the super admin approves or rejects a `pending` business (admin businesses spec).
- PROP-2: the super admin suspends a business; KAN-179 reactivates it and KAN-194 audits it (admin businesses spec).
- PROP-3: a subscriber creates a support ticket and reads its replies; KAN-190 lists them (business support spec).
- PROP-4: a subscriber edits the business public profile (logo, description, contact, social links; `slug` read-only) that the customer portal and the sidebar show (business-profile spec).

Still open (no story, no proposal):

- KAN-100 relies on a customer reminder opt-in that no customer story defines.
- KAN-101 ends in "etc." and no story says where the subscriber reads the alerts.
- Two booking limits: per plan (KAN-181) and per business in platform settings (KAN-182). Nothing says which wins.
- No story lets the subscriber rename the business after sign-up (business-profile spec shows the name read-only).

## 3. Duplicates, overlaps and contradictions

- KAN-48 and KAN-50 are the same story (both deferred, out of MVP, by Q5).
- KAN-5 (contact form on Home) overlaps with KAN-17 (Contact page).
- KAN-95 (delete customer) and KAN-98 (anonymize): specs use delete without bookings, anonymize with bookings.
- KAN-147 / KAN-160, KAN-149 / KAN-164 and KAN-162 / KAN-166–167 overlap between UI and email.
- KAN-158 vs KAN-161: whether rescheduling inside the policy window is forbidden or penalized. Specs assume: reschedule forbidden, cancel allowed with penalty.
- KAN-182 (platform settings) lives in the plans epic but is not about plans. It is specified in the admin plans spec.
- KAN-91 is unclear about editing customers who have an account. Specs edit only the business-scoped `Customer` record.
- KAN-176 says the business activates when the payment is confirmed; Q2 changed it to activation on the super admin's approval.
- KAN-137 / KAN-138 describe the two sides of one per-service setting (`Service.collaboratorSelection`, KAN-61).

## 4. Assumptions shared by several specs

- An `inactive` or `suspended` business keeps its public pages visible but accepts no new bookings. A `pending` or `rejected` business has no public page (not found).
- Account settings (language, theme, password) stay available while a business is read-only, also for collaborators; reports and export are reads and stay available too.
- An `inactive` business can still pay (the only way back to `active`); a `suspended` one cannot.
- Collaborators (Q1): each active collaborator serves one booking at a time, and a `pending` booking holds its collaborator's slot. A service without collaborators is served by the business as one resource (one booking at a time, `Booking.collaboratorId` `null`). A reschedule keeps the booking's collaborator.
- Collaborator permissions are the closed list `CollaboratorPermission`; subscription, business settings, business profile, notification settings, support and collaborators are subscriber-only. Without permissions a collaborator sees only their own bookings, read-only.
- `invited` and `active` collaborators count against `Plan.limits.maxCollaborators`; deactivating a collaborator disables their account and never moves their bookings.
- New businesses (Q7 + Q2): plan checkout on the landing → email with a single-use sign-up link (7 days) → sign-up creates the account and a `pending` business with its `slug` → the super admin approves (the `Subscription` is created `active` and its period starts at approval) or rejects with a reason (terminal; the checkout payment gets `refundedAt`; the slug stays taken).
- Business pages live under `/<businessSlug>` (Q4). Slug lookups ignore letter case and redirect to the stored lowercase slug; the slug rules (a–z, digits, single hyphens, 3–40 characters) are set at subscriber sign-up (KAN-25). Reserved slugs (`RESERVED_BUSINESS_SLUG`) can never be taken by a business.
- Booking needs a customer account (Q6): every step of the booking flow (service selection, availability, checkout) is a private customer page. A visitor who starts a booking signs in or signs up and returns to the booking flow at the same service; nothing is stored before confirming.
- A customer account holds `fullName` and `phone` (both required) plus the email and password of Firebase Auth; the business-scoped `Customer` record created on the first booking copies them.
- No renewal retries in the MVP (Q5): a failed renewal leaves the subscription `past_due` until a manual payment (KAN-45) or until it becomes `expired` at `currentPeriodEndsAt` plus `PlatformSettings.gracePeriodDays`.
- Sign-up and sign-in errors never reveal whether an email is registered.
- Theme offers light, dark and system (theming-standards), although KAN-52 / KAN-173 mention only light and dark.

## 5. Jira edits needed

- **KAN-175**: fix the typos ("tofos" = "todos", "cosistema" = "ecosistema"); say that `pendiente` means "awaiting approval" and add the filters `suspendido` and `rechazado`.
- **KAN-176**: rewrite: "the business activates when the super admin approves it, giving the owner immediate access" (not when the payment is confirmed); fix the typo "duelo" = "dueño".
- **KAN-25**: add the business name and its `slug` to the form, and say the email comes read-only from the checkout (KAN-24 link).
- **KAN-27**: say that until approval the panel shows only the "under review" screen.
- **KAN-50**: close as a duplicate of KAN-48 (both deferred, out of MVP).
- **New stories** (then add the KAN key next to the PROP key in the specs; the `AC-PROP-…` ids stay):
  - PROP-1 — Super admin approves or rejects a pending business (epic KAN-174).
  - PROP-2 — Super admin suspends a business (epic KAN-174).
  - PROP-3 — Subscriber creates a support ticket and sees its replies and status (a business-portal support epic, or KAN-189).
  - PROP-4 — Subscriber edits the business public profile, slug read-only (a business-portal epic).
