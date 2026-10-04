# Service and collaborator selection (KAN-134)

| Field | Value |
| --- | --- |
| Portal | customer |
| Feature folder | `src/portals/customer/features/service-selection/` |
| Stories | KAN-135, KAN-136, KAN-137, KAN-138 |
| Status | Draft |
| Depends on | Q1 decided 2026-09-28 (collaborators; `Service.collaboratorSelection`, KAN-61, services spec); Q4 decided 2026-09-28 (the flow lives under `/:businessSlug`); Q6 decided 2026-09-28 (a customer account is mandatory; the flow is private); `business-home` spec (KAN-111, KAN-116); `availability` spec (KAN-139) |

## Intent
A signed-in customer on a business's pages chooses the service they want as the first step of a booking, and, when the business allows it, the collaborator who will serve them (or any available one), so that availability can be looked up.

## Actors and permissions
| Actor | Can |
| --- | --- |
| customer | Choose one `active` service of the business to start a booking, then a collaborator or "any available" when the service allows it |
| visitor | Cannot open the booking flow: is sent to sign in or sign up and comes back to this step (Q6, KAN-116) |

## In scope
- Choosing one service to book, including arriving with a service already chosen from the business home page (KAN-116).
- Seeing the collaborators who can serve the chosen service (KAN-136), choosing one (KAN-137) or continuing without one (KAN-138).
- Moving on to the availability step with the chosen service and collaborator choice.
- Visitor entry: sign in or sign up first, then back to this step (Q6).

## Out of scope
- Collaborator availability per date (KAN-142, availability spec).
- Date and time slot choice (KAN-139), summary and confirmation (KAN-145).
- Booking without an account: not offered (Q6).

## Data
- `Service` (read, `active` only): `name`, `priceInCents`, `durationMinutes`, `status`, `discounts`.
- `Business` (read): `status`, `currency`, `timeZone`.
- `Service.collaboratorSelection` (`customer_choice` | `automatic`, KAN-61).
- `Collaborator` public data only (AS-6): `fullName` and a photo if any, of `active` collaborators whose `serviceIds` include the service, read through a callable (customers cannot read `collaborators` documents).
- No writes. The chosen service is kept only as progress of the booking flow (AS-2).

## Acceptance criteria

### KAN-135 — Select the service I want to book
- [ ] **AC-KAN-135-01** · happy · Given a signed-in customer on a business's pages with `active` services, when they open the booking flow, then they see the business's `active` services with name, price (from `priceInCents` in the business currency) and `durationMinutes`, and can choose exactly one. [KAN-135]
- [ ] ~~**AC-KAN-135-02** · happy · Given the customer chose a service, when they continue, then the next step of the booking flow opens for that service (availability, KAN-140). See AS-1. [KAN-135, KAN-140]~~ Replaced by AC-KAN-135-13 after Q1: a collaborator step may come before availability.
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
- [ ] **AC-KAN-135-13** · happy · Given the customer chose a service, when they continue, then the collaborator step opens if the service has collaborators and `collaboratorSelection` is `customer_choice` (KAN-137); otherwise availability opens directly (KAN-140). See AS-1. [KAN-135, KAN-137, KAN-140]

### KAN-136 — See the collaborators available for the chosen service
- [ ] **AC-KAN-136-01** · happy · Given a service with `collaboratorSelection` = `customer_choice`, when the collaborator step opens, then it lists the `active` collaborators who serve that service with their full name (and photo if any, AS-6), sorted by name, plus the option `customer:serviceSelection.collaborators.anyAvailable`. [KAN-136]
- [ ] **AC-KAN-136-02** · error · Given the collaborators cannot be loaded because of the network, when the step opens, then `common:errors.network` is shown with a retry action and the customer cannot continue. [KAN-136]
- [ ] **AC-KAN-136-03** · edge · Given `inactive` or `invited` collaborators, when the list loads, then they are not shown; no email, phone or permission of any collaborator is ever shown to customers. [KAN-136, KAN-81]
- [ ] **AC-KAN-136-04** · edge · Given a service without collaborators, when the customer continues, then no collaborator step is shown (the business serves it, glossary §3). [KAN-136, KAN-61]

### KAN-137 — Choose a specific collaborator when the business allows it
- [ ] **AC-KAN-137-01** · happy · Given the collaborator step, when the customer chooses one collaborator and continues, then availability opens for that collaborator only (KAN-142) and the choice is kept for the summary (KAN-146). [KAN-137, KAN-142]
- [ ] **AC-KAN-137-02** · error · Given the chosen collaborator was deactivated or removed from the service after the list loaded, when the customer continues, then they stay on this step, `customer:serviceSelection.errors.collaboratorUnavailable` is shown and the list is refreshed. [KAN-137, KAN-81]
- [ ] **AC-KAN-137-03** · error · Given the customer continues without choosing a collaborator or "any available", when they continue, then they stay on this step and `customer:serviceSelection.errors.collaboratorRequired` is shown. [KAN-137]
- [ ] **AC-KAN-137-04** · edge · Given a service with `collaboratorSelection` = `automatic`, when the flow runs, then the customer is never offered a specific collaborator, even through a link with a collaborator in it. [KAN-137, KAN-61]

### KAN-138 — Continue without choosing a collaborator when the business assigns one
- [ ] **AC-KAN-138-01** · happy · Given a service with `collaboratorSelection` = `automatic`, when the customer chooses the service and continues, then availability opens with the time of any free collaborator (AC-KAN-142-02) and, when the booking is created, the server assigns one (AC-KAN-144-08). [KAN-138]
- [ ] **AC-KAN-138-02** · happy · Given a service with `customer_choice`, when the customer picks `customer:serviceSelection.collaborators.anyAvailable`, then the flow continues as in AC-KAN-138-01. See AS-7. [KAN-138]
- [ ] **AC-KAN-138-03** · error · Given every collaborator of the service is `inactive`, when the customer continues, then they stay on this step and `customer:serviceSelection.errors.collaboratorUnavailable` is shown. [KAN-138]
- [ ] **AC-KAN-138-04** · edge · Given the booking was created with automatic assignment, when the confirmation (KAN-149) and "my bookings" (KAN-152) are shown, then they show the assigned collaborator's name. [KAN-138, KAN-149, KAN-152]

## BLOCKED
None. Q1 was decided on 2026-09-28: KAN-136, KAN-137 and KAN-138 are specified.

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | The collaborator step exists only for services with collaborators and `collaboratorSelection` = `customer_choice`; otherwise the customer goes straight to availability. | AC-KAN-135-13 |
| AS-2 | The progress of the booking flow (chosen service, date, slot) lives only in the customer's current session in the browser; nothing is saved until the booking is confirmed (KAN-148). | Data, AC-KAN-135-09 |
| AS-3 | An `inactive` or `suspended` business accepts no new bookings from customers (same assumption as in the `business-home` spec). | AC-KAN-135-07 |
| AS-4 | Only one service can be booked per booking; booking several services at once is not supported. | AC-KAN-135-01 |
| AS-5 | Every step of the booking flow is a private customer page (`RequireRole` for `customer`), following Q6. | AC-KAN-135-12 |
| AS-6 | Customers see only a collaborator's full name and an optional photo; the photo field is not in the glossary yet and is optional in the MVP. | AC-KAN-136-01, AC-KAN-136-03 |
| AS-7 | With `customer_choice` the customer may still pick "any available". | AC-KAN-138-02 |

## Backlog issues
- KAN-135 overlaps KAN-116 (start booking from a service) and KAN-113 (catalog). Here it is the selection step inside the booking flow.
- KAN-136, KAN-137 and KAN-138 depend on KAN-61 (assign collaborators and whether the customer may choose), specified in the services spec.
- KAN-137 and KAN-138 describe two sides of one setting, `Service.collaboratorSelection` (KAN-61). KAN-137 says "when the business allows it": the setting is per service, not per business (services spec AS-12).

## Non-functional
- i18n prefixes (new): `customer:serviceSelection.list.*`, `customer:serviceSelection.collaborators.*`, `customer:serviceSelection.errors.*`. Reused: `common:errors.network`.
- The service list reads only `active` services (Firestore rules, `auth-and-roles` §4); if the business has more services than one page, cursor pagination as in `api-query-standards` §5.
- Money is shown from `priceInCents` in the business currency.
- Accessibility: the choice is a single-select group with a visible label, reachable and operable by keyboard; the selected state is announced; works at phone width.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-135 | AC-KAN-135-01 … AC-KAN-135-13 (AC-KAN-135-02 replaced) | `tests/ServiceSelectionPage.test.tsx` |
| KAN-136 | AC-KAN-136-01 … AC-KAN-136-04 | `tests/CollaboratorChoiceStep.test.tsx`; `functions/src/bookings/tests/listServiceCollaborators.test.ts` |
| KAN-137 | AC-KAN-137-01 … AC-KAN-137-04 | `tests/CollaboratorChoiceStep.test.tsx` |
| KAN-138 | AC-KAN-138-01 … AC-KAN-138-04 | `tests/CollaboratorChoiceStep.test.tsx`; `functions/src/bookings/tests/createBooking.test.ts` |
