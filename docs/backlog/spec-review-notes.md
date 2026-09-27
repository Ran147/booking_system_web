# Spec review notes (Phase 3)

29 `SPEC.md` files, one per feature folder (31 epics; `features/auth` and `portals/customer/layout` each hold two). 856 acceptance criteria. Every one of the 164 stories appears either with criteria or under BLOCKED.

Status: 12 Draft, 16 BLOCKED (partially), 1 BLOCKED (collaborators, Q1).

Items below cut across several specs. Each spec also has its own "Assumptions" and "Backlog issues".

## 1. Fields proposed but not yet in `domain-glossary`

When the team accepts them, add them to `domain-glossary` §3 in the same PR as the spec approval.

| Entity | Proposed fields | Specs |
| --- | --- | --- |
| `Business` | `logoUrl`, `description`, `contactPhone`, `contactEmail`, `socialLinks`, `currency`, `activatedAt`, `bookingConfirmationMode` (KAN-70) | business layout, customer layout, business-home, schedule, admin businesses |
| `Service` | `imageUrl`, `features`; `ServiceDiscount`: `type` (`percentage` / `fixed_amount`), `value`, `startsAt`, `endsAt` | services, business-home |
| `Plan` | `priceInCents`, `billingPeriod` (`monthly` / `annual`), `features`, `limits.maxBookings` | admin plans, landing home, plan-checkout |
| `PlatformSettings` | `gracePeriodDays`, `maxBookingsPerBusiness` (with `idleTimeoutMinutes`) | admin plans |
| `Payment` | amount, result, reference | subscription, admin businesses |
| `SupportTicket`, `AuditLogEntry` | field sets (no `actionType` values: Q3) | support-tickets, audit-log |

## 2. Gaps in the backlog (no story covers them)

- No story lets the subscriber enter the public business profile (logo, description, contact, social links) that the customer portal shows.
- No story lets the super admin **suspend** a business, although KAN-179 reactivates one and KAN-194 audits suspensions.
- No story lets a subscriber **create a support ticket**, although KAN-190 lists them.
- KAN-100 relies on a customer reminder opt-in that no customer story defines.
- KAN-101 ends in "etc." and no story says where the subscriber reads the alerts.
- Two booking limits: per plan (KAN-181) and per business in platform settings (KAN-182). Nothing says which wins.

## 3. Duplicates, overlaps and contradictions

- KAN-48 and KAN-50 are the same story (both BLOCKED on Q5).
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
- Sign-up and sign-in errors never reveal whether an email is registered.
- Theme offers light, dark and system (theming-standards), although KAN-52 / KAN-173 mention only light and dark.
