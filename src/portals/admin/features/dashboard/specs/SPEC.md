# Global dashboard (KAN-186)

| Field | Value |
| --- | --- |
| Portal | admin |
| Feature folder | `src/portals/admin/features/dashboard/` |
| Stories | KAN-187, KAN-188 |
| Status | Draft |
| Depends on | KAN-174 businesses spec (business profile link), KAN-32 subscription spec (`Payment`, `Subscription`), KAN-180 plans spec (`PlatformSettings.gracePeriodDays`); Q5 affects only how `past_due` ends (see AS-6) |

## Intent
The super admin lands on a dashboard that shows how the SaaS is doing (active businesses, simulated subscription revenue, total bookings) and which businesses are about to lose their subscription, so they can follow up before it happens.

## Actors and permissions
| Actor | Can |
| --- | --- |
| super admin (`super_admin`) | See platform metrics and subscription alerts for all businesses |
| subscriber, customer, visitor | Nothing; the admin portal redirects them |

## In scope
- Metric tiles: active businesses, total simulated revenue from subscriptions, total bookings (KAN-187).
- A list of alerts for subscriptions about to end (KAN-188), with a link to each business profile (KAN-178).

## Out of scope
- Charts over time, date-range selection and comparisons (not in the stories; AS-2).
- Emails or push notifications to the super admin (AS-5).
- Per-business reports (KAN-102 is the subscriber's own reports).
- Acting on a subscription from the dashboard (charging, extending, contacting).
- Export and realtime updates.

## Data
- Read only. No new stored fields.
- `Business.status` (`active`) — glossary §4.3.
- `Payment` (`businesses/{businessId}/payments/{paymentId}`) — successful payments, amounts in minor units (KAN-32 spec).
- `Booking` (`businesses/{businessId}/bookings/{bookingId}`) — counted across all businesses; `status` values from glossary §4.1.
- `Subscription` (`businesses/{businessId}/subscription/current`) — `status` (`active`, `past_due`), `currentPeriodEndsAt`, `cancelAtPeriodEnd` (glossary §4.2).
- Metrics are computed on the server (a callable or an aggregate) because the client may not read every business's bookings.

## Acceptance criteria

### KAN-187 — See a dashboard with platform metrics (active businesses, total simulated subscription revenue, total bookings)
- [ ] **AC-KAN-187-01** · happy · Given a signed-in super admin, when they open the admin portal home, then they see three tiles: number of businesses with status `active`, total simulated revenue from successful subscription payments formatted from minor units in the platform currency (AS-1), and total number of bookings across all businesses (AS-3). [KAN-187]
- [ ] **AC-KAN-187-02** · happy · Given a new business becomes `active` or a new payment succeeds, when the super admin reloads the dashboard, then the matching tile includes it (AS-4). [KAN-187]
- [ ] **AC-KAN-187-03** · edge · Given a platform with no businesses, payments or bookings, when the dashboard loads, then every tile shows 0 (and 0 in the currency format for revenue), not an empty or error state. [KAN-187]
- [ ] **AC-KAN-187-04** · edge · Given businesses with status `inactive` or `suspended`, when the dashboard loads, then they are not counted as active, but their past payments and bookings still count in revenue and bookings. [KAN-187]
- [ ] **AC-KAN-187-05** · edge · Given the metrics are loading, when the dashboard is shown, then each tile shows a loading placeholder with an accessible label instead of a number. [KAN-187]
- [ ] **AC-KAN-187-06** · error · Given the metrics request fails, when the dashboard loads, then the tiles show an error state with `common:errors.network` and a retry action, and no stale or partial numbers are presented as current. [KAN-187]
- [ ] **AC-KAN-187-07** · error · Given a caller without the `super_admin` role, when they request the platform metrics directly, then the server rejects it with `common:errors.permissionDenied` and returns no numbers. [KAN-187]

### KAN-188 — See alerts for businesses whose subscriptions are about to expire
- [ ] **AC-KAN-188-01** · happy · Given subscriptions with status `active` and `cancelAtPeriodEnd: true` whose `currentPeriodEndsAt` is within the next 7 days (AS-5), when the super admin opens the dashboard, then each appears in the alerts list with business name, plan, end date in the business `timeZone` and days left, soonest first. [KAN-188]
- [ ] **AC-KAN-188-02** · happy · Given subscriptions with status `past_due`, when the dashboard loads, then they appear in the alerts list with the label `admin:dashboard.alerts.pastDue`, before the upcoming ones. See AS-6. [KAN-188]
- [ ] **AC-KAN-188-03** · happy · Given an alert, when the super admin selects it, then they go to that business's profile in the admin portal (KAN-178). [KAN-188]
- [ ] **AC-KAN-188-04** · edge · Given an `active` subscription with `cancelAtPeriodEnd: false` ending within the window, when the dashboard loads, then it is not listed, because it will renew (AS-7). [KAN-188]
- [ ] **AC-KAN-188-05** · edge · Given no subscription matches, when the dashboard loads, then the alerts area shows `admin:dashboard.alerts.empty`. [KAN-188]
- [ ] **AC-KAN-188-06** · edge · Given more alerts than fit (AS-8), when the dashboard loads, then the first ones are shown with the total count and a way to see the rest page by page. [KAN-188]
- [ ] **AC-KAN-188-07** · error · Given the alerts request fails, when the dashboard loads, then the alerts area shows `common:errors.network` with a retry action while the metric tiles still show their own result. [KAN-188]

## BLOCKED
None. KAN-187 and KAN-188 do not depend on an open question. Only the exact date a `past_due` subscription becomes `expired` depends on Q5, so it is not shown (AS-6).

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | All subscription payments are in one platform currency, so revenue is a single sum. | AC-KAN-187-01 |
| AS-2 | Metrics are all-time totals; there is no date filter. | AC-KAN-187-01 |
| AS-3 | "Reservas globales" counts every `Booking` in every status, including `cancelled` and `no_show`. | AC-KAN-187-01, AC-KAN-187-04 |
| AS-4 | Metrics may be up to 5 minutes old (cached or pre-aggregated); the dashboard shows when they were computed. | AC-KAN-187-02 |
| AS-5 | "A punto de vencer" means `currentPeriodEndsAt` within the next 7 days. Alerts are shown only on the dashboard: no `Notification` document and no email. | AC-KAN-188-01 |
| AS-6 | `past_due` subscriptions are listed as at risk without a date: when they become `expired` depends on retries (Q5) and `PlatformSettings.gracePeriodDays`. | AC-KAN-188-02 |
| AS-7 | Subscriptions that renew automatically are not "about to expire". | AC-KAN-188-04 |
| AS-8 | The alerts list shows 5 items and a paginated view with `PAGINATION.DEFAULT_PAGE_SIZE` for the rest. | AC-KAN-188-06 |

## Backlog issues
- KAN-187 "ingresos simulados" does not say whether failed or refunded simulated payments count; AS-3/AS-1 cover the proposal (successful payments only).
- KAN-188 says "notificaciones o alertas"; `Notification` in the glossary is a user inbox (KAN-101). Treated as a dashboard list (AS-5) to avoid a new notification type.
- KAN-188 overlaps with the renewal behavior in KAN-48 / KAN-50 (Q5) for `past_due` subscriptions.

## Non-functional
- i18n: new keys under `admin:dashboard.metrics.*`, `admin:dashboard.alerts.*`. Reused: `common:errors.network`, `common:errors.permissionDenied`.
- Metrics are computed on the server with the super admin role checked; never by reading every document in the browser.
- Alerts list: server-side pagination with `totalCount` beyond the first items (AS-8).
- Numbers and currency formatted with the viewer's locale; dates in each business `timeZone`.
- Idle logout applies (`PlatformSettings.idleTimeoutMinutes`, KAN-182).
- Accessibility: each tile has a text label next to its number; loading states are announced; alerts use text, not only color, for `past_due`.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-187 | AC-KAN-187-01 … AC-KAN-187-06 | `tests/AdminDashboardScreen.test.tsx` |
| KAN-187 | AC-KAN-187-01, AC-KAN-187-03, AC-KAN-187-04, AC-KAN-187-07 | `functions/src/dashboard/tests/getPlatformMetrics.test.ts` |
| KAN-188 | AC-KAN-188-01 … AC-KAN-188-07 | `tests/AdminDashboardScreen.test.tsx` |
| KAN-188 | AC-KAN-188-01, AC-KAN-188-02, AC-KAN-188-04 | `functions/src/dashboard/tests/getSubscriptionAlerts.test.ts` |
