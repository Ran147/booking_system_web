# Service and collaborator selection (KAN-134)

| Field | Value |
| --- | --- |
| Portal | customer |
| Feature folder | `src/portals/customer/features/service-selection/` |
| Stories | KAN-135, KAN-136, KAN-137, KAN-138 |
| Status | BLOCKED (partially) |
| Depends on | Q1 (collaborator); Q4 decided 2026-09-28 (the flow lives under `/:businessSlug`); Q6 decided 2026-09-28 (a customer account is mandatory; the flow is private); `business-home` spec (KAN-111, KAN-116); `availability` spec (KAN-139) |

## Intent
A signed-in customer on a business's pages chooses the service they want as the first step of a booking, so that availability can be looked up for that service. Choosing a collaborator is part of this epic but waits on Q1.

## Actors and permissions
| Actor | Can |
| --- | --- |
| customer | Choose one `active` service of the business to start a booking |
| visitor | Cannot open the booking flow: is sent to sign in or sign up and comes back to this step (Q6, KAN-116) |

## In scope
- Choosing one service to book, including arriving with a service already chosen from the business home page (KAN-116).
- Moving on to the availability step with the chosen service.
- Visitor entry: sign in or sign up first, then back to this step (Q6).

## Out of scope
- Everything about collaborators (KAN-136, KAN-137, KAN-138) while Q1 is open.
- Date and time slot choice (KAN-139), summary and confirmation (KAN-145).
- Booking without an account: not offered (Q6).

## Data
- `Service` (read, `active` only): `name`, `priceInCents`, `durationMinutes`, `status`, `discounts`.
- `Business` (read): `status`, `currency`, `timeZone`.
- No writes. The chosen service is kept only as progress of the booking flow (AS-2).

## Acceptance criteria

### KAN-135 — Select the service I want to book
- [ ] **AC-KAN-135-01** · happy · Given a signed-in customer on a business's pages with `active` services, when they open the booking flow, then they see the business's `active` services with name, price (from `priceInCents` in the business currency) and `durationMinutes`, and can choose exactly one. [KAN-135]
- [ ] **AC-KAN-135-02** · happy · Given the customer chose a service, when they continue, then the next step of the booking flow opens for that service (availability, KAN-140). See AS-1. [KAN-135, KAN-140]
- [ ] **AC-KAN-135-03** · happy · Given the customer started the booking from a service on the business home page (KAN-116), when the flow opens, then that service is already selected and the customer can still change it. [KAN-135, KAN-116]
- [ ] **AC-KAN-135-04** · error · Given the customer tries to continue without choosing a service, when they continue, then they stay on this step and `customer:serviceSelection.errors.serviceRequired` is shown. [KAN-135]
- [ ] **AC-KAN-135-05** · error · Given the chosen service was deactivated or deleted after the list was loaded, when the customer continues, then they stay on this step, `customer:serviceSelection.errors.serviceUnavailable` is shown and the list is refreshed without that service. [KAN-135, KAN-58]
- [ ] **AC-KAN-135-06** · error · Given the services cannot be loaded because of the network, when the step opens, then `common:errors.network` is shown with a retry action and the customer cannot continue. [KAN-135]
- [ ] **AC-KAN-135-07** · error · Given the business is `inactive` or `suspended`, when the customer opens the booking flow, then no service can be chosen and `customer:serviceSelection.errors.businessUnavailable` is shown. See AS-3. [KAN-135, KAN-49]
- [ ] **AC-KAN-135-08** · edge · Given the business has no `active` services, when the step opens, then `customer:serviceSelection.list.empty` is shown and there is no continue action. [KAN-135]
- [ ] **AC-KAN-135-09** · edge · Given a customer who goes back from the availability step, when this step is shown again, then their chosen service is still selected. [KAN-135]
- [ ] **AC-KAN-135-10** · edge · Given a customer who changes the chosen service after having picked a date or time slot, when they continue, then the previous date and time slot are cleared. [KAN-135, KAN-140]
- [ ] **AC-KAN-135-11** · happy · Given a visitor who chose to book a service (KAN-116) and then signed in, or signed up and signed in, as a `customer`, when they return, then this step opens for the same business with that service already selected and they can continue to availability. [KAN-135, KAN-116]
- [ ] **AC-KAN-135-12** · error · Given a visitor who is not signed in, when they open this step directly (for example from a shared link under `/<businessSlug>`), then no service list is shown and they are sent to sign-in with this step as `redirectTo`. See AS-5. [KAN-135]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| KAN-136 | Q1 — collaborator | Listing the collaborators who can serve the chosen service. |
| KAN-137 | Q1 — collaborator | Choosing a specific collaborator when the business allows it (setting from KAN-61, also blocked). |
| KAN-138 | Q1 — collaborator | Continuing without a collaborator so that an available one is assigned. |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | While Q1 is open there is no collaborator step; after choosing a service the customer goes straight to availability. If Q1 adds collaborators, a step is inserted here. | AC-KAN-135-02 |
| AS-2 | The progress of the booking flow (chosen service, date, slot) lives only in the customer's current session in the browser; nothing is saved until the booking is confirmed (KAN-148). | Data, AC-KAN-135-09 |
| AS-3 | An `inactive` or `suspended` business accepts no new bookings from customers (same assumption as in the `business-home` spec). | AC-KAN-135-07 |
| AS-4 | Only one service can be booked per booking; booking several services at once is not supported. | AC-KAN-135-01 |
| AS-5 | Every step of the booking flow is a private customer page (`RequireRole` for `customer`), following Q6. | AC-KAN-135-12 |

## Backlog issues
- KAN-135 overlaps KAN-116 (start booking from a service) and KAN-113 (catalog). Here it is the selection step inside the booking flow.
- KAN-136, KAN-137 and KAN-138 depend on KAN-61 (assign collaborators and whether the customer may choose), which is also blocked by Q1. The epic title names the collaborator, so most of the epic waits on Q1.
- KAN-137 and KAN-138 describe two sides of one business setting ("customer may choose" vs "system assigns") that no story defines outside KAN-61.

## Non-functional
- i18n prefixes (new): `customer:serviceSelection.list.*`, `customer:serviceSelection.errors.*`. Reused: `common:errors.network`.
- The service list reads only `active` services (Firestore rules, `auth-and-roles` §4); if the business has more services than one page, cursor pagination as in `api-query-standards` §5.
- Money is shown from `priceInCents` in the business currency.
- Accessibility: the choice is a single-select group with a visible label, reachable and operable by keyboard; the selected state is announced; works at phone width.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-135 | AC-KAN-135-01 … AC-KAN-135-12 | `tests/ServiceSelectionPage.test.tsx` |
| KAN-136 | — (BLOCKED, Q1) | — |
| KAN-137 | — (BLOCKED, Q1) | — |
| KAN-138 | — (BLOCKED, Q1) | — |
