# Booking rescheduling and cancellation (KAN-155)

| Field | Value |
| --- | --- |
| Portal | customer |
| Feature folder | `src/portals/customer/features/booking-changes/` |
| Stories | KAN-156, KAN-157, KAN-158, KAN-159, KAN-160, KAN-161, KAN-162 |
| Status | Draft |
| Depends on | KAN-150 my bookings (entry point), KAN-139 availability (`getAvailability`, KAN-141, KAN-143, KAN-144), KAN-63 business `BookingPolicy` settings, KAN-163 reschedule / cancel emails (`functions/src/notifications` spec), KAN-128 customer sign-in; Q1 decided 2026-09-28 (a reschedule keeps the booking's collaborator; availability per collaborator, KAN-142) |

## Intent
A signed-in `customer` can move one of their future bookings to another free time slot, or cancel it, as long as the business's `BookingPolicy` allows it. Before doing either they see the policy and any penalty, and afterwards they get a clear confirmation.

## Actors and permissions
| Actor | Can |
| --- | --- |
| `customer` (signed in) | Reschedule or cancel only their own bookings (`customerUserId` = their account) that are `pending` or `confirmed` and still in the future |
| visitor | Nothing; redirected to sign-in |
| `subscriber` | Nothing in this feature (the business reschedules and cancels from its agenda, KAN-71, KAN-72) |

## In scope
- Choosing a future booking to reschedule (KAN-156).
- Seeing free time slots for the booking's service on other dates (KAN-157).
- Rescheduling within the policy (KAN-158).
- Cancelling a future booking (KAN-159).
- Showing the cancellation policy and the penalty before confirming (KAN-160, KAN-161).
- On-screen confirmation of the result (KAN-162).

## Out of scope
- Choosing another service or another collaborator while rescheduling: the booking keeps its service and its collaborator (AS-7).
- Emails sent after a reschedule or cancellation (KAN-166, KAN-167, `functions/src/notifications`).
- Charging a penalty: the platform only records `isPenalized`; it does not collect money from customers.
- Rescheduling or cancelling on behalf of the business (KAN-71, KAN-72).

## Data
- `Booking`: rescheduling changes `startsAt` / `endsAt` and appends an entry to `rescheduleHistory` (no status change, `domain-glossary` §4.1); `collaboratorId` does not change (AS-7). Cancelling moves `pending` or `confirmed` to `cancelled` and stores `cancellation: { cancelledBy: "customer", isPenalized, note }`.
- `Business`: `BookingPolicy` (cancellation / reschedule window and penalty), `timeZone`, currency. Read only.
- Writes run only in callable functions (`rescheduleBooking`, `cancelBooking`), in a transaction; rules deny direct writes to `bookings`.
- No new fields.

## Acceptance criteria

### KAN-156 — Select a future booking to reschedule it
- [ ] **AC-KAN-156-01** · happy · Given a signed-in `customer` with a `pending` or `confirmed` booking whose `startsAt` is in the future, when they choose "Reschedule" on it (from its detail, KAN-152), then the reschedule screen opens showing that booking's service, current date and time in the business `timeZone`, and the business's reschedule policy. [KAN-156]
- [ ] **AC-KAN-156-02** · error · Given a booking that is `cancelled`, `completed`, `no_show`, or whose `startsAt` has passed, when the customer opens the reschedule screen for it (for example with an old link), then no change is possible and `customer:bookingChanges.reschedule.notAllowedError` is shown. [KAN-156]
- [ ] **AC-KAN-156-03** · error · Given a booking id that does not exist or belongs to another customer, when the customer opens the reschedule screen for it, then no booking data is shown and `common:errors.notFound` is shown. [KAN-156]
- [ ] **AC-KAN-156-04** · edge · Given a booking whose reschedule window has already closed (see KAN-158), when the customer views it, then the reschedule action is disabled and `customer:bookingChanges.reschedule.windowClosedHint` explains why. [KAN-156, KAN-158]

### KAN-157 — See new free dates and times before changing a booking
- [ ] **AC-KAN-157-01** · happy · Given the reschedule screen, when the customer picks a date, then only free time slots for the booking's service duration on that date are shown, in the business `timeZone`, excluding business hours closures, schedule blocks and occupied slots (KAN-141, KAN-143). [KAN-157]
- [ ] **AC-KAN-157-02** · edge · Given the booking's own current slot, when the customer views its date, then the current slot is marked as current and cannot be chosen as the new slot. [KAN-157]
- [ ] **AC-KAN-157-03** · edge · Given a date with no free time slots (full, closed or fully blocked), when the customer picks it, then `customer:bookingChanges.reschedule.noSlotsEmpty` is shown. [KAN-157]
- [ ] **AC-KAN-157-04** · edge · Given dates in the past, or dates whose slots would fall inside the policy window, when the customer browses dates, then those dates or slots cannot be selected. See AS-1. [KAN-157, KAN-158]
- [ ] **AC-KAN-157-05** · error · Given the availability cannot be loaded because of the network, when the customer picks a date, then `common:errors.network` is shown with a retry action and no slot can be selected. [KAN-157]
- [ ] **AC-KAN-157-06** · happy · Given a booking with a `collaboratorId`, when the customer picks a date, then only slots in which that collaborator is free are shown (as in AC-KAN-142-01); the booking's own time does not count as taken. See AS-7. [KAN-157, KAN-142]

### KAN-158 — Change the date or time of a booking within the business policy
- [ ] **AC-KAN-158-01** · happy · Given a future `pending` or `confirmed` booking inside the allowed window, when the customer picks a free slot and confirms, then the booking's `startsAt` / `endsAt` change to the new slot, its `status` stays the same, and an entry with the previous and new times is appended to `rescheduleHistory`. See AS-2. [KAN-158]
- [ ] **AC-KAN-158-02** · happy · Given the reschedule succeeded, when the customer views the booking and the business views its agenda, then both show the new time, and the previous slot is free again for other customers. [KAN-158]
- [ ] **AC-KAN-158-03** · error · Given the current time is already inside the business's reschedule window before `startsAt`, when the customer confirms a reschedule, then the booking does not change and `customer:bookingChanges.reschedule.windowClosedError` is shown. See AS-1. [KAN-158]
- [ ] **AC-KAN-158-04** · error · Given the chosen slot was taken or blocked after it was shown, when the customer confirms, then the booking keeps its previous time, `customer:bookingChanges.reschedule.slotTakenError` is shown and the free slots are refreshed. [KAN-158, KAN-144]
- [ ] **AC-KAN-158-05** · error · Given the business changed the booking meanwhile (cancelled it, marked it or rescheduled it), when the customer confirms, then nothing is overwritten and `customer:bookingChanges.reschedule.bookingChangedError` is shown with the current state of the booking. [KAN-158]
- [ ] **AC-KAN-158-06** · error · Given the request fails because of the network or the server, when the customer confirms, then the booking keeps its previous time and `common:errors.network` or `common:errors.unknown` is shown. [KAN-158]
- [ ] **AC-KAN-158-07** · edge · Given the customer's `Customer` record at the business is `blocked` (KAN-93), when they confirm a reschedule, then the booking does not change and `customer:bookingChanges.reschedule.customerBlockedError` is shown. See AS-3. [KAN-158, KAN-93]
- [ ] **AC-KAN-158-08** · edge · Given the business is `inactive` or `suspended`, when the customer confirms a reschedule, then the booking does not change and `customer:bookingChanges.businessUnavailableError` is shown. See AS-4. [KAN-158, KAN-49]
- [ ] **AC-KAN-158-09** · error · Given the booking's collaborator is now `inactive`, when the customer confirms a reschedule, then the booking does not change and `customer:bookingChanges.reschedule.collaboratorUnavailableError` is shown; cancelling is still possible. See AS-7. [KAN-158, KAN-83]

### KAN-159 — Cancel a future booking
- [ ] **AC-KAN-159-01** · happy · Given a `pending` or `confirmed` booking whose `startsAt` is in the future, when the customer chooses "Cancel", reviews the policy (KAN-160) and confirms, then the booking's `status` becomes `cancelled` with `cancellation.cancelledBy` = customer, `cancellation.isPenalized` set as shown before confirming (KAN-161) and `cancellation.note` set to the optional reason. See AS-5. [KAN-159]
- [ ] **AC-KAN-159-02** · happy · Given the cancellation succeeded, when the customer returns to "My bookings", then the booking is no longer in the upcoming list, appears in the history as `cancelled`, and its slot is free again for other customers. [KAN-159, KAN-151, KAN-153]
- [ ] **AC-KAN-159-03** · error · Given the booking was already `cancelled`, `completed` or `no_show`, or its `startsAt` has passed, when the customer confirms the cancellation, then nothing changes and `customer:bookingChanges.cancel.notAllowedError` is shown with the booking's current status. [KAN-159]
- [ ] **AC-KAN-159-04** · error · Given the request fails because of the network or the server, when the customer confirms, then the booking keeps its status and `common:errors.network` or `common:errors.unknown` is shown. [KAN-159]
- [ ] **AC-KAN-159-05** · edge · Given the customer closes the cancellation dialog without confirming, when they return to the booking, then nothing has changed. [KAN-159]
- [ ] **AC-KAN-159-06** · edge · Given a reason longer than the maximum length, when the customer confirms, then the cancellation is not sent and `validation:tooLong` is shown on the reason field. See AS-5. [KAN-159]

### KAN-160 — See the cancellation policy before confirming a cancellation
- [ ] **AC-KAN-160-01** · happy · Given a business with a `BookingPolicy`, when the customer opens the cancellation dialog, then the cancellation window and penalty are shown before the confirm action, together with the booking's date and time in the business `timeZone`. [KAN-160]
- [ ] **AC-KAN-160-02** · edge · Given a business with no `BookingPolicy` configured, when the cancellation dialog opens, then `customer:bookingChanges.policy.noPolicyEmpty` is shown and the cancellation is not penalized. See AS-6. [KAN-160]
- [ ] **AC-KAN-160-03** · error · Given the policy cannot be loaded because of the network, when the dialog opens, then `common:errors.network` is shown and the confirm action stays disabled until the policy loads. [KAN-160]

### KAN-161 — Know whether a penalty applies before rescheduling or cancelling
- [ ] **AC-KAN-161-01** · happy · Given the current time is before the business's cancellation window, when the customer opens the cancellation dialog, then `customer:bookingChanges.penalty.noneNotice` is shown and the cancellation is stored with `isPenalized` = false. [KAN-161]
- [ ] **AC-KAN-161-02** · happy · Given the current time is inside the cancellation window, when the customer opens the cancellation dialog, then `customer:bookingChanges.penalty.appliesWarning` with the business's penalty is shown, the customer must confirm again knowing it applies, and the cancellation is stored with `isPenalized` = true. See AS-1. [KAN-161]
- [ ] **AC-KAN-161-03** · happy · Given a reschedule that is allowed, when the customer reviews it before confirming, then the screen states whether a penalty applies, using the same notices. See AS-1. [KAN-161, KAN-158]
- [ ] **AC-KAN-161-04** · edge · Given the dialog was opened before the window started and the customer confirms after it started, when the server processes the request, then the server decides with its own clock: the cancellation is not stored and `customer:bookingChanges.penalty.changedError` is shown with the updated penalty for the customer to confirm again. [KAN-161]
- [ ] **AC-KAN-161-05** · error · Given the penalty cannot be determined because the policy failed to load, when the customer tries to confirm, then the action stays disabled and `common:errors.network` is shown. [KAN-161]

### KAN-162 — Get a confirmation when the booking was rescheduled or cancelled
- [ ] **AC-KAN-162-01** · happy · Given a successful reschedule, when the request ends, then `customer:bookingChanges.reschedule.success` is shown with the new date and time in the business `timeZone`, and the customer lands on the updated booking detail. [KAN-162]
- [ ] **AC-KAN-162-02** · happy · Given a successful cancellation, when the request ends, then `customer:bookingChanges.cancel.success` is shown, stating whether it was penalized, and the booking detail shows `cancelled`. [KAN-162]
- [ ] **AC-KAN-162-03** · error · Given the reschedule or cancellation failed, when the request ends, then no success confirmation is shown and the error of the matching KAN-158 or KAN-159 criterion is shown instead. [KAN-162]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| — | — | No story of this epic is blocked. Q1 (2026-09-28): a reschedule keeps the booking's collaborator (AC-KAN-157-06, AC-KAN-158-09, AS-7). |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | The `BookingPolicy` window is a number of hours before `startsAt`. Inside it, rescheduling is not allowed and cancelling is still allowed but penalized. Before it, both are free. | AC-KAN-157-04, AC-KAN-158-03, AC-KAN-161-02, AC-KAN-161-03 |
| AS-2 | A customer reschedule takes effect immediately (no business approval) and keeps the booking's status; a `pending` booking stays `pending`. | AC-KAN-158-01 |
| AS-3 | A customer blocked by the business (KAN-93) can still cancel but cannot reschedule. | AC-KAN-158-07 |
| AS-4 | While a business is `inactive` or `suspended`, customers cannot reschedule its bookings; cancelling is still allowed. | AC-KAN-158-08 |
| AS-5 | The customer may add an optional cancellation reason, stored in `cancellation.note`, up to 500 characters. | AC-KAN-159-01, AC-KAN-159-06 |
| AS-6 | Without a configured `BookingPolicy`, cancelling and rescheduling are allowed until `startsAt` and never penalized. | AC-KAN-160-02 |
| AS-7 | A customer reschedule keeps the same collaborator (`collaboratorId` does not change) and only offers that collaborator's free time; to change collaborator the customer cancels and books again. | AC-KAN-157-06, AC-KAN-158-09 |

## Backlog issues
- KAN-156 says "solicitar su reprogramación" (request), suggesting an approval step; KAN-158 says the customer changes the booking. Treated as a direct change (AS-2); confirm with the team.
- KAN-161 speaks of a penalty for rescheduling, while KAN-158 says rescheduling is only allowed within the policy. Both cannot apply at once; AS-1 chooses "reschedule forbidden inside the window".
- KAN-162 (on-screen confirmation) overlaps with KAN-166 / KAN-167 (emails in KAN-163). The screen is specified here, emails there.
- KAN-160 repeats KAN-147 (policies before booking) for cancellation; the same policy content is reused.
- The glossary says the penalty is part of `BookingPolicy` but no story says what a penalty is (fee, blocked bookings…). This spec only shows it and records `isPenalized`.

## Non-functional
- i18n keys: new prefix `customer:bookingChanges.*` (`reschedule.*`, `cancel.*`, `policy.*`, `penalty.*`, `businessUnavailableError`); reused `common:errors.network`, `common:errors.notFound`, `common:errors.unknown`, `validation:tooLong`.
- Writes via callable functions `rescheduleBooking` and `cancelBooking` in a transaction that re-checks status, ownership, window and availability (`api-mutation-standards` §1); the ViewModel checks `canTransition` before showing cancel. Invalidate the "My bookings" queries after success.
- Availability for the new slot comes from `getAvailability` (`auth-and-roles` §4); the check right before confirming may use realtime (`api-query-standards` §9).
- Private page: `RequireRole` for `customer`; idle logout after `PlatformSettings.idleTimeoutMinutes` (KAN-133, KAN-182). App Check protects the callables.
- Times in the business `timeZone`; any penalty amount from `priceInCents` in the business currency.
- Accessibility: the cancellation dialog traps focus and returns it to the trigger; the penalty warning uses an alert role; the current slot is announced as current, not only styled.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-156 | AC-KAN-156-01 … AC-KAN-156-04 | `tests/RescheduleBookingPage.test.tsx` |
| KAN-157 | AC-KAN-157-01 … AC-KAN-157-06 | `tests/RescheduleBookingPage.test.tsx` |
| KAN-158 | AC-KAN-158-01 … AC-KAN-158-09 | `tests/RescheduleBookingPage.test.tsx`, `functions/src/bookings/tests/rescheduleBooking.test.ts` |
| KAN-159 | AC-KAN-159-01 … AC-KAN-159-06 | `tests/CancelBookingDialog.test.tsx`, `functions/src/bookings/tests/cancelBooking.test.ts` |
| KAN-160 | AC-KAN-160-01 … AC-KAN-160-03 | `tests/CancelBookingDialog.test.tsx` |
| KAN-161 | AC-KAN-161-01 … AC-KAN-161-05 | `tests/CancelBookingDialog.test.tsx`, `tests/RescheduleBookingPage.test.tsx`, `functions/src/bookings/tests/cancelBooking.test.ts` |
| KAN-162 | AC-KAN-162-01 … AC-KAN-162-03 | `tests/RescheduleBookingPage.test.tsx`, `tests/CancelBookingDialog.test.tsx` |
