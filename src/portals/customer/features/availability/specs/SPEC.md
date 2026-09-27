# Availability lookup (KAN-139)

| Field | Value |
| --- | --- |
| Portal | customer |
| Feature folder | `src/portals/customer/features/availability/` |
| Stories | KAN-140, KAN-141, KAN-142, KAN-143, KAN-144 |
| Status | BLOCKED (partially) |
| Depends on | Q1 (collaborator); Q4 (how a business page is reached); Q6 (visitor entry into the booking flow); KAN-64 business hours; KAN-65 / KAN-66 schedule blocks; KAN-70 booking confirmation mode; `service-selection` spec (KAN-134); booking-checkout spec (KAN-145, KAN-148) |

## Intent
After choosing a service, a customer picks a date and sees only the time slots in which the business can actually serve that service, in the business's time zone. Just before the booking is confirmed, the system checks again that the slot is still free so that two bookings never collide.

## Actors and permissions
| Actor | Can |
| --- | --- |
| customer | Pick a date and see the free time slots of the chosen service; pick one slot |
| visitor | Availability is a public read (`auth-and-roles` §3); how a visitor enters the flow depends on Q6 |
| system (Cloud Functions) | Compute free `TimeSlot`s (`getAvailability` callable, returns free slots only) and re-check the slot when the booking is confirmed |

## In scope
- Date selection for the chosen service.
- Computing and showing only free time slots, excluding business closed hours, `ScheduleBlock`s (partial and full-day) and existing bookings.
- Re-validating the chosen slot on the server right before the booking is created.

## Out of scope
- Availability per collaborator (KAN-142) while Q1 is open.
- The booking summary, policies and confirmation screens (KAN-146 to KAN-149).
- Rescheduling (KAN-157, KAN-158), which reuses this availability in its own spec.
- The URL form of a business page (Q4).

## Data
- `Business` (read): `timeZone`, `status`, `BusinessHours` (KAN-64).
- `ScheduleBlock` (`businesses/{businessId}/scheduleBlocks/{scheduleBlockId}`, read by the function only): partial (KAN-65) and full-day (KAN-66).
- `Booking` (read by the function only): `startsAt`, `endsAt`, `status`. Customers never read other customers' bookings.
- `Service` (read): `durationMinutes`, `status`.
- `TimeSlot` (computed, not stored): `startsAt`, `endsAt`.
- No new stored fields.

## Acceptance criteria

### KAN-140 — Pick a date to see available time slots
- [ ] **AC-KAN-140-01** · happy · Given a customer who chose an `active` service, when they pick a date in the date picker, then the free time slots of that service on that date are loaded and shown. [KAN-140]
- [ ] **AC-KAN-140-02** · error · Given the availability cannot be loaded because of the network, when the customer picks a date, then `common:errors.network` is shown with a retry action and no time slots are shown. [KAN-140]
- [ ] **AC-KAN-140-03** · error · Given the service was deactivated after it was chosen, when the customer picks a date, then no slots are shown, `customer:availability.errors.serviceUnavailable` is shown and the customer is offered to go back to service selection. [KAN-140, KAN-58]
- [ ] **AC-KAN-140-04** · edge · Given today in the business `timeZone`, when the date picker opens, then dates before today cannot be picked. [KAN-140]
- [ ] **AC-KAN-140-05** · edge · Given the booking window (AS-1), when the date picker opens, then dates after the last bookable day cannot be picked. [KAN-140]
- [ ] **AC-KAN-140-06** · edge · Given the customer's device is in a different time zone from the business, when dates and slots are shown, then "today" and every time are in the business `timeZone`, and that time zone is indicated. [KAN-140]
- [ ] **AC-KAN-140-07** · edge · Given the date picker opens, when no date has been picked yet, then the first date with at least one free slot is preselected. See AS-2. [KAN-140]
- [ ] **AC-KAN-140-08** · edge · Given the customer picks another date while the previous date is still loading, when both answers arrive, then only the slots of the last picked date are shown. [KAN-140]

### KAN-141 — See only available time slots
- [ ] **AC-KAN-141-01** · happy · Given a date with business hours and no bookings or blocks, when the slots load, then every slot fits entirely inside business hours for the service's `durationMinutes`, starting at the configured interval. See AS-3. [KAN-141]
- [ ] **AC-KAN-141-02** · happy · Given a `pending` or `confirmed` booking of the business on that date, when the slots load, then no slot that overlaps that booking is shown. See AS-4. [KAN-141]
- [ ] **AC-KAN-141-03** · error · Given the availability answer is incomplete or invalid, when the customer picks a date, then no slots are shown (never an unfiltered list) and `common:errors.unknown` is shown with a retry action. [KAN-141]
- [ ] **AC-KAN-141-04** · edge · Given the picked date is today in the business `timeZone`, when the slots load, then slots that start before now are not shown. See AS-5. [KAN-141]
- [ ] **AC-KAN-141-05** · edge · Given a service whose duration would end after closing time, when the slots load, then no slot is shown that ends after closing time. [KAN-141, KAN-64]
- [ ] **AC-KAN-141-06** · edge · Given a `cancelled`, `completed` or `no_show` booking on that date, when the slots load, then it does not make any slot unavailable. [KAN-141]
- [ ] **AC-KAN-141-07** · edge · Given a date on which a daylight-saving change happens in the business `timeZone`, when the slots load, then no slot is duplicated or skipped and every slot shows its real local time. [KAN-141]
- [ ] **AC-KAN-141-08** · edge · Given a date with no free slot left, when the slots load, then `customer:availability.slots.emptyDay` is shown with an action to pick another date. [KAN-141]

### KAN-143 — Blocked times, breaks and non-working days are not available
- [ ] **AC-KAN-143-01** · happy · Given a partial `ScheduleBlock` (KAN-65) on a date, when the slots load, then no slot that overlaps the block, even partly, is shown. [KAN-143, KAN-65]
- [ ] **AC-KAN-143-02** · happy · Given a full-day `ScheduleBlock` (KAN-66) on a date, when the customer looks at the date picker, then that date cannot be picked or shows `customer:availability.slots.emptyDay`. [KAN-143, KAN-66]
- [ ] **AC-KAN-143-03** · happy · Given a weekday on which the business has no business hours, when the customer looks at the date picker, then those dates cannot be picked. [KAN-143, KAN-64]
- [ ] **AC-KAN-143-04** · error · Given the business has not configured any business hours, when the customer opens availability, then no date can be picked and `customer:availability.slots.notConfigured` is shown. [KAN-143, KAN-64]
- [ ] **AC-KAN-143-05** · error · Given a `ScheduleBlock` created by the subscriber after the customer loaded the slots, when the customer tries to book a slot it covers, then the booking is rejected by the re-validation of KAN-144. [KAN-143, KAN-144]
- [ ] **AC-KAN-143-06** · edge · Given a partial block that ends in the middle of a service duration, when the slots load, then the first slot shown after the block starts at or after the block's end. [KAN-143]
- [ ] **AC-KAN-143-07** · edge · Given a business that is `inactive` or `suspended`, when the customer opens availability, then no slots are offered and `customer:availability.errors.businessUnavailable` is shown. See AS-6. [KAN-143, KAN-49]

### KAN-144 — Re-check availability before the booking is confirmed
- [ ] **AC-KAN-144-01** · happy · Given a customer confirms a booking (KAN-148) for a slot that is still free, when the server checks again, then the booking is created with that `startsAt` and `endsAt`. [KAN-144, KAN-148]
- [ ] **AC-KAN-144-02** · error · Given the slot was taken by another booking, or covered by a new `ScheduleBlock`, after the customer picked it, when they confirm, then no booking is created, `customer:bookingCheckout.confirm.slotTakenError` (owned by the booking-checkout spec, AC-KAN-148-03) is shown and the slots of that date are reloaded without it. [KAN-144]
- [ ] **AC-KAN-144-03** · error · Given the business hours changed so that the slot is outside them, or the slot's start is now in the past, when the customer confirms, then no booking is created and `customer:bookingCheckout.confirm.slotTakenError` (owned by the booking-checkout spec, AC-KAN-148-03) is shown. [KAN-144]
- [ ] **AC-KAN-144-04** · error · Given the re-check fails because of the network, when the customer confirms, then no booking is created, `common:errors.network` is shown and the customer can retry with the same slot. [KAN-144]
- [ ] **AC-KAN-144-05** · edge · Given two customers confirm the same free slot at the same moment, when both requests reach the server, then exactly one booking is created and the other customer sees `customer:bookingCheckout.confirm.slotTakenError` (owned by the booking-checkout spec, AC-KAN-148-03). [KAN-144]
- [ ] **AC-KAN-144-06** · edge · Given the customer double-clicks confirm, when the requests reach the server, then at most one booking is created. [KAN-144]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| KAN-142 | Q1 — collaborator | Availability for a chosen collaborator, collaborator absences (KAN-66 "ausencia de colaboradores") and per-collaborator capacity. |
| All stories (visitor entry) | Q6 — booking without an account | Whether a visitor can continue past slot selection. Viewing slots is public; confirming is decided in KAN-116 / KAN-148. |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | The booking window is 60 days ahead, counted in the business `timeZone`. No story defines it; it is a candidate for `BookingPolicy` or `PlatformSettings`. | AC-KAN-140-05 |
| AS-2 | When the step opens, the first date with a free slot is preselected; if none exists within the booking window, today is shown with the empty state. | AC-KAN-140-07 |
| AS-3 | Slots start every 30 minutes from the opening time of each business-hours range, and each slot lasts the service's `durationMinutes`. | AC-KAN-141-01 |
| AS-4 | While Q1 is open the business serves one booking at a time: a slot is free when it overlaps no `pending` or `confirmed` booking of the business. Capacity must be revisited when Q1 is decided. `pending` bookings hold the slot. | AC-KAN-141-02, AC-KAN-141-06, AC-KAN-144-05 |
| AS-5 | There is no minimum notice: a slot for today is shown if it starts after the current time in the business `timeZone`. | AC-KAN-141-04 |
| AS-6 | An `inactive` or `suspended` business accepts no new bookings (same assumption as in `business-home`). | AC-KAN-143-07 |
| AS-7 | The re-check of KAN-144 runs inside the same server operation that creates the booking (KAN-148), so there is no gap between checking and writing. | AC-KAN-144-01, AC-KAN-144-05 |

## Backlog issues
- KAN-144 (re-check before confirming) happens at confirmation, which belongs to KAN-148 in epic KAN-145. The re-check is specified here; the confirmation screen there.
- KAN-143 names "tiempos de descanso" and "días inhábiles"; they are read as partial blocks (KAN-65), full-day blocks (KAN-66) and weekdays without business hours (KAN-64). KAN-66 also mentions collaborator absences, which wait on Q1.
- KAN-142 repeats the collaborator filter blocked by Q1 (KAN-67, KAN-68, KAN-136 to KAN-138).
- KAN-69 and KAN-71 (subscriber creates / reschedules manually "with the same validation") and KAN-157 (customer reschedule) must reuse this availability; no story says so explicitly.
- No story defines the booking window, the slot interval or a minimum notice (AS-1, AS-3, AS-5).

## Non-functional
- i18n prefixes (new): `customer:availability.slots.*`, `customer:availability.errors.*`. Reused: `common:errors.network`, `common:errors.unknown`, `customer:bookingCheckout.confirm.slotTakenError` (defined by the booking-checkout spec).
- Slots are computed only on the server in the business `timeZone` (IANA), never in the browser's time zone; the callable returns free slots only and no data about other customers' bookings.
- The re-check and the booking creation are atomic on the server (AS-7).
- Availability for the shown date is fetched fresh when the step opens and after a rejected confirmation; no realtime updates are required.
- Accessibility: the date picker is keyboard operable and announces disabled dates; slots are a single-select group with times read with their time zone; works at phone width.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-140 | AC-KAN-140-01 … AC-KAN-140-08 | `tests/AvailabilityPage.test.tsx` |
| KAN-141 | AC-KAN-141-01 … AC-KAN-141-08 | `tests/AvailabilityPage.test.tsx`; `functions/src/bookings/tests/getAvailability.test.ts` |
| KAN-142 | — (BLOCKED, Q1) | — |
| KAN-143 | AC-KAN-143-01 … AC-KAN-143-07 | `functions/src/bookings/tests/getAvailability.test.ts`; `tests/AvailabilityPage.test.tsx` |
| KAN-144 | AC-KAN-144-01 … AC-KAN-144-06 | `functions/src/bookings/tests/createBooking.test.ts`; `tests/AvailabilityPage.test.tsx` |
