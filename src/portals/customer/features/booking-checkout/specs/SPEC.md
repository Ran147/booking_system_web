# Booking checkout (KAN-145)

| Field | Value |
| --- | --- |
| Portal | customer |
| Feature folder | `src/portals/customer/features/booking-checkout/` |
| Stories | KAN-146, KAN-147, KAN-148, KAN-149 |
| Status | Draft |
| Depends on | KAN-134 service selection (`service-selection` spec), KAN-139 availability (`availability` spec, incl. the re-check of KAN-144), KAN-70 manual vs automatic confirmation, KAN-93 customer blocking, KAN-128 customer sign-in, KAN-163 confirmation email (`functions/src/notifications` spec); Q4 (how the business page is reached); Q6 (guest booking, KAN-116) |

## Intent
A signed-in `customer` who has chosen a service and a free time slot on a business's pages reviews a summary of the booking and the business's booking policies, confirms it, and sees clearly that the `Booking` was registered and whether it is `pending` or `confirmed`.

## Actors and permissions
| Actor | Can |
| --- | --- |
| `customer` (signed in) | Review the summary and policies, confirm a booking for themselves at a business, see the confirmation of their own booking |
| visitor | Reach the summary only after signing in (the "book without an account" path is out of scope, Q6) |
| `subscriber`, `super_admin` | Nothing in this feature (the subscriber creates bookings from the business portal, KAN-69) |

## In scope
- Summary of the booking before confirming: business, service, date, start and end time, duration, price.
- Display of the business's `BookingPolicy` (cancellation / reschedule window and penalty) before confirming.
- Confirming the booking through the server (the server re-checks availability, KAN-144).
- Confirmation screen after the booking is registered.

## Out of scope
- Choosing the service and the time slot (KAN-134, KAN-139).
- Choosing or showing a collaborator in the summary (Q1).
- Booking without an account (Q6, KAN-116).
- The confirmation email (KAN-164, `functions/src/notifications`).
- How the customer reaches the business page (Q4): this spec says only "the customer is on a business's pages".
- Online payment of the service: the platform does not charge customers.

## Data
- `Booking` (`businesses/{businessId}/bookings/{bookingId}`): created with `status` `pending` or `confirmed` (KAN-70), `customerUserId` = the signed-in user, `customerId`, `serviceId`, `serviceSnapshot` (`name`, `priceInCents`, `durationMinutes`), `startsAt`, `endsAt`, `cancellation: null`. See `domain-glossary` §3 and §4.1.
- `Customer` (`businesses/{businessId}/customers/{customerId}`): read to check `blocked`; created for the customer if it does not exist yet (see AS-4).
- `Business`: `timeZone`, currency, `status`, `BookingPolicy`, confirmation mode (KAN-70). Read only.
- `Service`: `status` (`active` only), price, duration. Read only.
- No new fields.

## Acceptance criteria

### KAN-146 — Review a booking summary before confirming it
- [ ] **AC-KAN-146-01** · happy · Given a signed-in `customer` on a business's pages who has selected an `active` service and a free time slot, when they continue to checkout, then a summary shows the business name, the service name, the date, the start and end time in the business `timeZone`, the duration in minutes and the price formatted from `priceInCents` in the business currency. [KAN-146]
- [ ] **AC-KAN-146-02** · happy · Given the summary is shown, when the customer chooses to change the service or the time slot, then they go back to the matching step with their previous choice kept, and no `Booking` is created. [KAN-146]
- [ ] **AC-KAN-146-03** · error · Given a visitor who is not signed in, when they try to open the summary, then they are sent to sign-in with the checkout as `redirectTo`, and after signing in as a `customer` they return to the summary with the same service and time slot. See AS-1. [KAN-146]
- [ ] **AC-KAN-146-04** · error · Given the service or the business can no longer be read (removed, service `inactive`, or network failure), when the summary loads, then no summary is shown, the confirm action is unavailable and `common:errors.notFound` (missing or inactive) or `common:errors.network` (network) is shown. [KAN-146]
- [ ] **AC-KAN-146-05** · edge · Given a customer whose device time zone differs from the business `timeZone`, when the summary is shown, then the date and times are those of the business `timeZone` and the summary states that time zone. [KAN-146]
- [ ] **AC-KAN-146-06** · edge · Given the service has an active discount (KAN-115), when the summary is shown, then the original price and the discounted price are both shown, and the discounted price is the one stored in `serviceSnapshot.priceInCents`. See AS-2. [KAN-146]

### KAN-147 — See the applicable booking policies before confirming
- [ ] **AC-KAN-147-01** · happy · Given a business whose `BookingPolicy` defines a cancellation / reschedule window and a penalty, when the customer views the summary, then the window (for example, how many hours before `startsAt`) and the penalty are shown next to the confirm action. [KAN-147]
- [ ] **AC-KAN-147-02** · happy · Given the policies are shown, when the customer confirms, then they must first acknowledge the policies; the confirm action stays disabled until they do. See AS-3. [KAN-147]
- [ ] **AC-KAN-147-03** · edge · Given a business with no `BookingPolicy` configured, when the summary is shown, then `customer:bookingCheckout.policies.noPolicyEmpty` is shown instead of the policy details and no acknowledgement is required. See AS-3. [KAN-147]
- [ ] **AC-KAN-147-04** · error · Given the policies cannot be loaded because of the network, when the summary is shown, then `common:errors.network` is shown in the policy area and the confirm action stays disabled until they load. [KAN-147]

### KAN-148 — Confirm the booking
- [ ] **AC-KAN-148-01** · happy · Given a business with automatic confirmation (KAN-70) and a free time slot, when the customer confirms, then one `Booking` is created with `status` `confirmed`, `customerUserId` equal to the customer, the chosen `startsAt` / `endsAt` and a `serviceSnapshot` with the service's name, price and duration at that moment. [KAN-148, KAN-70, KAN-62]
- [ ] **AC-KAN-148-02** · happy · Given a business that requires manual confirmation (KAN-70), when the customer confirms, then one `Booking` is created with `status` `pending`. [KAN-148, KAN-70]
- [ ] **AC-KAN-148-03** · error · Given the time slot was taken by another booking or blocked (`ScheduleBlock`) after it was shown, when the customer confirms, then no `Booking` is created, `customer:bookingCheckout.confirm.slotTakenError` is shown and the customer is offered to pick another time slot. [KAN-148, KAN-144]
- [ ] **AC-KAN-148-04** · error · Given the customer's `Customer` record at this business is `blocked` (KAN-93), when they confirm, then no `Booking` is created and `customer:bookingCheckout.confirm.customerBlockedError` is shown; the business's internal note is never shown. [KAN-148, KAN-93]
- [ ] **AC-KAN-148-05** · error · Given the business is `inactive` or `suspended`, or the service became `inactive`, when the customer confirms, then no `Booking` is created and `customer:bookingCheckout.confirm.unavailableError` is shown. See AS-5. [KAN-148, KAN-49]
- [ ] **AC-KAN-148-06** · error · Given the request fails because of the network or the server, when the customer confirms, then `common:errors.network` or `common:errors.unknown` is shown, the summary stays on screen with the confirm action enabled again, and no duplicate booking results from retrying. [KAN-148]
- [ ] **AC-KAN-148-07** · edge · Given the customer presses confirm several times quickly, when the requests are processed, then exactly one `Booking` is created and the action is disabled while the request is in progress. [KAN-148]
- [ ] **AC-KAN-148-08** · edge · Given the service price or duration changed between opening the summary and confirming, when the customer confirms, then the booking is not created, `customer:bookingCheckout.confirm.serviceChangedError` is shown and the summary reloads with the new values for the customer to confirm again. See AS-6. [KAN-148, KAN-62]
- [ ] **AC-KAN-148-09** · edge · Given a `customer` with no `Customer` record at this business yet, when they confirm, then the booking is created and a `Customer` record linked to their account (`userId`) exists for the business afterwards. See AS-4. [KAN-148]

### KAN-149 — See a confirmation once the booking is registered
- [ ] **AC-KAN-149-01** · happy · Given a booking was created with `status` `confirmed`, when the request succeeds, then a confirmation screen shows `customer:bookingCheckout.success.confirmedTitle`, the business, service, date and times in the business `timeZone`, the price, and actions to go to "My bookings" (KAN-150) and back to the business's pages. [KAN-149]
- [ ] **AC-KAN-149-02** · happy · Given a booking was created with `status` `pending`, when the request succeeds, then the confirmation screen shows `customer:bookingCheckout.success.pendingTitle`, which explains that the business still has to confirm it. [KAN-149, KAN-70]
- [ ] **AC-KAN-149-03** · error · Given the booking was not created (any error in KAN-148), when the request ends, then the confirmation screen is not shown and the error of the matching KAN-148 criterion is shown instead. [KAN-149]
- [ ] **AC-KAN-149-04** · edge · Given the customer reloads the confirmation screen or navigates back to it, when it opens, then it shows the same booking (read from the server) and the browser back action does not submit a second booking. [KAN-149]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| — | — | No story of this epic is blocked. The collaborator line in the summary (Q1) and the guest path (Q6, KAN-116) are out of scope. |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | Checkout is a private customer page: signing in is required before the summary, and the selected service and time slot survive the sign-in redirect. | AC-KAN-146-03 |
| AS-2 | When a discount applies (KAN-60, KAN-115), the discounted price is the booked price and is what `serviceSnapshot.priceInCents` stores. | AC-KAN-146-06 |
| AS-3 | The customer must explicitly acknowledge the policies (checkbox) before confirming; when the business has no policy, no acknowledgement is asked. | AC-KAN-147-02, AC-KAN-147-03 |
| AS-4 | A `Customer` record is created by the server for a `customer` on their first booking at a business, linked through `userId`. | AC-KAN-148-09 |
| AS-5 | Customers cannot book at a business that is `inactive` or `suspended` (its public pages may still show, but booking is rejected). | AC-KAN-148-05 |
| AS-6 | If the service's price or duration changed since the summary was shown, the server rejects the booking instead of silently using new values. | AC-KAN-148-08 |

## Backlog issues
- KAN-148 ("confirmar mi reservación") uses "confirm" for the customer's submit action, while "confirmed" is also a `Booking` status set by the subscriber (KAN-70). In this spec "confirm" means submitting the booking; the resulting status may be `pending`.
- KAN-149 (on-screen confirmation) and KAN-164 (confirmation email) overlap in purpose; they are kept separate: screen here, email in `functions/src/notifications`.
- KAN-147 and KAN-160 both show policies before an action (booking vs cancelling); the same `BookingPolicy` content is shown in both places.
- No story says whether the customer can add a note to the booking; nothing is specified for it.

## Non-functional
- i18n keys: new prefix `customer:bookingCheckout.*` (`summary.*`, `policies.*`, `confirm.*`, `success.*`); reused `common:errors.network`, `common:errors.notFound`, `common:errors.unknown`.
- Booking creation runs on the server (callable `createBooking`, transaction) with the availability re-check of KAN-144 (`api-mutation-standards` §1). The pre-confirm availability view may use realtime (`api-query-standards` §9).
- Private page: `RequireRole` for `customer`; idle logout after `PlatformSettings.idleTimeoutMinutes` (KAN-133, KAN-182). App Check / reCAPTCHA Enterprise protects the callable (KAN-5, `auth-and-roles` §5).
- Money from `priceInCents` in the business currency; dates and times in the business `timeZone`, formatted with `Intl` in the UI language.
- Accessibility: the summary is a labelled region; the policy acknowledgement is a real checkbox with a label; the confirm button exposes a busy state while submitting; the confirmation heading receives focus when the screen opens.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-146 | AC-KAN-146-01 … AC-KAN-146-06 | `tests/BookingCheckoutPage.test.tsx` |
| KAN-147 | AC-KAN-147-01 … AC-KAN-147-04 | `tests/BookingCheckoutPage.test.tsx` |
| KAN-148 | AC-KAN-148-01 … AC-KAN-148-09 | `tests/BookingCheckoutPage.test.tsx`, `functions/src/bookings/tests/createBooking.test.ts` |
| KAN-149 | AC-KAN-149-01 … AC-KAN-149-04 | `tests/BookingConfirmationPage.test.tsx` |
