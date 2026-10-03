# Reports (KAN-102)

| Field | Value |
| --- | --- |
| Portal | business |
| Feature folder | `src/portals/business/features/reports/` |
| Stories | KAN-103, KAN-104, KAN-105, KAN-106 |
| Status | Draft |
| Depends on | Q1 decided 2026-09-28 (collaborator filter of KAN-103, occupancy KAN-105, permission `view_reports` KAN-86); KAN-77 collaborators; KAN-63 schedule (booking statuses set by KAN-72, KAN-73, KAN-74); KAN-30 services (service filter); KAN-32 subscription (KAN-49: reports stay readable when read-only) |

## Intent
For the subscriber who wants to understand how their business is doing: how many bookings ended in each status over a period, an estimate of the income those bookings represent, and how busy each collaborator is. They can filter the figures and export them to CSV or Excel to analyse or keep them. The financial figures are an estimate based on completed bookings, never on verified payments.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own business only) | View and export the reports of their own business. Also allowed while the business is `inactive` or `suspended`, because reports only read historical data (KAN-49). |
| collaborator with `view_reports` (KAN-86) | The same as the subscriber, for the whole business (AS-9). Without it: nothing in this epic. |
| customer, super admin | Nothing in this epic. |

The business always comes from the session, never from the URL.

## In scope
- Bookings-by-status report for a date range (KAN-104).
- Estimated financial report filterable by date range, service and collaborator (KAN-103).
- Occupancy of each collaborator in a date range (KAN-105).
- Export of the shown report to CSV or XLSX with the same filters (KAN-106).

## Out of scope
- Real payments, refunds, penalties or taxes; the platform does not process customer payments.
- Subscription payments of the business (KAN-46, subscription epic).
- Charts beyond the figures and tables described here (AS-7).

## Data
- `Report` (`domain-glossary` §3): computed, not stored.
- `Booking` (read only): `status` (`pending`, `confirmed`, `cancelled`, `completed`, `no_show`, §4.1), `startsAt`, `endsAt`, `serviceId`, `collaboratorId` (Nullable), `serviceSnapshot.name`, `serviceSnapshot.priceInCents`, `serviceSnapshot.durationMinutes`.
- `Collaborator` (read only): `fullName`, `status`; `ScheduleBlock` and `BusinessHours` (read only) for the available time of KAN-105.
- `Service` (read only): list of the business's services for the filter, including `inactive` ones.
- `Business` (read only): `timeZone` and currency.
- `User.language` (read only): language of exported column headers.
- No new stored fields.

## Acceptance criteria

### KAN-103 — Estimated financial report, filterable by date and service (based on completed bookings, not verified payments)
- [ ] **AC-KAN-103-01** · happy · Given `completed` bookings in the selected date range, when the subscriber opens the financial report, then it shows the estimated total as the sum of their `serviceSnapshot.priceInCents` in the business currency, the number of `completed` bookings and a breakdown per service. [KAN-103]
- [ ] **AC-KAN-103-02** · happy · Given the report, when the subscriber selects one service, then the totals include only `completed` bookings of that service in the range. [KAN-103]
- [ ] **AC-KAN-103-03** · happy · Given the financial report is shown, when the subscriber reads it, then the notice `business:reports.financial.estimateNotice` explains that it is an estimate based on the price of completed bookings, not on verified payments. [KAN-103]
- [ ] **AC-KAN-103-04** · error · Given a start date after the end date, or a range longer than the allowed maximum, when the subscriber applies the filter, then the report is not recalculated and `validation:outOfRange` is shown. See AS-2. [KAN-103]
- [ ] **AC-KAN-103-05** · error · Given the report request fails, when it loads, then no partial totals are shown and `common:errors.network` (or `common:errors.unknown`) is shown with a retry action. [KAN-103]
- [ ] **AC-KAN-103-06** · edge · Given a service whose price changed after some bookings were completed, when the report is calculated, then each booking counts with the price it had at booking time (`serviceSnapshot`), not the current price. [KAN-103]
- [ ] **AC-KAN-103-07** · edge · Given bookings in `pending`, `confirmed`, `cancelled` or `no_show`, when the report is calculated, then they add nothing to the estimated total. See AS-4. [KAN-103]
- [ ] **AC-KAN-103-08** · edge · Given no `completed` bookings in the range, when the report loads, then the total shows 0 in the business currency and `business:reports.financial.empty` is shown instead of the breakdown. [KAN-103]
- [ ] **AC-KAN-103-09** · edge · Given a booking at 23:30 on the last day of the range in the business `timeZone`, when the subscriber's browser is in another time zone, then the booking is counted in the range, because range limits follow the business `timeZone`. See AS-1. [KAN-103]
- [ ] **AC-KAN-103-10** · edge · Given a service that is now `inactive` or was deleted, when it has `completed` bookings in the range, then it still appears in the breakdown with its `serviceSnapshot.name`. [KAN-103]
- [ ] **AC-KAN-103-11** · happy · Given a business with collaborators, when the subscriber selects one collaborator in the filter, then the totals include only `completed` bookings served by that collaborator, and the breakdown can also be shown per collaborator. [KAN-103]
- [ ] **AC-KAN-103-12** · edge · Given `completed` bookings with `collaboratorId` = `null` (services without collaborators), when the report is filtered, then they appear under `business:reports.filters.businessResource` and are included when no collaborator is selected. [KAN-103]
- [ ] **AC-KAN-103-13** · edge · Given a collaborator who is now `inactive`, when the range contains their `completed` bookings, then they are still offered in the filter and counted, with an `inactive` badge. [KAN-103, KAN-81]

### KAN-104 — Bookings by status (confirmed, completed, cancelled, no-show) in a date range
- [ ] **AC-KAN-104-01** · happy · Given bookings of the business in the selected range, when the subscriber opens the bookings report, then it shows the count per status for `confirmed`, `completed`, `cancelled` and `no_show`, and the total. See AS-3. [KAN-104]
- [ ] **AC-KAN-104-02** · happy · Given the report is open, when the subscriber changes the date range, then the counts are recalculated for the new range, which defaults to the current month the first time. See AS-1. [KAN-104]
- [ ] **AC-KAN-104-03** · error · Given a start date after the end date, or a range longer than the allowed maximum, when the subscriber applies it, then the counts do not change and `validation:outOfRange` is shown. See AS-2. [KAN-104]
- [ ] **AC-KAN-104-04** · error · Given the report request fails, when it loads, then no counts are shown and `common:errors.network` (or `common:errors.unknown`) is shown with a retry action. [KAN-104]
- [ ] **AC-KAN-104-05** · edge · Given no bookings in the range, when the report loads, then every status shows 0 and `business:reports.bookings.empty` is shown. [KAN-104]
- [ ] **AC-KAN-104-06** · edge · Given bookings of another business in the same range, when the report is calculated, then they are never counted. [KAN-104]
- [ ] **AC-KAN-104-07** · edge · Given a business that is `inactive` or `suspended`, when the subscriber opens the reports, then the reports load normally with its historical data. [KAN-104, KAN-49]

### KAN-105 — See the occupancy of a collaborator to evaluate their load or performance
- [ ] **AC-KAN-105-01** · happy · Given a collaborator and a date range, when the subscriber opens the occupancy report, then it shows their occupancy as booked minutes divided by available minutes in the range (AS-8), the booked and available hours, and their number of bookings per status. [KAN-105]
- [ ] **AC-KAN-105-02** · happy · Given "all collaborators", when the report loads, then it shows one row per collaborator with the same figures, ordered by occupancy from highest to lowest. [KAN-105]
- [ ] **AC-KAN-105-03** · error · Given a start date after the end date, or a range longer than the maximum (AS-2), when the subscriber applies it, then the report is not recalculated and `validation:outOfRange` is shown. [KAN-105]
- [ ] **AC-KAN-105-04** · error · Given the report request fails, when it loads, then no partial figures are shown and `common:errors.network` (or `common:errors.unknown`) is shown with a retry action. [KAN-105]
- [ ] **AC-KAN-105-05** · edge · Given a collaborator with no available time in the range (absent every day, KAN-66), when the report loads, then `business:reports.occupancy.noAvailableTime` is shown instead of a percentage. [KAN-105, KAN-66]
- [ ] **AC-KAN-105-06** · edge · Given a business without collaborators, when the subscriber opens the occupancy report, then `business:reports.occupancy.noCollaborators` is shown with a link to register one (KAN-78). [KAN-105]
- [ ] **AC-KAN-105-07** · edge · Given a collaborator who is now `inactive`, when the range contains their bookings, then they are listed with an `inactive` badge. [KAN-105, KAN-81]
- [ ] **AC-KAN-105-08** · edge · Given the occupancy report is exported (KAN-106), when the file is opened, then it has one row per collaborator with the same figures. [KAN-105, KAN-106]

### KAN-106 — Export report data to CSV / Excel
- [ ] **AC-KAN-106-01** · happy · Given a report with filters applied, when the subscriber exports it as CSV, then a file is downloaded with every row that matches the same filters (not only the rows on screen), UTF-8 with BOM, and column headers in the subscriber's `User.language`. [KAN-106]
- [ ] **AC-KAN-106-02** · happy · Given the same report, when the subscriber exports it as Excel, then an XLSX file with the same rows and headers is downloaded. [KAN-106]
- [ ] **AC-KAN-106-03** · happy · Given the exported financial report, when it is opened, then amounts are in the business currency, dates and times are in the business `timeZone`, and the estimate notice is included. See AS-5. [KAN-106, KAN-103]
- [ ] **AC-KAN-106-04** · error · Given the export fails on the server or the network, when the subscriber exports, then no file is downloaded, the button becomes available again and `business:reports.export.failedError` is shown. [KAN-106]
- [ ] **AC-KAN-106-05** · error · Given a request to export another business's data, when it reaches the server, then it is rejected and `common:errors.permissionDenied` is shown. [KAN-106]
- [ ] **AC-KAN-106-06** · edge · Given the filters match no data, when the subscriber opens the export menu, then export is disabled and shows `business:reports.export.nothingToExport`. See AS-6. [KAN-106]
- [ ] **AC-KAN-106-07** · edge · Given a business that is `inactive` or `suspended`, when the subscriber exports a report, then the export works, because it only reads historical data. [KAN-106, KAN-49]
- [ ] **AC-KAN-106-08** · edge · Given an export is already running, when the subscriber presses export again, then no second export starts until the first finishes. [KAN-106]

## BLOCKED
None. Q1 was decided on 2026-09-28: the collaborator filter of KAN-103 and KAN-105 are specified.

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | A booking belongs to a range by its `startsAt`, compared in the business `timeZone`; both limit days are included. Default range: the current month. | AC-KAN-103-09, AC-KAN-104-02 |
| AS-2 | The maximum range is 12 months. | AC-KAN-103-04, AC-KAN-104-03 |
| AS-3 | The bookings report also shows `pending` as a fifth count, although the story lists only four statuses. | AC-KAN-104-01 |
| AS-4 | Penalties of cancelled bookings (`cancellation.isPenalized`, KAN-72) add nothing to the estimate. | AC-KAN-103-07 |
| AS-5 | Export covers the report the subscriber is looking at (financial or bookings), one report per file. Amounts are exported as decimal numbers in major units with the currency code. | AC-KAN-106-03 |
| AS-6 | An empty report cannot be exported (instead of exporting a file with headers only). | AC-KAN-106-06 |
| AS-7 | Figures are shown as numbers and tables; charts are optional and not required for acceptance. | In scope |
| AS-8 | Occupancy: booked minutes are the durations of the collaborator's `confirmed`, `completed` and `no_show` bookings in the range (`pending` and `cancelled` do not count); available minutes are the business hours of the range minus whole-business blocks and the collaborator's own absences. | AC-KAN-105-01 |
| AS-9 | A collaborator with `view_reports` sees the reports of the whole business, including other collaborators' occupancy and the financial estimate. | Actors |

## Backlog issues
- KAN-105 and KAN-106 say "como usuario"; in this epic it means the subscriber.
- KAN-105 says "carga o rendimiento"; only load (occupancy) is measurable from the data, so performance is read as occupancy plus counts per status (AS-8).
- KAN-104 lists four statuses and leaves out `pending`, which also exists (`domain-glossary` §4.1). AS-3 includes it; the team should confirm.
- KAN-103 "estimated" income overlaps the cancellation penalty of KAN-72/KAN-161 (`isPenalized`): no story says whether penalties are money. AS-4 excludes them.
- KAN-106 says "csv/excel"; both formats are specified. It does not say which reports; AS-5 covers both.
- KAN-73 says "completed" is used "para manejar mis métricas"; these reports depend on subscribers actually marking bookings as `completed` and `no_show`.
- Typos in KAN-105 and KAN-106: "cómo usuario" should be "como usuario".

## Non-functional
- New i18n key prefixes: `business:reports.financial.*`, `business:reports.bookings.*`, `business:reports.occupancy.*`, `business:reports.filters.*`, `business:reports.export.*`. Export column headers live in `functions/src/notifications/locales/{en,es}/` with the other server-side translations.
- Reports are computed on the server (a callable function or aggregation queries such as `getCountFromServer` / sum); the browser never downloads every booking to add them up (`api-query-standards`).
- Export runs on the server through `exportCollection` with the same filters as the screen, builds CSV (UTF-8 with BOM) or XLSX, stores it and returns a short-lived download URL (`api-query-standards` §10).
- Tenant isolation: the function checks that the requester owns the business or is an `active` collaborator of it with `view_reports`; `businessId` comes from the session.
- Reads are allowed for `inactive` and `suspended` businesses (KAN-49); there are no writes in this epic.
- Session: idle logout after `PlatformSettings.idleTimeoutMinutes` (KAN-182).
- Money from `priceInCents` in the business currency; dates in the business `timeZone`.
- Accessibility: date pickers are keyboard operable; figures are also given as text or a table, not only as a chart; the export button announces when it is busy.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-103 | AC-KAN-103-01 … AC-KAN-103-13 | `tests/FinancialReportScreen.test.tsx`, `functions/src/reports/tests/getFinancialReport.test.ts` |
| KAN-104 | AC-KAN-104-01 … AC-KAN-104-07 | `tests/BookingsReportScreen.test.tsx`, `functions/src/reports/tests/getBookingsReport.test.ts` |
| KAN-105 | AC-KAN-105-01 … AC-KAN-105-08 | `tests/CollaboratorOccupancyReportScreen.test.tsx`, `functions/src/reports/tests/getCollaboratorOccupancyReport.test.ts` |
| KAN-106 | AC-KAN-106-01 … AC-KAN-106-08 | `tests/ReportExport.test.tsx`, `functions/src/export/tests/exportCollection.test.ts` |
