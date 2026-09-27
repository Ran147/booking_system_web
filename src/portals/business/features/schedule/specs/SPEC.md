# Schedule and bookings management (KAN-63)

| Field | Value |
| --- | --- |
| Portal | business |
| Feature folder | `src/portals/business/features/schedule/` |
| Stories | KAN-64, KAN-65, KAN-66, KAN-67, KAN-68, KAN-69, KAN-70, KAN-71, KAN-72, KAN-73, KAN-74, KAN-75, KAN-76 |
| Status | BLOCKED (partially) |
| Depends on | KAN-28 (subscriber sign-in); KAN-30 (services, snapshot KAN-62); KAN-87 epic (business customers, customers without an account KAN-88, blocked customers KAN-93); KAN-139 epic (availability computation KAN-141, KAN-143, KAN-144); KAN-32 / KAN-49 (read-only); KAN-163 epic (customer emails); KAN-77 epic and Q1 (collaborators) |

## Intent
The subscriber controls when their business can be booked and manages every booking. They set business hours and block times or whole days, see bookings and blocks together in a daily or weekly agenda, create bookings by hand with the same double-booking protection customers get, choose between manual and automatic confirmation, and reschedule, cancel, complete or mark bookings as no-show. Paginated lists and a filtered history give them traceability of how the business operates.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own business only) | Everything in this spec for their own business while it is `active`. While the business is `inactive` or `suspended` (KAN-49), only view the agenda, lists and history. "Como usuario" in KAN-69 and KAN-71 means the subscriber. |
| customer | Books, reschedules and cancels from the customer portal (KAN-145, KAN-155 epics); sees only free time slots, never other customers' bookings. Not part of this spec. |
| system (Cloud Functions) | Creates, reschedules and changes the status of bookings in a transaction; writes the service snapshot (KAN-62). |
| collaborator | BLOCKED — Q1. |

## In scope
- Business hours (`BusinessHours`) and schedule blocks (`ScheduleBlock`), partial and full-day, at business level.
- Agenda (`Schedule`) in day and week views with bookings and blocks, live updates, and business-level free / full indication.
- Manual booking creation by the subscriber.
- Booking confirmation mode (manual or automatic) and confirming `pending` bookings.
- Reschedule, cancel (with penalty flag and note), complete and no-show.
- Paginated booking list and filtered history of past bookings.

## Out of scope
- Everything about collaborators: filter by collaborator, per-collaborator availability and load, collaborator absences, assigning a collaborator to a booking (Q1).
- The availability algorithm itself (KAN-139 epic); this spec reuses it.
- Booking policies window and penalty rules (`BookingPolicy`, KAN-147, KAN-160) — only the `isPenalized` flag is recorded here.
- Emails and reminders to customers about bookings (KAN-163 epic) and internal alerts (KAN-101).
- Reports and export (KAN-102 epic).

## Data
- `BusinessHours` (field on `Business`, KAN-64) and `Business.timeZone` (`domain-glossary` §3).
- `ScheduleBlock` at `businesses/{businessId}/scheduleBlocks/{scheduleBlockId}`: partial (KAN-65) or full-day (KAN-66). Fields used: start and end (date-times, or dates for full-day), reason (text). No collaborator field (Q1).
- `Booking` at `businesses/{businessId}/bookings/{bookingId}`: `status` (`pending`, `confirmed`, `cancelled`, `completed`, `no_show`, §4.1), `startsAt`, `endsAt`, `serviceId`, `serviceSnapshot`, `customerId`, `customerUserId` (Nullable), `cancellation` (`cancelledBy`, `isPenalized`, `note`), `rescheduleHistory`.
- `Customer` at `businesses/{businessId}/customers/{customerId}` (status `active` | `blocked`).
- `TimeSlot` (computed, KAN-141) and `Schedule` (view).
- **New field (name to confirm in review):** the booking confirmation mode on `Business` (manual or automatic) for KAN-70, for example `bookingConfirmationMode` with values `manual` | `automatic`.
- Nothing is added for collaborators (Q1).

## Acceptance criteria

### KAN-64 — Configure business hours
- [ ] **AC-KAN-64-01** · happy · Given a subscriber of an `active` business, when they set opening and closing times for each day of the week (marking some days as closed) and save, then the business hours are stored and the agenda and the customer availability (KAN-141) only offer times inside those hours, in the business `timeZone`. [KAN-64]
- [ ] **AC-KAN-64-02** · error · Given a day whose closing time is not after its opening time, or two ranges of the same day that overlap, when the subscriber saves, then nothing is saved and `business:schedule.hours.invalidRangeError` is shown on that day. [KAN-64]
- [ ] **AC-KAN-64-03** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to save business hours, then nothing changes and `business:errors.readOnly` is shown. [KAN-64, KAN-49]
- [ ] **AC-KAN-64-04** · error · Given the request fails because of the network, when the subscriber saves, then the previous hours stay in effect, the form keeps the edited values and `common:errors.network` is shown. [KAN-64]
- [ ] **AC-KAN-64-05** · edge · Given a day with two ranges (for example 09:00–13:00 and 15:00–19:00), when it is saved, then the gap between them is not offered as available. See AS-1. [KAN-64]
- [ ] **AC-KAN-64-06** · edge · Given existing `pending` or `confirmed` bookings that fall outside the new hours, when the hours are saved, then those bookings are kept and the subscriber sees `business:schedule.hours.bookingsOutsideWarning` with their count. See AS-2. [KAN-64]
- [ ] **AC-KAN-64-07** · edge · Given a business that has never set its hours, when a customer checks availability, then no time is offered and the subscriber sees `business:schedule.hours.notConfiguredNotice` on the agenda. See AS-3. [KAN-64]

### KAN-65 — Block time ranges at business level
- [ ] **AC-KAN-65-01** · happy · Given a subscriber of an `active` business, when they create a block on a date with a start time, end time and optional reason (for example lunch) and save, then the block is shown in the agenda and that range is not offered as available to customers (KAN-143) or for manual bookings. [KAN-65]
- [ ] **AC-KAN-65-02** · error · Given an end time that is not after the start time, or a missing date, when the subscriber saves, then nothing is saved and `business:schedule.blocks.invalidRangeError` or `validation:required` is shown. [KAN-65]
- [ ] **AC-KAN-65-03** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to create, edit or delete a block, then nothing changes and `business:errors.readOnly` is shown. [KAN-65, KAN-49]
- [ ] **AC-KAN-65-04** · error · Given the request fails because of the network, when the subscriber saves a block, then no block is created and `common:errors.network` is shown. [KAN-65]
- [ ] **AC-KAN-65-05** · edge · Given the range overlaps `pending` or `confirmed` bookings, when the subscriber saves, then `business:schedule.blocks.overlapsBookingsConfirm` is shown with those bookings; if they confirm, the block is created and the bookings are kept unchanged. See AS-4. [KAN-65]
- [ ] **AC-KAN-65-06** · edge · Given an existing block, when the subscriber deletes it, then the range becomes available again (if inside business hours and not booked). [KAN-65]
- [ ] **AC-KAN-65-07** · edge · Given a block that repeats every day (for example a daily lunch break), when the subscriber wants it, then they create it per date; recurring blocks are not part of this story. See AS-5. [KAN-65]

### KAN-66 — Block full days
- [ ] **AC-KAN-66-01** · happy · Given a subscriber of an `active` business, when they block one day or a range of days (for example a holiday or vacation) with an optional reason and save, then those days show as blocked in the agenda and no time on them is offered to customers or for manual bookings. [KAN-66]
- [ ] **AC-KAN-66-02** · error · Given an end date earlier than the start date, or a missing date, when the subscriber saves, then nothing is saved and `business:schedule.blocks.invalidRangeError` or `validation:required` is shown. [KAN-66]
- [ ] **AC-KAN-66-03** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to block days, then nothing changes and `business:errors.readOnly` is shown. [KAN-66, KAN-49]
- [ ] **AC-KAN-66-04** · error · Given the request fails because of the network, when the subscriber saves, then no block is created and `common:errors.network` is shown. [KAN-66]
- [ ] **AC-KAN-66-05** · edge · Given blocked days that contain `pending` or `confirmed` bookings, when the subscriber saves, then they are warned with `business:schedule.blocks.overlapsBookingsConfirm` and, if they confirm, the bookings are kept. See AS-4. [KAN-66]
- [ ] **AC-KAN-66-06** · edge · Given a full-day block, when it is evaluated, then the day runs from 00:00 to 24:00 in the business `timeZone`, not in the browser's time zone. [KAN-66]

### KAN-67 — Agenda in day or week view with bookings and blocks
- [ ] **AC-KAN-67-01** · happy · Given a subscriber, when they open the agenda, then they see the current week (or day) in the business `timeZone` with their business's bookings (customer, service name from the snapshot, time, status badge) and schedule blocks in the same calendar, and closed hours shaded. [KAN-67]
- [ ] **AC-KAN-67-02** · happy · Given the agenda, when the subscriber switches between day and week view or moves to the previous or next period, then the calendar shows that period with its bookings and blocks. [KAN-67]
- [ ] **AC-KAN-67-03** · happy · Given the agenda is open, when a booking is created, rescheduled or cancelled by a customer or elsewhere, then the agenda updates without reloading. [KAN-67]
- [ ] **AC-KAN-67-04** · error · Given the agenda cannot be loaded because of the network, when the subscriber opens it, then an error state with `common:errors.network` and a retry action is shown instead of an empty calendar. [KAN-67]
- [ ] **AC-KAN-67-05** · edge · Given a period with no bookings or blocks, when it is shown, then the empty calendar with business hours is shown (not an error). [KAN-67]
- [ ] **AC-KAN-67-06** · edge · Given a week that includes a daylight-saving change in the business `timeZone`, when it is shown, then every booking appears at its correct local time. [KAN-67]
- [ ] **AC-KAN-67-07** · edge · Given overlapping items in the same time (for example a booking inside a block, AS-4), when they are drawn, then both are visible and distinguishable. [KAN-67]
- [ ] **AC-KAN-67-08** · edge · Given a subscriber whose browser is in a different time zone from the business, when they open the agenda, then times are shown in the business `timeZone` and the zone is indicated. [KAN-67]

### KAN-68 — See availability and full times
- [ ] **AC-KAN-68-01** · happy · Given the agenda in day or week view, when it is shown, then times that still have free time slots (per the availability check used for customers, KAN-141) and times that are full are marked differently, at business level. [KAN-68]
- [ ] **AC-KAN-68-02** · error · Given the availability cannot be computed because of the network, when the agenda is shown, then bookings and blocks are still shown, the free / full marks are hidden and `business:schedule.agenda.availabilityError` is shown. [KAN-68]
- [ ] **AC-KAN-68-03** · edge · Given a booking is created or cancelled while the agenda is open, when it happens, then the free / full marks update without reloading. [KAN-68]

### KAN-69 — Create a booking manually
- [ ] **AC-KAN-69-01** · happy · Given a subscriber of an `active` business, when they choose a service, a date and a time offered as available, and an existing customer of the business, and save, then a booking is created with that customer, the service snapshot (KAN-62), `startsAt` / `endsAt` from the service duration in the business `timeZone`, and a status set by the confirmation mode (KAN-70). [KAN-69]
- [ ] **AC-KAN-69-02** · happy · Given a person without an account (phone booking), when the subscriber enters them as a new customer of the business (KAN-88) and saves the booking, then the booking is created with `customerUserId` empty and the customer record is created in the business. [KAN-69]
- [ ] **AC-KAN-69-03** · error · Given the chosen time is taken by another booking or a block by the time the subscriber saves (for example a customer booked it a moment before), when the booking is saved, then it is rejected, no booking is created and `business:schedule.bookings.slotTakenError` is shown with refreshed times. [KAN-69]
- [ ] **AC-KAN-69-04** · error · Given a time outside business hours, in a blocked range or in the past, when the subscriber tries to save, then it is rejected with `business:schedule.bookings.slotUnavailableError`. [KAN-69]
- [ ] **AC-KAN-69-05** · error · Given a missing service, date, time or customer, when the subscriber saves, then nothing is created and `validation:required` is shown next to each field. [KAN-69]
- [ ] **AC-KAN-69-06** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to create a booking, then nothing is created and `business:errors.readOnly` is shown. [KAN-69, KAN-49]
- [ ] **AC-KAN-69-07** · error · Given the request fails because of the network, when the subscriber saves, then no booking is created, the form keeps its values and `common:errors.network` is shown; retrying never creates two bookings. [KAN-69]
- [ ] **AC-KAN-69-08** · edge · Given two bookings for the same time are requested at the same moment (subscriber and customer, or two subscriber tabs), when both reach the server, then exactly one is created and the other gets `business:schedule.bookings.slotTakenError`. [KAN-69]
- [ ] **AC-KAN-69-09** · edge · Given a customer whose status is `blocked` (KAN-93), when the subscriber selects them, then the booking cannot be saved and `business:schedule.bookings.customerBlockedError` is shown. See AS-6. [KAN-69]
- [ ] **AC-KAN-69-10** · edge · Given an `inactive` service, when the subscriber opens the service choice, then it is not offered. [KAN-69, KAN-58]

### KAN-70 — Manual or automatic confirmation
- [ ] **AC-KAN-70-01** · happy · Given a subscriber of an `active` business, when they set the confirmation mode to automatic and save, then new bookings (from customers and from KAN-69) are created as `confirmed`. [KAN-70]
- [ ] **AC-KAN-70-02** · happy · Given the confirmation mode is manual, when a new booking is created, then its status is `pending` and it appears in the agenda and list with the `pending` badge. [KAN-70]
- [ ] **AC-KAN-70-03** · happy · Given a `pending` booking whose `startsAt` is in the future, when the subscriber confirms it, then its status becomes `confirmed`. [KAN-70]
- [ ] **AC-KAN-70-04** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to change the mode or confirm a booking, then nothing changes and `business:errors.readOnly` is shown. [KAN-70, KAN-49]
- [ ] **AC-KAN-70-05** · error · Given a booking that is no longer `pending` (for example the customer cancelled it meanwhile), when the subscriber confirms it, then nothing changes and `business:schedule.bookings.invalidTransitionError` is shown with the current status. [KAN-70]
- [ ] **AC-KAN-70-06** · error · Given the request fails because of the network, when the subscriber saves the mode or confirms a booking, then nothing changes and `common:errors.network` is shown. [KAN-70]
- [ ] **AC-KAN-70-07** · edge · Given the mode changes from manual to automatic, when it is saved, then existing `pending` bookings stay `pending` and must still be confirmed or cancelled. See AS-7. [KAN-70]
- [ ] **AC-KAN-70-08** · edge · Given a business that never chose a mode, when a booking is created, then the default mode applies. See AS-8. [KAN-70]

### KAN-71 — Reschedule a booking
- [ ] **AC-KAN-71-01** · happy · Given a `pending` or `confirmed` booking whose `startsAt` is in the future, when the subscriber chooses a new date and time offered as available and confirms, then `startsAt` and `endsAt` change, the previous times are added to `rescheduleHistory`, and the status does not change. [KAN-71]
- [ ] **AC-KAN-71-02** · error · Given the new time is taken by another booking or a block (including one created a moment before), when the subscriber confirms, then the booking keeps its original time, nothing is overwritten and `business:schedule.bookings.slotTakenError` is shown. [KAN-71]
- [ ] **AC-KAN-71-03** · error · Given a booking that is `cancelled`, `completed` or `no_show`, or whose `startsAt` has passed, when the subscriber tries to reschedule it, then the action is not offered or is rejected with `business:schedule.bookings.cannotRescheduleError`. [KAN-71]
- [ ] **AC-KAN-71-04** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to reschedule, then nothing changes and `business:errors.readOnly` is shown. [KAN-71, KAN-49]
- [ ] **AC-KAN-71-05** · error · Given the request fails because of the network, when the subscriber confirms, then the booking keeps its original time and `common:errors.network` is shown. [KAN-71]
- [ ] **AC-KAN-71-06** · edge · Given a new time that overlaps only the booking's own current time (for example moving it 15 minutes later), when it is checked, then the booking's own slot does not count as taken. [KAN-71]
- [ ] **AC-KAN-71-07** · edge · Given a booking rescheduled several times, when its detail is opened, then every previous time is listed in order. [KAN-71]

### KAN-72 — Cancel a booking with penalty flag and note
- [ ] **AC-KAN-72-01** · happy · Given a `pending` or `confirmed` booking, when the subscriber cancels it choosing whether it is penalized and writing a note, then its status becomes `cancelled` and `cancellation` stores `cancelledBy` = business, `isPenalized` and the note; the time becomes available again. [KAN-72]
- [ ] **AC-KAN-72-02** · error · Given the note is empty, when the subscriber confirms the cancellation, then nothing changes and `validation:required` is shown. See AS-9. [KAN-72]
- [ ] **AC-KAN-72-03** · error · Given a note longer than the allowed length, when the subscriber confirms, then nothing changes and `validation:tooLong` is shown. See AS-9. [KAN-72]
- [ ] **AC-KAN-72-04** · error · Given a booking that is already `cancelled`, `completed` or `no_show`, when the subscriber tries to cancel it, then nothing changes and `business:schedule.bookings.invalidTransitionError` is shown. [KAN-72]
- [ ] **AC-KAN-72-05** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to cancel a booking, then nothing changes and `business:errors.readOnly` is shown. [KAN-72, KAN-49]
- [ ] **AC-KAN-72-06** · error · Given the request fails because of the network, when the subscriber confirms, then the booking keeps its status and `common:errors.network` is shown. [KAN-72]
- [ ] **AC-KAN-72-07** · edge · Given the customer cancels the same booking at the same moment (KAN-159), when both requests arrive, then only one cancellation is stored and the other gets `business:schedule.bookings.invalidTransitionError`. [KAN-72]
- [ ] **AC-KAN-72-08** · edge · Given the penalty choice, when the dialog opens, then "not penalized" is preselected. See AS-10. [KAN-72]

### KAN-73 — Mark a booking as completed
- [ ] **AC-KAN-73-01** · happy · Given a `confirmed` booking whose `startsAt` has passed, when the subscriber marks it as completed, then its status becomes `completed` and it counts in reports built from completed bookings (KAN-103). [KAN-73]
- [ ] **AC-KAN-73-02** · error · Given a `confirmed` booking whose `startsAt` is still in the future, when the subscriber tries to mark it completed, then the action is not offered or is rejected with `business:schedule.bookings.notStartedError`. [KAN-73]
- [ ] **AC-KAN-73-03** · error · Given a booking that is `pending`, `cancelled` or `no_show`, when the subscriber tries to mark it completed, then nothing changes and `business:schedule.bookings.invalidTransitionError` is shown. [KAN-73]
- [ ] **AC-KAN-73-04** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to mark a booking completed, then nothing changes and `business:errors.readOnly` is shown. [KAN-73, KAN-49]
- [ ] **AC-KAN-73-05** · error · Given the request fails because of the network, when the subscriber marks it completed, then the booking keeps its status and `common:errors.network` is shown. [KAN-73]
- [ ] **AC-KAN-73-06** · edge · Given a `completed` booking, when the subscriber views it, then no further status action is offered (terminal status). [KAN-73]

### KAN-74 — Mark a booking as no-show
- [ ] **AC-KAN-74-01** · happy · Given a `confirmed` booking whose `startsAt` has passed, when the subscriber marks it as no-show, then its status becomes `no_show`, shown with its own badge, different from `cancelled`. [KAN-74]
- [ ] **AC-KAN-74-02** · error · Given a `confirmed` booking whose `startsAt` is still in the future, when the subscriber tries to mark it no-show, then the action is not offered or is rejected with `business:schedule.bookings.notStartedError`. [KAN-74]
- [ ] **AC-KAN-74-03** · error · Given a booking that is `pending`, `cancelled` or `completed`, when the subscriber tries to mark it no-show, then nothing changes and `business:schedule.bookings.invalidTransitionError` is shown. [KAN-74]
- [ ] **AC-KAN-74-04** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to mark a no-show, then nothing changes and `business:errors.readOnly` is shown. [KAN-74, KAN-49]
- [ ] **AC-KAN-74-05** · error · Given the request fails because of the network, when the subscriber marks it no-show, then the booking keeps its status and `common:errors.network` is shown. [KAN-74]
- [ ] **AC-KAN-74-06** · edge · Given the subscriber marked no-show by mistake, when they look for an undo, then none is offered because `no_show` is terminal. See Backlog issues. [KAN-74]

### KAN-75 — Paginated booking list
- [ ] **AC-KAN-75-01** · happy · Given a subscriber whose business has bookings, when they open the booking list, then they see one page of their own business's bookings with date and time (business `timeZone`), customer, service name and price from the snapshot (business currency) and status badge, ordered by `startsAt`, with a total count. See AS-11. [KAN-75]
- [ ] **AC-KAN-75-02** · happy · Given more bookings than one page holds, when the subscriber moves to the next or previous page, then that page is shown and the current page stays visible while the next one loads. [KAN-75]
- [ ] **AC-KAN-75-03** · error · Given the list cannot be loaded because of the network, when the subscriber opens it, then an error state with `common:errors.network` and a retry action is shown. [KAN-75]
- [ ] **AC-KAN-75-04** · edge · Given no bookings, when the list opens, then `business:schedule.bookingList.emptyTitle` is shown with an action to create a booking (hidden when the business is read-only). [KAN-75]
- [ ] **AC-KAN-75-05** · edge · Given a business that is `inactive` or `suspended`, when the subscriber opens the list, then it is viewable and all status actions are disabled. [KAN-75, KAN-49]

### KAN-76 — History of past bookings with filters
- [ ] **AC-KAN-76-01** · happy · Given a subscriber, when they open the booking history, then they see a paginated list of their business's bookings whose `startsAt` is before now, newest first, with date, customer, service (snapshot), price and status. [KAN-76]
- [ ] **AC-KAN-76-02** · happy · Given the history, when the subscriber filters by date range, status and / or service, then only matching bookings are listed, the total count matches, the filters are kept in the URL and the list returns to page one. See AS-12. [KAN-76]
- [ ] **AC-KAN-76-03** · error · Given a date range whose end is before its start, when the subscriber applies it, then the filter is not applied and `business:schedule.history.invalidDateRangeError` is shown. [KAN-76]
- [ ] **AC-KAN-76-04** · error · Given the history cannot be loaded because of the network, when the subscriber opens it or changes a filter, then an error state with `common:errors.network` and a retry action is shown. [KAN-76]
- [ ] **AC-KAN-76-05** · edge · Given filters with no matches, when they are applied, then `business:schedule.history.noResults` is shown and the filters can be cleared. [KAN-76]
- [ ] **AC-KAN-76-06** · edge · Given a date range, when it is applied, then the start and end days are interpreted in the business `timeZone` and include the whole end day. [KAN-76]
- [ ] **AC-KAN-76-07** · edge · Given a booking whose service was later edited or deleted, when it appears in the history, then its name and price come from its snapshot (KAN-62). [KAN-76, KAN-62]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| KAN-66 (block days because of a collaborator's absence, vacation or sick leave) | Q1 — collaborator | Blocks tied to a collaborator. Business-level full-day blocks are specified. |
| KAN-67 (filter by collaborator only) | Q1 — collaborator | Collaborator filter in the agenda. Day / week views with bookings and blocks are specified. |
| KAN-68 (availability and full load per collaborator) | Q1 — collaborator | Showing which collaborators are free or fully booked. Only the business-level free / full marks are specified. |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | Business hours allow up to two ranges per weekday (to model a split day); each day can be marked closed. | AC-KAN-64-01, AC-KAN-64-05 |
| AS-2 | Changing business hours never cancels or moves existing bookings; the subscriber is warned and handles them manually. | AC-KAN-64-06 |
| AS-3 | A new business has no hours until the subscriber sets them, so nothing is bookable before that. | AC-KAN-64-07 |
| AS-4 | Blocks may be created over existing bookings after a confirmation; the bookings are kept and are not cancelled automatically. | AC-KAN-65-05, AC-KAN-66-05, AC-KAN-67-07 |
| AS-5 | Blocks are one-off (a date or a date range); recurring blocks are not in the backlog. | AC-KAN-65-07 |
| AS-6 | A `blocked` customer (KAN-93) cannot be booked by the subscriber either; the subscriber must unblock them first (KAN-94). | AC-KAN-69-09 |
| AS-7 | Changing the confirmation mode applies only to bookings created afterwards. | AC-KAN-70-07 |
| AS-8 | The default confirmation mode is automatic. | AC-KAN-70-08 |
| AS-9 | The cancellation note is required (the story says "dejando una nota aclarativa") and is up to 500 characters. | AC-KAN-72-02, AC-KAN-72-03 |
| AS-10 | `isPenalized` defaults to false; what a penalty implies for the customer is defined by booking policies (KAN-147, KAN-160), not here. | AC-KAN-72-08 |
| AS-11 | The booking list shows upcoming bookings (from today on) ordered by `startsAt` ascending; past bookings are in the history (KAN-76). | AC-KAN-75-01 |
| AS-12 | History filters are date range, status and service. The default range is the last 30 days. Search by customer name is not included. | AC-KAN-76-02 |

## Backlog issues
- KAN-66, KAN-67 and KAN-68 mix business-level behavior with collaborator behavior (Q1); the collaborator parts are BLOCKED. KAN-68 is almost entirely about collaborators; only a business-level free / full indication remains.
- KAN-69 and KAN-71 say "como usuario"; read as the subscriber.
- KAN-70 defines a business setting (confirmation mode) that is not in `domain-glossary`; a field name must be agreed (see Data).
- KAN-72 "registrar si se penaliza" overlaps the booking policy stories (KAN-147, KAN-160) that define penalties; this spec only records the flag.
- KAN-74: `no_show` and `completed` are terminal in the glossary, so a mistaken mark cannot be undone. The team should confirm this is intended.
- KAN-75 (paginated list) and KAN-76 (history with filters) overlap; they are split here as upcoming vs past (AS-11).
- KAN-69 "misma validación de espacio que los clientes" depends on the availability rules of the KAN-139 epic (KAN-141, KAN-143, KAN-144), which also decide capacity when a business has several collaborators (Q1).
- KAN-65 gives "no hay colaboradores en la mañana" as a reason for a business-level block; that reason is fine, but any per-collaborator block belongs to Q1.

## Non-functional
- i18n keys (new prefixes): `business:schedule.hours.*`, `business:schedule.blocks.*`, `business:schedule.agenda.*`, `business:schedule.bookings.*`, `business:schedule.confirmation.*`, `business:schedule.bookingList.*`, `business:schedule.history.*`. Reused: `validation:required`, `validation:tooLong`, `common:errors.network`, `business:errors.readOnly`. Status labels come from `common` status labels.
- Realtime: the agenda (KAN-67, KAN-68) listens live to bookings and blocks of the visible period; everything else uses regular queries (`api-query-standards` §9).
- Pagination: booking list and history use cursor pagination with `PAGINATION.DEFAULT_PAGE_SIZE`, server-side total count, filters in the URL, reset to page one when filters change. Each filter combination adds its Firestore index.
- Booking creation, rescheduling, cancellation and status changes run through callable functions in a transaction, so double bookings and invalid transitions are rejected on the server; transitions follow `domain-glossary` §4.1 (`completed` and `no_show` only after `startsAt`).
- Times in the business `timeZone` (never the browser's); money from the snapshot `priceInCents` in the business currency.
- Tenant isolation: every query and write uses the session `businessId`; customers only receive free time slots, never other bookings.
- Idle logout (KAN-38) applies; no reCAPTCHA (authenticated screens). No export in this epic.
- Accessibility: the calendar is keyboard navigable, each booking and block has an accessible name with time, customer and status; status is never shown by color alone; confirmation dialogs trap focus.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-64 | AC-KAN-64-01 … AC-KAN-64-07 | `tests/BusinessHoursPage.test.tsx` |
| KAN-65 | AC-KAN-65-01 … AC-KAN-65-07 | `tests/ScheduleBlockForm.test.tsx` |
| KAN-66 | AC-KAN-66-01 … AC-KAN-66-06 | `tests/ScheduleBlockForm.test.tsx` |
| KAN-66 (collaborator absence) | BLOCKED (Q1) | — |
| KAN-67 | AC-KAN-67-01 … AC-KAN-67-08 | `tests/SchedulePage.test.tsx` |
| KAN-67 (collaborator filter) | BLOCKED (Q1) | — |
| KAN-68 | AC-KAN-68-01 … AC-KAN-68-03 | `tests/SchedulePage.test.tsx` |
| KAN-68 (per collaborator) | BLOCKED (Q1) | — |
| KAN-69 | AC-KAN-69-01, AC-KAN-69-02, AC-KAN-69-04, AC-KAN-69-05, AC-KAN-69-06, AC-KAN-69-07, AC-KAN-69-09, AC-KAN-69-10 | `tests/BookingForm.test.tsx` |
| KAN-69 | AC-KAN-69-01, AC-KAN-69-03, AC-KAN-69-04, AC-KAN-69-06, AC-KAN-69-08, AC-KAN-69-09 | `functions/src/bookings/tests/createBooking.test.ts` |
| KAN-70 | AC-KAN-70-01 … AC-KAN-70-08 | `tests/BookingConfirmationSettings.test.tsx` |
| KAN-70 | AC-KAN-70-01, AC-KAN-70-02, AC-KAN-70-05 | `functions/src/bookings/tests/updateBookingStatus.test.ts` |
| KAN-71 | AC-KAN-71-01 … AC-KAN-71-07 | `tests/RescheduleBookingDialog.test.tsx` |
| KAN-71 | AC-KAN-71-02, AC-KAN-71-03, AC-KAN-71-06 | `functions/src/bookings/tests/rescheduleBooking.test.ts` |
| KAN-72 | AC-KAN-72-01 … AC-KAN-72-08 | `tests/CancelBookingDialog.test.tsx` |
| KAN-72 | AC-KAN-72-01, AC-KAN-72-04, AC-KAN-72-07 | `functions/src/bookings/tests/cancelBooking.test.ts` |
| KAN-73 | AC-KAN-73-01 … AC-KAN-73-06 | `tests/BookingDetailPage.test.tsx` |
| KAN-73 | AC-KAN-73-02, AC-KAN-73-03 | `functions/src/bookings/tests/updateBookingStatus.test.ts` |
| KAN-74 | AC-KAN-74-01 … AC-KAN-74-06 | `tests/BookingDetailPage.test.tsx` |
| KAN-74 | AC-KAN-74-02, AC-KAN-74-03 | `functions/src/bookings/tests/updateBookingStatus.test.ts` |
| KAN-75 | AC-KAN-75-01 … AC-KAN-75-05 | `tests/BookingListPage.test.tsx` |
| KAN-76 | AC-KAN-76-01 … AC-KAN-76-07 | `tests/BookingHistoryPage.test.tsx` |
