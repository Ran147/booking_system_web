# Plan contracting (KAN-20)

| Field | Value |
| --- | --- |
| Portal | landing |
| Feature folder | `src/portals/landing/features/plan-checkout/` |
| Stories | KAN-21, KAN-22, KAN-23, KAN-24 |
| Status | Draft |
| Depends on | Q7 decided 2026-09-28 (plan checkout from the landing with the simulated gateway); Q5 decided 2026-09-28 (the gateway only fakes a success or a failure); Q2 decided 2026-09-28 (the new business waits for approval); KAN-1 Home (terms KAN-9) (plan catalog KAN-7); KAN-180 plans (admin: `Plan`, `limits` KAN-181, `active`/`inactive` KAN-184); KAN-26 subscriber sign-up (KAN-25, reached from the KAN-24 email); KAN-174 admin businesses (approval PROP-1, KAN-176) |

## Intent
A business owner who is comparing plans opens one plan, sees everything it includes, and contracts it: accepts the terms, pays through the simulated gateway (which only fakes a success or a failure, Q5) and receives an email with the link to create their account and business (KAN-26). The new business then waits for the super admin's approval (Q2) before it becomes `active`.

## Actors and permissions
| Actor | Can |
| --- | --- |
| visitor | Read the details of any `active` plan; contract it (terms, simulated payment) |
| subscriber, collaborator, customer, super admin (signed in) | Read plan details; the contract action tells them to sign out first (AS-8) |
| system (Cloud Functions) | Runs the simulated gateway, writes `PlanCheckout`, sends the KAN-24 email |

## In scope
- Plan detail page reached from the plan catalog (KAN-7) or a direct link, with a contract action (KAN-21).
- Checkout page: plan summary, email, simulated payment form, terms acceptance, reCAPTCHA (KAN-22, KAN-23).
- Confirmation page after a successful payment and the payment confirmation email with the sign-up link (KAN-24).

## Out of scope
- The sign-up form reached from the email, where the business name and `slug` are set (KAN-25, subscriber sign-up spec).
- Approving the new business and creating its `Subscription` (PROP-1, KAN-176, admin businesses spec).
- A real payment gateway, refunds and invoices (the gateway is simulated, Q5).
- Creating or editing plans (KAN-180 epic, admin).
- Plan changes for an existing subscriber (KAN-32 subscription epic, business portal).

## Data
- `Plan` (`plans/{planId}`), read only: name, `priceInCents`, `billingPeriod` (`monthly` / `annual`), features and `limits` (KAN-181, as defined in the KAN-180 spec), status `active` / `inactive` (glossary §4.5). Description text: AS-2.
- `PlanCheckout` (`planCheckouts/{planCheckoutId}`, glossary §3), created by a Cloud Function only when the simulated payment succeeds: `planId`, `email`, `amountInCents` (the plan price at payment time), `paidAt`, `termsAcceptedAt`, `termsVersion` (AS-10), `paymentReference`, `language`, `signUpCompletedAt` (`null` until KAN-25). Not readable by clients; the sign-up link carries a single-use token that identifies it (AS-6).
- No `Business`, `User`, `Subscription` or `Payment` is created here: the account and the `pending` business are created at sign-up (KAN-25), where the checkout payment is copied to `businesses/{businessId}/payments`.
- Routes: the plan detail and checkout pages live under a static landing segment (for example `/plans/:planId` and `/plans/:planId/checkout`); that segment is added to `RESERVED_BUSINESS_SLUG` in the PR that adds the route (glossary §3).

## Acceptance criteria

### KAN-21 — Detailed information about each plan
- [ ] **AC-KAN-21-01** · happy · Given a `Plan` with status `active`, when a visitor opens its detail page from the catalog (KAN-7), then the page shows the plan name, its price formatted from `priceInCents` (AS-3) with its billing period (`monthly` or `annual`), its description, its features and every item of its `limits` (for example number of services and bookings per month) with a translated label. [KAN-21]
- [ ] **AC-KAN-21-02** · happy · Given the detail page is open, when the visitor activates `landing:planCheckout.detail.backToPlans`, then they return to the plan catalog on the home page. [KAN-21, KAN-7]
- [ ] **AC-KAN-21-03** · happy · Given several `active` plans, when the visitor is on one plan's detail, then they can switch to another plan's detail without going back to the catalog, and the current plan is marked. See AS-4. [KAN-21]
- [ ] **AC-KAN-21-04** · error · Given the plan id in the link does not exist, when the detail page loads, then `common:errors.notFound` is shown with a link to the plan catalog. [KAN-21]
- [ ] **AC-KAN-21-05** · error · Given a `Plan` with status `inactive`, when a visitor opens its detail by direct link, then `common:errors.notFound` is shown, as for a missing plan. [KAN-21, KAN-184]
- [ ] **AC-KAN-21-06** · error · Given the plan cannot be read (network or server failure), when the page loads, then `common:errors.network` (or `common:errors.unknown`) is shown with a retry action. [KAN-21]
- [ ] **AC-KAN-21-07** · edge · Given a limit whose value means "unlimited" (AS-5), when the detail renders, then it shows `landing:planCheckout.detail.unlimited` instead of a number. [KAN-21, KAN-181]
- [ ] **AC-KAN-21-08** · edge · Given the visitor switches the language, when the page re-renders, then labels are translated and the price is formatted for the new locale without changing its amount. [KAN-21]
- [ ] **AC-KAN-21-09** · happy · Given an `active` plan's detail page, when a visitor activates `landing:planCheckout.detail.contract`, then the checkout page of that plan opens (KAN-22). [KAN-21, KAN-22]
- [ ] **AC-KAN-21-10** · error · Given the plan was deactivated after the detail page loaded, when the visitor activates the contract action, then the checkout does not open and `landing:planCheckout.payment.planUnavailableError` is shown with a link to the plan catalog. [KAN-21, KAN-184]
- [ ] **AC-KAN-21-11** · edge · Given a signed-in user of any role, when they activate the contract action, then no checkout opens and `landing:planCheckout.detail.signedInNotice` explains that a new business is contracted signed out, with a sign-out action. See AS-8. [KAN-21]

### KAN-22 — Pay the plan through the simulated gateway to complete the contract
- [ ] **AC-KAN-22-01** · happy · Given a visitor on the checkout of an `active` plan, when they see the page, then it shows the plan name, its price formatted from `priceInCents` with its billing period, an email field, the simulated payment fields (AS-9), the terms acceptance (KAN-23) and a reCAPTCHA. [KAN-22]
- [ ] **AC-KAN-22-02** · happy · Given valid fields, accepted terms and a solved reCAPTCHA, when the visitor pays and the simulated gateway returns success, then a `PlanCheckout` is stored with the plan, the email, the amount charged, the payment date and the terms acceptance, the confirmation page shows `landing:planCheckout.payment.success` with the email the link was sent to, and the email of KAN-24 is sent. [KAN-22, KAN-24]
- [ ] **AC-KAN-22-03** · happy · Given a successful payment, when the confirmation page is shown, then no account and no business exist yet: they are created from the link in the email (KAN-25), and the page says the business will be reviewed before it becomes active (`landing:planCheckout.payment.reviewNotice`, Q2). [KAN-22, KAN-25]
- [ ] **AC-KAN-22-04** · error · Given the simulated gateway returns a failure, when the visitor pays, then no `PlanCheckout` is stored, nothing is charged, no email is sent, the entered values except the payment fields are kept and `landing:planCheckout.payment.declinedError` is shown with the option to try again. [KAN-22]
- [ ] **AC-KAN-22-05** · error · Given an empty or invalid field (email, payment fields), when the visitor submits, then nothing is charged and `validation:required`, `validation:emailInvalid` or `landing:planCheckout.payment.cardInvalid` is shown on that field. [KAN-22]
- [ ] **AC-KAN-22-06** · error · Given the reCAPTCHA is not solved, then pay is disabled; and given the token is rejected by the server, when the visitor pays, then nothing is charged, the reCAPTCHA is reset and `validation:recaptchaRequired` is shown. [KAN-22]
- [ ] **AC-KAN-22-07** · error · Given the plan was deactivated or deleted after the checkout opened, when the visitor pays, then nothing is charged and `landing:planCheckout.payment.planUnavailableError` is shown with a link to the plan catalog. [KAN-22, KAN-184]
- [ ] **AC-KAN-22-08** · error · Given the plan price was changed by the super admin after the checkout opened (KAN-183), when the visitor pays, then nothing is charged, the new price is shown with `landing:planCheckout.payment.priceChangedError` and the visitor must confirm again. [KAN-22, KAN-183]
- [ ] **AC-KAN-22-09** · error · Given the request fails because of the network, when the visitor pays, then `common:errors.network` is shown and, when retried, the same attempt is never charged twice (one `PlanCheckout` per attempt). [KAN-22]
- [ ] **AC-KAN-22-10** · edge · Given the visitor double-clicks pay, when the first request is in progress, then the button is disabled and shows a busy state; only one payment is made. [KAN-22]
- [ ] **AC-KAN-22-11** · edge · Given an email with surrounding spaces or upper-case letters, when the checkout is stored, then the email is stored trimmed and in lower case, and it is the email the account is created with (KAN-25). [KAN-22, KAN-25]

### KAN-23 — Review and accept the terms and conditions before paying
- [ ] **AC-KAN-23-01** · happy · Given the checkout, when the visitor activates `landing:planCheckout.terms.link`, then the same terms text as KAN-9 opens (dialog or new tab) without losing the entered values. [KAN-23, KAN-9]
- [ ] **AC-KAN-23-02** · happy · Given the visitor checks `landing:planCheckout.terms.accept`, when the payment succeeds, then the `PlanCheckout` stores `termsAcceptedAt` and the terms version (AS-10). [KAN-23]
- [ ] **AC-KAN-23-03** · error · Given the terms are not accepted, when the visitor looks at the form, then pay is disabled and `landing:planCheckout.terms.required` is shown next to the checkbox; a payment request without acceptance is rejected by the server and nothing is charged. [KAN-23]
- [ ] **AC-KAN-23-04** · error · Given the terms text cannot be loaded, when the visitor opens it, then `common:errors.network` with a retry action is shown and the acceptance checkbox stays disabled until the terms have been shown once (AS-11). [KAN-23]

### KAN-24 — Automatic email after the payment is confirmed, to start the account sign-up
- [ ] **AC-KAN-24-01** · happy · Given a successful checkout (AC-KAN-22-02), when it is stored, then one email `landing:planCheckout.email.paymentConfirmed.*` is sent to the checkout email in the language used on the checkout, with the plan, the amount, the date, the payment reference and a sign-up link to KAN-25 that is single use and expires (AS-6). [KAN-24]
- [ ] **AC-KAN-24-02** · happy · Given the email, when the owner reads it, then it explains the next steps: create the account and business with the link, then wait for the platform's review (Q2). [KAN-24]
- [ ] **AC-KAN-24-03** · error · Given the email could not be delivered, when the visitor is still on the confirmation page, then `landing:planCheckout.payment.resendEmail` sends it again to the same email (at most once per minute, AS-7) and a failure shows `common:errors.network`. [KAN-24]
- [ ] **AC-KAN-24-04** · error · Given the sign-up link has expired, when the owner opens it, then the sign-up page offers to send a new link to the checkout email (AC-KAN-25-20); the payment is not lost. [KAN-24, KAN-25]
- [ ] **AC-KAN-24-05** · edge · Given a failed (declined) payment, when it happens, then no email is sent. [KAN-24, KAN-22]
- [ ] **AC-KAN-24-06** · edge · Given the checkout email already belongs to a platform account, when the email is sent, then instead of a sign-up link it tells the mailbox owner that a new business needs a new email and to contact the platform about the payment (AS-12); nothing is revealed on the checkout page. [KAN-24]

## BLOCKED
None. Q7 was decided on 2026-09-28: the MVP includes plan checkout from the landing with the simulated gateway.

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | The plan detail is a separate public page with its own link (shareable), not a modal over the catalog. | AC-KAN-21-01, AC-KAN-21-04 |
| AS-2 | A `Plan` has a short description besides its features and `limits`; the field name is defined in the KAN-180 spec. | AC-KAN-21-01 |
| AS-3 | Plan prices are shown in one platform currency (consistent with the KAN-180 spec), formatted for the active locale. | AC-KAN-21-01, AC-KAN-21-08 |
| AS-4 | The detail page lets the visitor switch between plans (tabs or a compact list). | AC-KAN-21-03 |
| AS-5 | A limit can be "unlimited"; how it is stored is defined by KAN-181. | AC-KAN-21-07 |
| AS-6 | The sign-up link is valid for 7 days and works once; a new link can be requested for the same checkout email, which invalidates the previous one. | AC-KAN-24-01, AC-KAN-24-04 |
| AS-7 | The confirmation email can be resent at most once per minute, only to the checkout email. | AC-KAN-24-03 |
| AS-8 | Contracting a new business is done signed out: one account has one role and one business, so a signed-in user is asked to sign out first. | AC-KAN-21-11 |
| AS-9 | The simulated payment form asks for cardholder name, card number, expiry and CVC; the gateway fakes success or failure (Q5) and stores only a reference, never the card data. Which input fakes a failure (for example a test card number) is decided when the function is built. | AC-KAN-22-01, AC-KAN-22-04 |
| AS-10 | The terms version is the last-updated date shown on the KAN-9 terms page. | AC-KAN-23-02 |
| AS-11 | The acceptance checkbox can be checked only after the terms were opened once. | AC-KAN-23-04 |
| AS-12 | A checkout whose email already has an account is settled by the platform team by hand (refund or new email); no automatic refund in the MVP. | AC-KAN-24-06 |

## Backlog issues
- The Jira epic is named "Gestión de la contratación de los planes"; the epic map calls it "Contratación de planes". Same epic.
- KAN-23 (accept the terms before paying) shows the same terms text as KAN-9 (Home).
- KAN-24 (email after payment to start sign-up) and the KAN-26 epic title ("Registro del usuario una vez confirmado correo") describe the same hand-off: the confirmed "correo" is the KAN-24 payment email.
- KAN-176 (admin epic) said the business activates on payment; Q2 changed it to activation on the super admin's approval. KAN-176 must be rewritten in Jira.

## Non-functional
- i18n keys: new prefixes `landing:planCheckout.detail.*` (including one label per limit, `landing:planCheckout.detail.limits.<limitName>`), `landing:planCheckout.payment.*`, `landing:planCheckout.terms.*`, `landing:planCheckout.email.*`. Reused: `validation:required`, `validation:emailInvalid`, `validation:recaptchaRequired`, `common:errors.notFound`, `common:errors.network`, `common:errors.unknown`.
- Prices formatted from `priceInCents` with the locale formatter.
- Payment runs in a callable function (`api-mutation-standards` §1), idempotent per attempt; the client never writes `PlanCheckout`.
- No pagination, export, realtime or idle timeout (public pages). reCAPTCHA is required on the checkout form (KAN-22), verified on the server before charging.
- Accessibility: one `h1` (plan name), limits as a list with visible labels, usable at 360 px width.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-21 | AC-KAN-21-01 … AC-KAN-21-11 | `tests/PlanDetailPage.test.tsx` |
| KAN-22 | AC-KAN-22-01 … AC-KAN-22-11 | `tests/PlanCheckoutPage.test.tsx`; `functions/src/billing/tests/payPlanCheckout.test.ts` |
| KAN-23 | AC-KAN-23-01 … AC-KAN-23-04 | `tests/PlanCheckoutPage.test.tsx` |
| KAN-24 | AC-KAN-24-01 … AC-KAN-24-06 | `functions/src/notifications/tests/sendPlanCheckoutEmail.test.ts`; `tests/PlanCheckoutConfirmationPage.test.tsx` |

