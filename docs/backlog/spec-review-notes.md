# Spec review notes (Phase 3)

29 `SPEC.md` files, one per feature folder (31 epics; `features/auth` and `portals/customer/layout` each hold two). 880 acceptance criteria ids (879 active, 1 struck through: AC-KAN-41-02). Every one of the 164 stories appears with criteria, under BLOCKED, or under "Deferred (out of MVP)" (KAN-48, KAN-50).

Status: 15 Draft, 13 BLOCKED (partially), 1 BLOCKED (collaborators, Q1).

Update 2026-09-28 (decisions Q4, Q5, Q6; partial answers to Q1, Q2, Q3 — see `docs/decisions/open-questions.md`): 24 criteria added (business-home 8, customer-sign-up 5, service-selection 2, availability 2, booking-checkout 2, business layout 2, customer layout 1, customers 1, profile 1). business-home, subscription and the business layout moved from BLOCKED (partially) to Draft. Q1, Q2, Q3 and Q7 parts stay BLOCKED.

Items below cut across several specs. Each spec also has its own "Assumptions" and "Backlog issues".

## 1. Fields proposed but not yet in `domain-glossary`

When the team accepts them, add them to `domain-glossary` §3 in the same PR as the spec approval.

| Entity | Proposed fields | Specs |
| --- | --- | --- |
| `Business` | `slug` (accepted: Q4, 2026-09-28, already in `domain-glossary` §3; its character rules are an assumption, business-home AS-10), `logoUrl`, `description`, `contactPhone`, `contactEmail`, `socialLinks`, `currency`, `activatedAt`, `bookingConfirmationMode` (KAN-70) | business layout, customer layout, business-home, schedule, admin businesses |
| `Service` | `imageUrl`, `features`; `ServiceDiscount`: `type` (`percentage` / `fixed_amount`), `value`, `startsAt`, `endsAt` | services, business-home |
| `Plan` | `priceInCents`, `billingPeriod` (`monthly` / `annual`), `features`, `limits.maxBookings` | admin plans, landing home, plan-checkout |
| `User` (customer) | `fullName`, `phone`, both required (accepted: Q6, 2026-09-28, already in `domain-glossary` §3) | customer-sign-up, profile, booking-checkout |
| `PlatformSettings` | `gracePeriodDays`, `maxBookingsPerBusiness` (with `idleTimeoutMinutes`) | admin plans |
| `Payment` | amount, result, reference | subscription, admin businesses |
| `SupportTicket`, `AuditLogEntry` | field sets (no `actionType` values: Q3) | support-tickets, audit-log |

## 2. Gaps in the backlog (no story covers them)

- No story lets the subscriber enter the public business profile (logo, description, contact, social links) that the customer portal shows.
- No story lets anyone choose or change the business `slug` (Q4). It must be set when the business is created (KAN-176, blocked on Q7).
- No story lets the super admin **suspend** a business, although KAN-179 reactivates one and KAN-194 audits suspensions.
- No story lets a subscriber **create a support ticket**, although KAN-190 lists them.
- KAN-100 relies on a customer reminder opt-in that no customer story defines.
- KAN-101 ends in "etc." and no story says where the subscriber reads the alerts.
- Two booking limits: per plan (KAN-181) and per business in platform settings (KAN-182). Nothing says which wins.

## 3. Duplicates, overlaps and contradictions

- KAN-48 and KAN-50 are the same story (both deferred, out of MVP, by Q5).
- KAN-5 (contact form on Home) overlaps with KAN-17 (Contact page).
- KAN-95 (delete customer) and KAN-98 (anonymize): specs use delete without bookings, anonymize with bookings.
- KAN-147 / KAN-160, KAN-149 / KAN-164 and KAN-162 / KAN-166–167 overlap between UI and email.
- KAN-158 vs KAN-161: whether rescheduling inside the policy window is forbidden or penalized. Specs assume: reschedule forbidden, cancel allowed with penalty.
- KAN-182 (platform settings) lives in the plans epic but is not about plans. It is specified in the admin plans spec.
- KAN-91 is unclear about editing customers who have an account. Specs edit only the business-scoped `Customer` record.

## 4. Assumptions shared by several specs

- An `inactive` or `suspended` business keeps its public pages visible but accepts no new bookings.
- Account settings (language, theme, password) stay available while a business is read-only; reports and export are reads and stay available too.
- An `inactive` business can still pay (the only way back to `active`); a `suspended` one cannot.
- While Q1 is open, a business serves one booking at a time, and a `pending` booking holds its slot.
- Business pages live under `/<businessSlug>` (Q4). Slug lookups ignore letter case and redirect to the stored lowercase slug; the slug character rules and length are set where the business is created (KAN-176, Q7). Reserved slugs (`RESERVED_BUSINESS_SLUG`) can never be taken by a business.
- Booking needs a customer account (Q6): every step of the booking flow (service selection, availability, checkout) is a private customer page. A visitor who starts a booking signs in or signs up and returns to the booking flow at the same service; nothing is stored before confirming.
- A customer account holds `fullName` and `phone` (both required) plus the email and password of Firebase Auth; the business-scoped `Customer` record created on the first booking copies them.
- No renewal retries in the MVP (Q5): a failed renewal leaves the subscription `past_due` until a manual payment (KAN-45) or until it becomes `expired` at `currentPeriodEndsAt` plus `PlatformSettings.gracePeriodDays`.
- Sign-up and sign-in errors never reveal whether an email is registered.
- Theme offers light, dark and system (theming-standards), although KAN-52 / KAN-173 mention only light and dark.
