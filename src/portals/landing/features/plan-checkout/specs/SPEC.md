# Plan contracting (KAN-20)

| Field | Value |
| --- | --- |
| Portal | landing |
| Feature folder | `src/portals/landing/features/plan-checkout/` |
| Stories | KAN-21, KAN-22, KAN-23, KAN-24 |
| Status | BLOCKED (partially) |
| Depends on | Q7 (checkout in the MVP); KAN-1 Home (plan catalog KAN-7); KAN-180 plans (admin: `Plan`, `limits` KAN-181, `active`/`inactive` KAN-184); KAN-26 subscriber sign-up |

## Intent
A business owner who is comparing plans can open one plan and see everything it includes before deciding. Paying for the plan, accepting the terms and the confirmation email that starts the account sign-up wait for Q7 (does the MVP include checkout with the simulated gateway, or start with businesses created by hand).

## Actors and permissions
| Actor | Can |
| --- | --- |
| visitor | Read the details of any `active` plan |
| subscriber, customer, super admin (signed in) | Same as a visitor |

## In scope
- Plan detail page reached from the plan catalog (KAN-7) or a direct link (KAN-21).

## Out of scope
- Everything blocked by Q7: payment through the simulated gateway (KAN-22), terms acceptance before payment (KAN-23), the automatic email after payment (KAN-24), the first `Subscription` becoming `active` and the `Business` becoming `active` (KAN-176).
- Creating or editing plans (KAN-180 epic, admin).
- Plan changes for an existing subscriber (KAN-32 subscription epic, business portal).

## Data
- `Plan` (`plans/{planId}`), read only: name, `priceInCents`, `billingPeriod` (`monthly` / `annual`), features and `limits` (KAN-181, as defined in the KAN-180 spec), status `active` / `inactive` (glossary §4.5). Description text: AS-2.
- Not touched while Q7 is open: `Subscription`, `Payment`, `Business`, the `subscriber` role claim.

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

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| KAN-22 | Q7 — checkout in the MVP | Payment of the plan through the simulated gateway; creation of `Payment`; first transition into `Subscription.active` and `Business.active`. |
| KAN-23 | Q7 — checkout in the MVP | Reviewing and accepting the terms before paying (only exists if there is a checkout). |
| KAN-24 | Q7 — checkout in the MVP | Automatic email after the payment is confirmed, which starts the sign-up of KAN-26. |
| KAN-21 (the "contract this plan" action on the detail page) | Q7 — checkout in the MVP | Where the contract button leads. Until decided, the detail page has no contract action. |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | The plan detail is a separate public page with its own link (shareable), not a modal over the catalog. | AC-KAN-21-01, AC-KAN-21-04 |
| AS-2 | A `Plan` has a short description besides its features and `limits`; the field name is defined in the KAN-180 spec. | AC-KAN-21-01 |
| AS-3 | Plan prices are shown in one platform currency (consistent with the KAN-180 spec), formatted for the active locale. | AC-KAN-21-01, AC-KAN-21-08 |
| AS-4 | The detail page lets the visitor switch between plans (tabs or a compact list). | AC-KAN-21-03 |
| AS-5 | A limit can be "unlimited"; how it is stored is defined by KAN-181. | AC-KAN-21-07 |

## Backlog issues
- The Jira epic is named "Gestión de la contratación de los planes"; the epic map calls it "Contratación de planes". Same epic.
- KAN-23 (accept the terms before paying) must show the same terms text as KAN-9 (Home).
- KAN-24 (email after payment to start sign-up) and the KAN-26 epic title ("Registro del usuario una vez confirmado correo") describe the same hand-off; both depend on Q7.
- KAN-176 (business created after the first payment, admin epic) is the other side of KAN-22 and is also blocked by Q7.

## Non-functional
- i18n keys: new prefix `landing:planCheckout.detail.*` (including one label per limit, `landing:planCheckout.detail.limits.<limitName>`). Reused: `common:errors.notFound`, `common:errors.network`, `common:errors.unknown`.
- Prices formatted from `priceInCents` with the locale formatter.
- No pagination, export, realtime, reCAPTCHA or idle timeout on the plan detail (public read-only page). reCAPTCHA will apply to the checkout form once Q7 is decided.
- Accessibility: one `h1` (plan name), limits as a list with visible labels, usable at 360 px width.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-21 | AC-KAN-21-01 … AC-KAN-21-08 | `tests/PlanDetailPage.test.tsx` |
| KAN-22 | BLOCKED (Q7) | — |
| KAN-23 | BLOCKED (Q7) | — |
| KAN-24 | BLOCKED (Q7) | — |
