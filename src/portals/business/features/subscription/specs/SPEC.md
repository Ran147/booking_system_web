# Subscription management (KAN-32)

| Field | Value |
| --- | --- |
| Portal | business |
| Feature folder | `src/portals/business/features/subscription/` |
| Stories | KAN-43, KAN-44, KAN-45, KAN-46, KAN-47, KAN-48, KAN-49, KAN-50 |
| Status | BLOCKED (partially) |
| Depends on | KAN-28 (subscriber sign-in); KAN-180 epic (plans, `limits`, active / inactive plans KAN-184); KAN-182 (`PlatformSettings`, grace days); KAN-20 epic and Q7 (how the first subscription starts); Q5 (automatic renewals); KAN-29 (sidebar banners) |

## Intent
The subscriber sees the state of their subscription, compares plans and upgrades, pays through the simulated gateway and downloads receipts, reviews their payment history, and cancels renewal while keeping access until the end of the paid period. When the subscription is `expired` or `cancelled`, the business becomes read-only until a new payment.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own business only) | View their subscription and payment history, download receipts, upgrade, pay and cancel renewal. Paying (KAN-45) stays available while the business is `inactive`, because it is the only way back to `active`. |
| super admin | Suspends / reactivates businesses and manages plans (admin epics); not part of this spec. |
| system (Cloud Functions) | Runs the simulated gateway, writes `Payment`, `Subscription.status` and `Business.status`. The client never writes status fields. |
| collaborator | BLOCKED — Q1 (not part of this spec). |

## In scope
- Subscription overview (plan, status, period end, cancel-at-period-end flag).
- Plan comparison and upgrade to a higher plan.
- Payment through the simulated gateway and downloadable receipt.
- Payment history.
- Cancel renewal at period end.
- Read-only access when the subscription is `expired` or `cancelled` (business `inactive`).

## Out of scope
- First plan purchase / checkout from the landing page (KAN-20 epic, KAN-22–24, KAN-176, Q7).
- Automatic renewal retries and their notifications (KAN-48, KAN-50, Q5).
- Downgrading to a lower plan (not in the backlog; see Backlog issues).
- Undoing a cancellation before the period ends (not in the backlog; see Backlog issues).
- Enforcing plan limits (KAN-181) and super admin suspension (KAN-179).
- Real payment gateway integration (the gateway is simulated).

## Data
- `Subscription` at `businesses/{businessId}/subscription/current` (`domain-glossary` §3, §4.2): `status` (`active`, `past_due`, `expired`, `cancelled`), `planId`, `currentPeriodEndsAt`, `cancelAtPeriodEnd`.
- `Plan` at `plans/{planId}`: `name`, price (`priceInCents`), billing period, features, `limits`, status `active` | `inactive` (KAN-184).
- `Payment` at `businesses/{businessId}/payments/{paymentId}` (simulated gateway). **Fields used (names to confirm, not defined in the glossary):** `createdAt`, `amountInCents`, `planId`, a result of the attempt (succeeded / declined), and the reference used for the receipt.
- `PaymentReceipt` (generated file, KAN-45).
- `Business.status` (`active`, `inactive`, `suspended`, §4.3) follows the subscription: `expired` / `cancelled` → `inactive` (KAN-49); a new payment → `active` (KAN-45).
- Nothing is added for Q5 (retry count or interval) or Q7 (initial activation).

## Acceptance criteria

### KAN-43 — View the current subscription
- [ ] **AC-KAN-43-01** · happy · Given a subscriber with an `active` subscription, when they open the subscription page, then they see the plan name, its price in the business currency and billing period, the status badge, and the next renewal date (`currentPeriodEndsAt`) in the business `timeZone`. [KAN-43]
- [ ] **AC-KAN-43-02** · happy · Given an `active` subscription with `cancelAtPeriodEnd` true, when the page is shown, then it says the subscription ends on `currentPeriodEndsAt` and will not renew (`business:subscription.overview.endsOn`). [KAN-43, KAN-47]
- [ ] **AC-KAN-43-03** · happy · Given a subscription that is `past_due`, `expired` or `cancelled`, when the page is shown, then the matching status badge is shown with `business:subscription.overview.statusHint.<status>` and a pay action (KAN-45). [KAN-43]
- [ ] **AC-KAN-43-04** · error · Given the subscription cannot be loaded because of the network, when the page opens, then an error state with `common:errors.network` and a retry action is shown. [KAN-43]
- [ ] **AC-KAN-43-05** · edge · Given the subscriber's plan was later deactivated by the super admin (KAN-184), when the page is shown, then the subscription still shows that plan and its data, because inactive plans keep their subscribers. [KAN-43]
- [ ] **AC-KAN-43-06** · edge · Given a business that is `inactive` or `suspended`, when the subscriber opens the page, then it is viewable (read-only does not block reading). [KAN-43, KAN-49]

### KAN-44 — Compare plans and upgrade
- [ ] **AC-KAN-44-01** · happy · Given a subscriber with an `active` subscription, when they open the plan comparison, then they see all `active` plans side by side with price, billing period, features and limits, with their current plan marked. [KAN-44]
- [ ] **AC-KAN-44-02** · happy · Given a higher plan in the comparison, when the subscriber chooses upgrade, reviews the amount to pay and the simulated payment succeeds, then `Subscription.planId` becomes the new plan, a `Payment` is recorded, a receipt is available (KAN-45) and `business:subscription.upgrade.successMessage` is shown. See AS-1, AS-2. [KAN-44]
- [ ] **AC-KAN-44-03** · error · Given the simulated gateway declines the upgrade payment, when the subscriber confirms, then the plan does not change, the declined attempt is shown in the payment history, and `business:subscription.payment.declinedError` is shown. [KAN-44]
- [ ] **AC-KAN-44-04** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to upgrade, then the plan does not change and `business:errors.readOnly` is shown; an `inactive` business is pointed to the pay action (KAN-45) instead. [KAN-44, KAN-49]
- [ ] **AC-KAN-44-05** · error · Given the chosen plan was deactivated between opening the comparison and confirming, when the subscriber confirms, then nothing is charged, the plan does not change and `business:subscription.upgrade.planUnavailableError` is shown. [KAN-44]
- [ ] **AC-KAN-44-06** · error · Given the request fails because of the network, when the subscriber confirms, then no second charge is created on retry, the plan stays as it was unless the server confirmed the payment, and `common:errors.network` is shown. [KAN-44]
- [ ] **AC-KAN-44-07** · edge · Given the subscriber is on the highest plan, when they open the comparison, then no upgrade action is offered. [KAN-44]
- [ ] **AC-KAN-44-08** · edge · Given a subscription with `cancelAtPeriodEnd` true, when the subscriber upgrades, then renewal is turned back on (`cancelAtPeriodEnd` false). See AS-3. [KAN-44, KAN-47]
- [ ] **AC-KAN-44-09** · edge · Given a subscription that is `past_due`, when the subscriber opens the comparison, then upgrade is not offered until the outstanding payment is made (KAN-45). See AS-4. [KAN-44]

### KAN-45 — Pay the subscription and download a receipt
- [ ] **AC-KAN-45-01** · happy · Given a subscription that is `past_due`, `expired` or `cancelled`, when the subscriber pays through the simulated gateway and the payment succeeds, then the subscription becomes `active` with a new `currentPeriodEndsAt`, the business becomes `active` again if it was `inactive`, and `business:subscription.payment.successMessage` is shown. See AS-5. [KAN-45]
- [ ] **AC-KAN-45-02** · happy · Given a successful payment, when the subscriber chooses download receipt, then a receipt file is downloaded with the business name, plan, amount in the business currency, payment date (business `timeZone`) and a payment reference. See AS-6. [KAN-45]
- [ ] **AC-KAN-45-03** · error · Given the simulated gateway declines the payment, when the subscriber pays, then the subscription and business keep their status, no receipt is generated, the attempt appears in the history, and `business:subscription.payment.declinedError` is shown. [KAN-45]
- [ ] **AC-KAN-45-04** · error · Given invalid or missing payment details in the simulated form, when the subscriber submits, then nothing is charged and `validation:required` or `business:subscription.payment.cardInvalid` is shown next to the field. [KAN-45]
- [ ] **AC-KAN-45-05** · error · Given a business that is `suspended` by the super admin, when the subscriber tries to pay, then nothing is charged and `business:subscription.payment.suspendedError` is shown, because paying does not lift a suspension. [KAN-45, KAN-49]
- [ ] **AC-KAN-45-06** · error · Given the receipt cannot be generated or downloaded, when the subscriber chooses download, then `business:subscription.receipt.downloadError` is shown with a retry, and the payment itself is not affected. [KAN-45]
- [ ] **AC-KAN-45-07** · error · Given the request fails because of the network, when the subscriber pays, then the page shows `common:errors.network` and then the real outcome once the server answers; the subscriber is never charged twice for the same attempt. [KAN-45]
- [ ] **AC-KAN-45-08** · edge · Given the subscriber presses pay twice quickly, when both requests arrive, then only one `Payment` is recorded and the button is disabled while the first is in progress. [KAN-45]
- [ ] **AC-KAN-45-09** · edge · Given an `active` subscription with no outstanding payment, when the subscriber opens the subscription page, then no pay action is shown. See AS-5. [KAN-45]

### KAN-46 — Payment history
- [ ] **AC-KAN-46-01** · happy · Given a subscriber with payments, when they open the payment history, then they see one page of their own business's payments, newest first, each with date (business `timeZone`), plan, amount in the business currency, result, and a receipt download for successful ones. [KAN-46]
- [ ] **AC-KAN-46-02** · error · Given the history cannot be loaded because of the network, when the page opens, then an error state with `common:errors.network` and a retry action is shown. [KAN-46]
- [ ] **AC-KAN-46-03** · edge · Given a business with no payments, when the history is opened, then `business:subscription.history.emptyTitle` is shown. [KAN-46]
- [ ] **AC-KAN-46-04** · edge · Given more payments than one page holds, when the subscriber moves to the next or previous page, then the matching page is shown with the total count. [KAN-46]
- [ ] **AC-KAN-46-05** · edge · Given a business that is `inactive` or `suspended`, when the subscriber opens the history, then it is viewable and receipts can be downloaded. [KAN-46, KAN-49]
- [ ] **AC-KAN-46-06** · edge · Given a payment whose plan was later edited or deactivated (KAN-183, KAN-184), when it is listed, then it shows the plan name and amount as they were when paid. [KAN-46]

### KAN-47 — Cancel the subscription at period end
- [ ] **AC-KAN-47-01** · happy · Given an `active` subscription with `cancelAtPeriodEnd` false, when the subscriber cancels and confirms, then `cancelAtPeriodEnd` becomes true, the status stays `active`, the page shows the end date (`currentPeriodEndsAt`), and the business keeps full access. [KAN-47]
- [ ] **AC-KAN-47-02** · happy · Given a subscription with `cancelAtPeriodEnd` true, when `currentPeriodEndsAt` is reached, then no renewal charge is made, the subscription becomes `cancelled` and the business becomes `inactive` (read-only, KAN-49). [KAN-47, KAN-49]
- [ ] **AC-KAN-47-03** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to cancel, then nothing changes and `business:errors.readOnly` is shown. [KAN-47, KAN-49]
- [ ] **AC-KAN-47-04** · error · Given the request fails because of the network, when the subscriber confirms, then `cancelAtPeriodEnd` stays false and `common:errors.network` is shown. [KAN-47]
- [ ] **AC-KAN-47-05** · edge · Given a subscription that already has `cancelAtPeriodEnd` true, when the page is shown, then the cancel action is not offered. [KAN-47]
- [ ] **AC-KAN-47-06** · edge · Given the confirmation dialog, when it is shown, then it states the date until which access stays full (business `timeZone`); cancelling the dialog changes nothing. [KAN-47]
- [ ] **AC-KAN-47-07** · edge · Given a subscription that is `past_due`, when the subscriber looks for cancel, then it is not offered. See AS-7. [KAN-47]

### KAN-49 — Read-only access when the subscription is expired or cancelled
- [ ] **AC-KAN-49-01** · happy · Given a subscription that becomes `expired` or `cancelled`, when it changes, then the business becomes `inactive` and, on every business-portal screen, the subscriber can still view their historical data (services, bookings, customers, reports, payments) and sees the notice `business:subscription.readOnly.notice` with a pay action. [KAN-49]
- [ ] **AC-KAN-49-02** · happy · Given an `inactive` business, when the subscriber views screens that create or change data, then create, edit, delete and status actions are disabled. [KAN-49]
- [ ] **AC-KAN-49-03** · error · Given an `inactive` or `suspended` business, when a write reaches the server anyway (for example from a screen opened before the change), then it is rejected, no data changes and `business:errors.readOnly` is shown. [KAN-49]
- [ ] **AC-KAN-49-04** · error · Given an `inactive` business, when a customer tries to create a new booking with it, then the booking is rejected. See AS-8. [KAN-49]
- [ ] **AC-KAN-49-05** · edge · Given an `inactive` business whose subscriber pays successfully (KAN-45), when the payment is confirmed, then the business becomes `active` and write actions are enabled again without signing out. [KAN-49, KAN-45]
- [ ] **AC-KAN-49-06** · edge · Given a subscription with `cancelAtPeriodEnd` true but `currentPeriodEndsAt` still in the future, when the subscriber works in the portal, then nothing is read-only yet. [KAN-49, KAN-47]
- [ ] **AC-KAN-49-07** · edge · Given a subscription that is `past_due`, when the subscriber works in the portal, then the business is not read-only (only `expired` and `cancelled` restrict access). [KAN-49]
- [ ] **AC-KAN-49-08** · edge · Given an `inactive` business, when bookings already exist, then they are kept and stay visible to the subscriber. See AS-8. [KAN-49]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| KAN-48 | Q5 — simulated gateway on automatic renewals | Retry count and interval, a notification per attempt, and when `past_due` becomes `expired`. No criteria. |
| KAN-50 | Q5 — simulated gateway on automatic renewals (duplicate of KAN-48) | Same as KAN-48. |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | An upgrade takes effect immediately and charges the price difference for the rest of the current period (proration); `currentPeriodEndsAt` does not change. | AC-KAN-44-02 |
| AS-2 | "Higher plan" means a plan with a higher price for the same billing period. | AC-KAN-44-01, AC-KAN-44-02, AC-KAN-44-07 |
| AS-3 | Upgrading a subscription that was set to cancel at period end turns renewal back on. | AC-KAN-44-08 |
| AS-4 | A `past_due` subscription must be paid before upgrading. | AC-KAN-44-09 |
| AS-5 | The manual pay action is offered only when the subscription is `past_due`, `expired` or `cancelled`; a paid `active` subscription renews automatically. A successful payment starts a new full period from the payment date. | AC-KAN-45-01, AC-KAN-45-09 |
| AS-6 | The receipt is a PDF generated on the server in the subscriber's `User.language`. | AC-KAN-45-02 |
| AS-7 | A `past_due` subscription cannot be cancelled; it follows the renewal flow (Q5). | AC-KAN-47-07 |
| AS-8 | While a business is `inactive`, customers cannot create new bookings with it, and existing bookings are neither cancelled nor changed automatically. The customer-facing message belongs to the customer booking spec. | AC-KAN-49-04, AC-KAN-49-08 |

## Backlog issues
- KAN-48 and KAN-50 have the same text. Treated as one story; KAN-50 should be closed in Jira.
- KAN-44 only mentions upgrade; downgrade is not in the backlog. The team should decide whether it is needed.
- KAN-47 does not say whether a cancellation can be undone before the period ends.
- KAN-45 "pagar mi suscripción" does not say when a manual payment is possible (AS-5), nor how it relates to the first checkout (KAN-22, Q7).
- KAN-49 restricts "nuevas reservas ni servicios" but the read-only rule applies to every write of the business portal (customers, schedule, discounts); stated here as the general rule.
- `Payment` fields (amount, result, reference) are not defined in `domain-glossary`; they are listed in Data as names to confirm.
- KAN-182 (grace days after expiry) sits in the admin plans epic but decides when `past_due` becomes `expired`, together with Q5.

## Non-functional
- i18n keys (new prefixes): `business:subscription.overview.*`, `business:subscription.upgrade.*`, `business:subscription.payment.*`, `business:subscription.receipt.*`, `business:subscription.history.*`, `business:subscription.cancel.*`, `business:subscription.readOnly.*`. Reused: `validation:required`, `common:errors.network`, `business:errors.readOnly`. Receipts use the notification locales in `functions/`.
- Payments, upgrades and cancellation run through callable functions (simulated gateway on the server); the client never writes `status`, `planId` or `cancelAtPeriodEnd` directly. Payment calls are idempotent per attempt.
- Payment history: cursor pagination with `PAGINATION.DEFAULT_PAGE_SIZE`, newest first, total count from the server.
- Read-only enforcement is in Firestore rules and functions (business `status` must be `active`); the UI shows an alert and disables actions.
- Money from `priceInCents` / amounts in cents in the business currency; dates in the business `timeZone`.
- Idle logout (KAN-38) applies; no reCAPTCHA (authenticated screens).
- Accessibility: status badges have text; the plan comparison is a table with headers (scrolls on small screens); payment form errors are linked to fields; the pay button announces its busy state.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-43 | AC-KAN-43-01 … AC-KAN-43-06 | `tests/SubscriptionPage.test.tsx` |
| KAN-44 | AC-KAN-44-01, AC-KAN-44-04, AC-KAN-44-07, AC-KAN-44-09 | `tests/PlanComparisonPage.test.tsx` |
| KAN-44 | AC-KAN-44-02, AC-KAN-44-03, AC-KAN-44-05, AC-KAN-44-06, AC-KAN-44-08 | `functions/src/subscriptions/tests/upgradeSubscription.test.ts` |
| KAN-45 | AC-KAN-45-01 … AC-KAN-45-09 | `tests/SubscriptionPaymentPage.test.tsx` |
| KAN-45 | AC-KAN-45-01, AC-KAN-45-03, AC-KAN-45-05, AC-KAN-45-08 | `functions/src/subscriptions/tests/paySubscription.test.ts` |
| KAN-46 | AC-KAN-46-01 … AC-KAN-46-06 | `tests/PaymentHistoryPage.test.tsx` |
| KAN-47 | AC-KAN-47-01, AC-KAN-47-03 … AC-KAN-47-07 | `tests/SubscriptionPage.test.tsx` |
| KAN-47 | AC-KAN-47-02 | `functions/src/subscriptions/tests/endSubscriptionPeriod.test.ts` |
| KAN-48 | BLOCKED (Q5) | — |
| KAN-49 | AC-KAN-49-01, AC-KAN-49-02, AC-KAN-49-05 … AC-KAN-49-07 | `tests/ReadOnlyBusinessNotice.test.tsx` |
| KAN-49 | AC-KAN-49-03, AC-KAN-49-04, AC-KAN-49-08 | `functions/src/subscriptions/tests/readOnlyBusiness.test.ts` |
| KAN-50 | BLOCKED (Q5, duplicate of KAN-48) | — |
