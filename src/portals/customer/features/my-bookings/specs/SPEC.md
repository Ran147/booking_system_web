# My bookings (KAN-150)

| Field | Value |
| --- | --- |
| Portal | customer |
| Feature folder | `src/portals/customer/features/my-bookings/` |
| Stories | KAN-151, KAN-152, KAN-153, KAN-154 |
| Status | BLOCKED (partially) |
| Depends on | KAN-145 booking checkout (bookings exist), KAN-96 navbar (KAN-108 entry point), KAN-155 booking changes (actions launched from the detail), KAN-128 customer sign-in; Q1 (collaborator); Q4 (link back to a business's pages) |

## Intent
A signed-in `customer` sees their upcoming bookings, their past bookings as a history, and the details of any one booking, and can filter the list to find a specific booking quickly.

## Actors and permissions
| Actor | Can |
| --- | --- |
| `customer` (signed in) | Read only their own bookings (`customerUserId` = their account), across the businesses where they booked (AS-1) |
| visitor | Nothing; redirected to sign-in |
| `subscriber`, `super_admin` | Nothing in this feature |

## In scope
- Upcoming bookings list (KAN-151).
- Booking detail: service, date, time, status (KAN-152).
- Past bookings history (KAN-153).
- Filters on the lists (KAN-154).
- Server-side cursor pagination of both lists.

## Out of scope
- The collaborator in the booking detail (Q1).
- Rescheduling and cancelling (KAN-155 spec); this feature only offers the entry to those actions.
- Bookings created by a subscriber for a `Customer` without an account (`customerUserId` `null`, KAN-69): they are not linked to any customer account.
- Export of the lists (not requested).

## Data
- `Booking` (read only): `businessId`, `serviceSnapshot` (`name`, `priceInCents`, `durationMinutes`), `startsAt`, `endsAt`, `status` (`pending`, `confirmed`, `cancelled`, `completed`, `no_show`), `cancellation` (`cancelledBy`, `isPenalized`, `note`), `rescheduleHistory`. See `domain-glossary` §3 and §4.1.
- `Business` (read only): name, logo, `timeZone`, currency.
- Rules: a `customer` reads a booking only when `customerUserId` equals their uid (`auth-and-roles` §4).
- No new fields.

## Acceptance criteria

### KAN-151 — See my upcoming bookings
- [ ] **AC-KAN-151-01** · happy · Given a signed-in `customer` with `pending` and `confirmed` bookings whose `startsAt` is in the future, when they open "My bookings", then those bookings are listed in ascending `startsAt` order, each with the business name, the service name, the date and start time in that business's `timeZone` and a status badge. [KAN-151]
- [ ] **AC-KAN-151-02** · happy · Given more upcoming bookings than one page holds, when the customer moves to the next or previous page, then the server returns only that page and the total count is shown. See AS-2. [KAN-151]
- [ ] **AC-KAN-151-03** · edge · Given a customer with no upcoming bookings, when they open the list, then `customer:myBookings.upcoming.empty` is shown. [KAN-151]
- [ ] **AC-KAN-151-04** · edge · Given a `cancelled` booking whose `startsAt` is still in the future, when the upcoming list is shown, then that booking is not in it (it appears in the history). See AS-3. [KAN-151]
- [ ] **AC-KAN-151-05** · error · Given the list cannot be loaded because of the network, when the customer opens it, then an error state with `common:errors.network` and a retry action is shown instead of the list. [KAN-151]
- [ ] **AC-KAN-151-06** · error · Given a visitor who is not signed in, or a signed-in `subscriber` or `super_admin`, when they open "My bookings", then the visitor is sent to sign-in and the other roles are sent to their own portal; no booking data is shown. [KAN-151]

### KAN-152 — See the details of a booking
- [ ] **AC-KAN-152-01** · happy · Given one of the customer's bookings, when they open it, then the detail shows the business name, the service name, the date, start and end time in the business `timeZone`, the duration, the price from `serviceSnapshot.priceInCents` in the business currency and the status. [KAN-152]
- [ ] **AC-KAN-152-02** · happy · Given a `cancelled` booking, when its detail is shown, then it also shows who cancelled it (`cancelledBy`: business or customer) and whether it was penalized (`isPenalized`). See AS-4. [KAN-152, KAN-72, KAN-159]
- [ ] **AC-KAN-152-03** · happy · Given a `pending` or `confirmed` booking whose `startsAt` is in the future, when its detail is shown, then the reschedule and cancel actions (KAN-155) are available; for `cancelled`, `completed`, `no_show` or past bookings they are not shown. [KAN-152, KAN-156, KAN-159]
- [ ] **AC-KAN-152-04** · error · Given a booking id that does not exist or belongs to another customer, when the customer opens that detail, then no booking data is shown and `common:errors.notFound` is shown. [KAN-152]
- [ ] **AC-KAN-152-05** · edge · Given a booking that was rescheduled, when its detail is shown, then the current date and time are shown (the ones in `startsAt` / `endsAt`), not the original ones. [KAN-152, KAN-158]
- [ ] **AC-KAN-152-06** · edge · Given the service was renamed or its price changed after the booking was made, when the detail is shown, then the name and price are those of `serviceSnapshot`, not the current service. [KAN-152, KAN-62]

### KAN-153 — See my past bookings (history)
- [ ] **AC-KAN-153-01** · happy · Given a customer with bookings whose `startsAt` has passed and bookings that are `cancelled`, when they open the history, then those bookings are listed in descending `startsAt` order with business, service, date and time in the business `timeZone` and status (`completed`, `no_show`, `cancelled`, or `pending` / `confirmed` not yet updated by the business). See AS-3. [KAN-153]
- [ ] **AC-KAN-153-02** · happy · Given more past bookings than one page holds, when the customer pages through the history, then pages come from the server with cursors and the total count is shown. See AS-2. [KAN-153]
- [ ] **AC-KAN-153-03** · edge · Given a customer with no past bookings, when they open the history, then `customer:myBookings.history.empty` is shown. [KAN-153]
- [ ] **AC-KAN-153-04** · error · Given the history cannot be loaded because of the network, when the customer opens it, then an error state with `common:errors.network` and a retry action is shown. [KAN-153]
- [ ] **AC-KAN-153-05** · edge · Given a business that is now `inactive` or `suspended`, when the customer views the history, then their past bookings at that business are still shown. [KAN-153]

### KAN-154 — Filter my bookings
- [ ] **AC-KAN-154-01** · happy · Given the upcoming list or the history, when the customer filters by status, then only bookings with that status are listed and the count updates. The status options are those that can appear in that list. See AS-5. [KAN-154]
- [ ] **AC-KAN-154-02** · happy · Given the history, when the customer filters by a date range, then only bookings whose `startsAt` falls in the range (dates in each business's `timeZone`) are listed. See AS-5. [KAN-154]
- [ ] **AC-KAN-154-03** · happy · Given bookings at several businesses, when the customer filters by business, then only that business's bookings are listed. See AS-1, AS-5. [KAN-154]
- [ ] **AC-KAN-154-04** · happy · Given filters are applied, when the customer reloads the page or shares its URL, then the same filters are applied (filters live in the URL), and clearing them shows the full list again; changing a filter returns to the first page. [KAN-154]
- [ ] **AC-KAN-154-05** · edge · Given filters that match nothing, when they are applied, then `customer:myBookings.filters.noResultsEmpty` is shown with an action to clear the filters. [KAN-154]
- [ ] **AC-KAN-154-06** · error · Given a date range whose end is before its start, when the customer applies it, then the list is not requested and `customer:myBookings.filters.invalidRangeError` is shown next to the range. [KAN-154]
- [ ] **AC-KAN-154-07** · error · Given the filtered request fails because of the network, when the filter is applied, then `common:errors.network` is shown and the filter values are kept for a retry. [KAN-154]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| KAN-152 (collaborator field only) | Q1 — collaborator | The collaborator shown in the booking detail. The rest of KAN-152 is specified above. |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | "My bookings" lists the customer's bookings at every business where they booked, not only the business whose pages they are on. | AC-KAN-151-01, AC-KAN-154-03 |
| AS-2 | Both lists use server cursor pagination with the default page size from `PAGINATION`, and show a total count. | AC-KAN-151-02, AC-KAN-153-02 |
| AS-3 | "Upcoming" = `pending` or `confirmed` with `startsAt` in the future. "History" = every other booking of the customer: `startsAt` in the past, or `cancelled`. | AC-KAN-151-04, AC-KAN-153-01 |
| AS-4 | The customer sees `cancelledBy` and `isPenalized` of a cancelled booking, but not the business's cancellation `note` (it may be internal). | AC-KAN-152-02 |
| AS-5 | Available filters: status (both lists), date range (history) and business (both lists). No free-text search. | AC-KAN-154-01, AC-KAN-154-02, AC-KAN-154-03 |

## Backlog issues
- KAN-152 includes the collaborator in the booking detail; it depends on Q1 and is blocked (see BLOCKED).
- KAN-151 says "citas que tengo pendientes" ("pending"): here it means upcoming, not only the `pending` status. Both `pending` and `confirmed` future bookings are listed.
- KAN-154 does not say which filters; they are assumptions (AS-5).
- KAN-108 (navbar, KAN-96) and KAN-150 both describe reaching the bookings; the navbar only links here.

## Non-functional
- i18n keys: new prefix `customer:myBookings.*` (`upcoming.*`, `history.*`, `detail.*`, `filters.*`); reused `common:errors.network`, `common:errors.notFound`, status labels from `common`.
- Pagination: server-side cursors, `CursorPage<Item>` with `totalCount` from `getCountFromServer`; filters in the URL; composite indexes for each filter + `orderBy(startsAt)` combination (a collection group query on `bookings` by `customerUserId`) (`api-query-standards` §5, §6). No realtime.
- Private page: `RequireRole` for `customer`; idle logout after `PlatformSettings.idleTimeoutMinutes` (KAN-133, KAN-182).
- Money from `priceInCents` in each business's currency; times in each business's `timeZone`.
- Accessibility: lists are semantic lists or tables with headers; status badges have text, not colour only; filter controls have labels; the page count change is announced politely.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-151 | AC-KAN-151-01 … AC-KAN-151-06 | `tests/MyBookingsPage.test.tsx` |
| KAN-152 | AC-KAN-152-01 … AC-KAN-152-06 | `tests/BookingDetailPage.test.tsx` |
| KAN-153 | AC-KAN-153-01 … AC-KAN-153-05 | `tests/MyBookingsPage.test.tsx` |
| KAN-154 | AC-KAN-154-01 … AC-KAN-154-07 | `tests/MyBookingsPage.test.tsx` |
