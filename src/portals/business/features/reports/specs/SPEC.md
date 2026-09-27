# Reports (KAN-102)

| Field | Value |
| --- | --- |
| Portal | business |
| Feature folder | `src/portals/business/features/reports/` |
| Stories | KAN-103, KAN-104, KAN-105, KAN-106 |
| Status | BLOCKED (partially) |
| Depends on | Q1 — collaborator (KAN-105 and the collaborator filter of KAN-103); KAN-63 schedule (booking statuses set by KAN-72, KAN-73, KAN-74); KAN-30 services (service filter); KAN-32 subscription (KAN-49: reports stay readable when read-only) |

## Intent
For the subscriber who wants to understand how their business is doing: how many bookings ended in each status over a period, and an estimate of the income those bookings represent. They can filter the figures and export them to CSV or Excel to analyse or keep them. The financial figures are an estimate based on completed bookings, never on verified payments.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own business only) | View and export the reports of their own business. Also allowed while the business is `inactive` or `suspended`, because reports only read historical data (KAN-49). |
| customer, super admin | Nothing in this epic. |

The business always comes from the signed-in subscriber's session, never from the URL.

## In scope
- Bookings-by-status report for a date range (KAN-104).
- Estimated financial report filterable by date range and service (KAN-103, without the collaborator filter).
- Export of the shown report to CSV or XLSX with the same filters (KAN-106).

## Out of scope
- Collaborator occupancy (KAN-105) and any collaborator filter or column (Q1).
- Real payments, refunds, penalties or taxes; the platform does not process customer payments.
- Subscription payments of the business (KAN-46, subscription epic).
- Charts beyond the figures and tables described here (AS-7).

## Data
- `Report` (`domain-glossary` §3): computed, not stored.
- `Booking` (read only): `status` (`pending`, `confirmed`, `cancelled`, `completed`, `no_show`, §4.1), `startsAt`, `serviceId`, `serviceSnapshot.name`, `serviceSnapshot.priceInCents`.
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

### KAN-104 — Bookings by status (confirmed, completed, cancelled, no-show) in a date range
- [ ] **AC-KAN-104-01** · happy · Given bookings of the business in the selected range, when the subscriber opens the bookings report, then it shows the count per status for `confirmed`, `completed`, `cancelled` and `no_show`, and the total. See AS-3. [KAN-104]
- [ ] **AC-KAN-104-02** · happy · Given the report is open, when the subscriber changes the date range, then the counts are recalculated for the new range, which defaults to the current month the first time. See AS-1. [KAN-104]
- [ ] **AC-KAN-104-03** · error · Given a start date after the end date, or a range longer than the allowed maximum, when the subscriber applies it, then the counts do not change and `validation:outOfRange` is shown. See AS-2. [KAN-104]
- [ ] **AC-KAN-104-04** · error · Given the report request fails, when it loads, then no counts are shown and `common:errors.network` (or `common:errors.unknown`) is shown with a retry action. [KAN-104]
- [ ] **AC-KAN-104-05** · edge · Given no bookings in the range, when the report loads, then every status shows 0 and `business:reports.bookings.empty` is shown. [KAN-104]
- [ ] **AC-KAN-104-06** · edge · Given bookings of another business in the same range, when the report is calculated, then they are never counted. [KAN-104]
- [ ] **AC-KAN-104-07** · edge · Given a business that is `inactive` or `suspended`, when the subscriber opens the reports, then the reports load normally with its historical data. [KAN-104, KAN-49]

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
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| KAN-103 (filter by collaborator only) | Q1 — collaborator | The collaborator filter and any per-collaborator breakdown or export column. The date and service filters are specified. |
| KAN-105 — Occupancy of a collaborator | Q1 — collaborator | Whole story. |

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

## Backlog issues
- KAN-105 and KAN-106 say "como usuario"; in this epic it means the subscriber.
- KAN-105 is entirely about collaborators and KAN-103 includes a collaborator filter; both follow Q1. If Q1 removes the collaborator, KAN-105 should be closed and KAN-103 edited.
- KAN-104 lists four statuses and leaves out `pending`, which also exists (`domain-glossary` §4.1). AS-3 includes it; the team should confirm.
- KAN-103 "estimated" income overlaps the cancellation penalty of KAN-72/KAN-161 (`isPenalized`): no story says whether penalties are money. AS-4 excludes them.
- KAN-106 says "csv/excel"; both formats are specified. It does not say which reports; AS-5 covers both.
- KAN-73 says "completed" is used "para manejar mis métricas"; these reports depend on subscribers actually marking bookings as `completed` and `no_show`.
- Typos in KAN-105 and KAN-106: "cómo usuario" should be "como usuario".

## Non-functional
- New i18n key prefixes: `business:reports.financial.*`, `business:reports.bookings.*`, `business:reports.filters.*`, `business:reports.export.*`. Export column headers live in `functions/src/notifications/locales/{en,es}/` with the other server-side translations.
- Reports are computed on the server (a callable function or aggregation queries such as `getCountFromServer` / sum); the browser never downloads every booking to add them up (`api-query-standards`).
- Export runs on the server through `exportCollection` with the same filters as the screen, builds CSV (UTF-8 with BOM) or XLSX, stores it and returns a short-lived download URL (`api-query-standards` §10).
- Tenant isolation: the function checks that the requester owns the business; `businessId` comes from the session.
- Reads are allowed for `inactive` and `suspended` businesses (KAN-49); there are no writes in this epic.
- Session: idle logout after `PlatformSettings.idleTimeoutMinutes` (KAN-182).
- Money from `priceInCents` in the business currency; dates in the business `timeZone`.
- Accessibility: date pickers are keyboard operable; figures are also given as text or a table, not only as a chart; the export button announces when it is busy.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-103 | AC-KAN-103-01 … AC-KAN-103-10 | `tests/FinancialReportScreen.test.tsx`, `functions/src/reports/tests/getFinancialReport.test.ts` |
| KAN-104 | AC-KAN-104-01 … AC-KAN-104-07 | `tests/BookingsReportScreen.test.tsx`, `functions/src/reports/tests/getBookingsReport.test.ts` |
| KAN-105 | — (BLOCKED, Q1) | `tests/CollaboratorOccupancyReportScreen.test.tsx` (to be written after Q1) |
| KAN-106 | AC-KAN-106-01 … AC-KAN-106-08 | `tests/ReportExport.test.tsx`, `functions/src/export/tests/exportCollection.test.ts` |
