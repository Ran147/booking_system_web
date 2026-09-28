# Subscription plan management (KAN-180)

| Field | Value |
| --- | --- |
| Portal | admin |
| Feature folder | `src/portals/admin/features/plans/` |
| Stories | KAN-181, KAN-182, KAN-183, KAN-184, KAN-185 |
| Status | BLOCKED (partially) |
| Depends on | Q1 (collaborator limit in plans), Q5 decided 2026-09-28 (no renewal retries in the MVP; grace days alone decide when `past_due` becomes `expired`); KAN-1 home (plan catalog KAN-7), KAN-20 plan details (KAN-21), KAN-32 subscription spec; `features/auth` spec (idle logout KAN-38) |

## Intent
The super admin defines the commercial offer: which plans exist, what they cost, what they include and which are sold. From the same admin area they also set the platform-wide parameters (idle timeout, grace days, maximum bookings per business) that the other portals read.

## Actors and permissions
| Actor | Can |
| --- | --- |
| super admin (`super_admin`) | List, create, edit, activate and deactivate plans; read and change `PlatformSettings` |
| visitor, subscriber | See only `active` plans in the public catalog (KAN-7, KAN-21, KAN-44); never see this admin area |
| customer | Nothing in this feature |

## In scope
- List of all plans, `active` and `inactive` (KAN-185).
- Create a plan with name, price, billing period, features and limits (KAN-181), except the collaborator limit.
- Edit a plan's price, features and billing period (KAN-183).
- Activate / deactivate a plan (KAN-184).
- Platform settings screen: idle timeout, grace days after expiry, maximum bookings per business (KAN-182).

## Out of scope
- The collaborator limit on a plan (KAN-181): BLOCKED, Q1.
- Deleting a plan (no story; deactivation replaces it).
- Running the `past_due` → `expired` change after the grace days and whether a new price applies at renewal: the KAN-32 subscription spec. There are no renewal retries in the MVP (Q5).
- Enforcing the booking limits when a booking is created (booking specs KAN-63 / KAN-145).
- Plan change by a subscriber (KAN-44).
- Which plan edits are written to the audit log (KAN-194, Q3).

## Data
- `Plan` (`plans/{planId}`, glossary §3, §4.5). Status `active` ↔ `inactive`. Proposed fields (new; to confirm in review):
  - `name: string`
  - `priceInCents: number` (integer, minor units)
  - `billingPeriod`: `monthly` | `annual` (story: "duración (mensual/anual)")
  - `features: string[]` (list of included features, display text)
  - `limits: { maxBookings }` (glossary: `limits`, KAN-181). `limits.maxCollaborators` is **not** added while Q1 is open.
  - `status`, `createdAt`, `updatedAt`
- `PlatformSettings` (`platformSettings/current`, glossary §3). Fields:
  - `idleTimeoutMinutes: number` (named in `auth-and-roles`)
  - `gracePeriodDays: number` (proposed name; "días de gracia", glossary §4.2)
  - `maxBookingsPerBusiness: number` (proposed name)
  - Fallback values: `DEFAULT_PLATFORM_SETTINGS` when the document does not exist.
- `Subscription`: read only, to count subscribers per plan (AS-4).

## Acceptance criteria

### KAN-181 — Create a subscription plan with name, price, billing period, features and limits
- [ ] **AC-KAN-181-01** · happy · Given a signed-in super admin on the new-plan form, when they enter a name, a price, a billing period (`monthly` or `annual`), at least one feature and a maximum number of bookings and save, then the plan is created with status `active` (AS-1), appears in the plans list and `admin:plans.create.success` is shown. [KAN-181]
- [ ] **AC-KAN-181-02** · happy · Given a price typed with decimals (for example 19.90), when the plan is saved, then it is stored as an integer in minor units (`priceInCents` = 1990) and shown back formatted in the platform currency (AS-2). [KAN-181]
- [ ] **AC-KAN-181-03** · happy · Given the new plan is `active`, when a visitor opens the public plan catalog (KAN-7), then the new plan is listed with its price, billing period and features. [KAN-181, KAN-7]
- [ ] **AC-KAN-181-04** · error · Given the name, price, billing period or feature list is empty, when the super admin saves, then the plan is not created and `validation:required` is shown on each empty field. [KAN-181]
- [ ] **AC-KAN-181-05** · error · Given a negative price, a maximum bookings value below 1 or not a whole number, when the super admin saves, then the plan is not created and `validation:outOfRange` is shown on that field (AS-3). [KAN-181]
- [ ] **AC-KAN-181-06** · error · Given a name longer than the limit in AS-3 or a feature line longer than its limit, when the super admin saves, then `validation:tooLong` is shown and nothing is created. [KAN-181]
- [ ] **AC-KAN-181-07** · error · Given another plan already has the same name (ignoring case and accents), when the super admin saves, then the plan is not created and `admin:plans.form.duplicateNameError` is shown (AS-5). [KAN-181]
- [ ] **AC-KAN-181-08** · error · Given the request fails because of the network, when the super admin saves, then no plan is created, the form keeps its values and `common:errors.network` is shown. [KAN-181]
- [ ] **AC-KAN-181-09** · edge · Given the super admin double-clicks save, when the request is in flight, then the save action is disabled and only one plan is created. [KAN-181]

### KAN-182 — Configure global platform parameters (idle timeout, grace days after subscription expiry, maximum bookings per business)
- [ ] **AC-KAN-182-01** · happy · Given a signed-in super admin, when they open platform settings, then they see the current `idleTimeoutMinutes`, `gracePeriodDays` and `maxBookingsPerBusiness`, or the default values when none were saved yet. [KAN-182]
- [ ] **AC-KAN-182-02** · happy · Given valid values, when the super admin saves, then `PlatformSettings` is updated, `admin:plans.settings.saveSuccess` is shown and the values stay after reloading the page. [KAN-182]
- [ ] **AC-KAN-182-03** · happy · Given `idleTimeoutMinutes` was changed, when any user signs in after the change (AS-7), then they are signed out after that many minutes without activity, preceded by the warning dialog (KAN-38, KAN-133). [KAN-182, KAN-38]
- [ ] **AC-KAN-182-04** · error · Given an empty field, when the super admin saves, then nothing is saved and `validation:required` is shown on that field. [KAN-182]
- [ ] **AC-KAN-182-05** · error · Given a value outside the range in AS-6 or not a whole number, when the super admin saves, then nothing is saved and `validation:outOfRange` is shown on that field. [KAN-182]
- [ ] **AC-KAN-182-06** · error · Given a caller without the `super_admin` role, when they try to write `PlatformSettings` directly, then the write is rejected with `common:errors.permissionDenied` and the values do not change. [KAN-182]
- [ ] **AC-KAN-182-07** · error · Given the request fails because of the network, when the super admin saves, then the stored values do not change, the form keeps the typed values and `common:errors.network` is shown. [KAN-182]
- [ ] **AC-KAN-182-08** · edge · Given unsaved changes, when the super admin leaves the settings screen, then they are asked to confirm discarding the changes with `admin:plans.settings.discardConfirm`. [KAN-182]

### KAN-183 — Edit an existing plan (price, features or billing period) without deleting it
- [ ] **AC-KAN-183-01** · happy · Given an existing plan, when the super admin opens it for editing, then the form shows its current name, price, billing period, features and limits. [KAN-183]
- [ ] **AC-KAN-183-02** · happy · Given valid changes to price, features or billing period, when the super admin saves, then the plan keeps its id and status, the new values show in the plans list and, if it is `active`, in the public catalog, and `admin:plans.edit.success` is shown. [KAN-183, KAN-7]
- [ ] **AC-KAN-183-03** · edge · Given a plan with subscribers, when its price is changed, then the super admin is warned with `admin:plans.edit.hasSubscribersWarning` before saving, and existing subscriptions keep the price of their current period (AS-8). [KAN-183]
- [ ] **AC-KAN-183-04** · error · Given an empty or out-of-range value, when the super admin saves, then nothing changes and `validation:required` or `validation:outOfRange` is shown on that field. [KAN-183]
- [ ] **AC-KAN-183-05** · error · Given the new name matches another plan's name, when the super admin saves, then nothing changes and `admin:plans.form.duplicateNameError` is shown. [KAN-183]
- [ ] **AC-KAN-183-06** · error · Given the plan was changed by another session after the form was opened, when the super admin saves, then nothing is overwritten, `admin:plans.edit.conflictError` is shown and the latest values can be reloaded (AS-9). [KAN-183]
- [ ] **AC-KAN-183-07** · error · Given the request fails because of the network, when the super admin saves, then the plan keeps its previous values and `common:errors.network` is shown. [KAN-183]

### KAN-184 — Activate or deactivate a plan to hide it from the public catalog while keeping existing subscribers
- [ ] **AC-KAN-184-01** · happy · Given an `active` plan, when the super admin deactivates it and confirms, then its status becomes `inactive`, it disappears from the public catalog (KAN-7, KAN-21) and from the plan options a subscriber can upgrade to (KAN-44), and `admin:plans.status.deactivateSuccess` is shown. [KAN-184]
- [ ] **AC-KAN-184-02** · happy · Given an `inactive` plan, when the super admin activates it, then its status becomes `active` and it appears again in the public catalog. [KAN-184]
- [ ] **AC-KAN-184-03** · edge · Given an `active` plan with businesses subscribed to it, when it is deactivated, then those subscriptions keep their plan and status, and their businesses keep their `status`. [KAN-184]
- [ ] **AC-KAN-184-04** · edge · Given it is the only `active` plan, when the super admin deactivates it, then they are warned with `admin:plans.status.lastActiveWarning` before confirming (AS-10). [KAN-184]
- [ ] **AC-KAN-184-05** · error · Given the request fails because of the network, when the super admin confirms, then the plan keeps its previous status and `common:errors.network` is shown. [KAN-184]
- [ ] **AC-KAN-184-06** · error · Given a caller without the `super_admin` role, when they try to change a plan's status directly, then it is rejected with `common:errors.permissionDenied`. [KAN-184]

### KAN-185 — See the complete list of all plans
- [ ] **AC-KAN-185-01** · happy · Given plans in both statuses, when the super admin opens the plans list, then every plan is shown with name, price, billing period, `status` badge and number of subscribed businesses (AS-4), `active` first and then by price (AS-11). [KAN-185]
- [ ] **AC-KAN-185-02** · happy · Given the plans list, when the super admin filters by status, then only plans with that status are shown. [KAN-185]
- [ ] **AC-KAN-185-03** · edge · Given no plan exists yet, when the list loads, then an empty state with `admin:plans.list.empty` and an action to create the first plan is shown. [KAN-185]
- [ ] **AC-KAN-185-04** · error · Given the request fails because of the network, when the list loads, then an error state with `common:errors.network` and a retry action is shown. [KAN-185]
- [ ] **AC-KAN-185-05** · error · Given a signed-in `subscriber` or `customer`, when they open the admin plans URL, then they are redirected to their own portal. [KAN-185]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| KAN-181 (collaborator limit only) | Q1 — collaborator | The "número de colaboradores" limit on a plan (`limits.maxCollaborators` is not added); KAN-85 (upgrade prompt when the limit is reached) stays blocked too |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | A new plan is created `active` and shows in the catalog at once. | AC-KAN-181-01, AC-KAN-181-03 |
| AS-2 | All plans are priced in one platform currency; the currency is not chosen per plan. | AC-KAN-181-02 |
| AS-3 | Limits: name 3–60 characters; up to 20 features of up to 120 characters each; price from 0 up to 99,999,999 minor units; `limits.maxBookings` a whole number ≥ 1 per billing period. | AC-KAN-181-05, AC-KAN-181-06, AC-KAN-183-04 |
| AS-4 | "Subscribed businesses" counts subscriptions whose plan is this plan and whose status is `active` or `past_due`. | AC-KAN-185-01 |
| AS-5 | Plan names are unique, compared without case and accents. | AC-KAN-181-07, AC-KAN-183-05 |
| AS-6 | Ranges: `idleTimeoutMinutes` 5–240; `gracePeriodDays` 0–30; `maxBookingsPerBusiness` 1–100,000. Defaults: 30 minutes, 7 days, 1,000 bookings. | AC-KAN-182-01, AC-KAN-182-05 |
| AS-7 | A new idle timeout applies from each user's next sign-in or page load, not to sessions already open. | AC-KAN-182-03 |
| AS-8 | A price change applies to new subscriptions; existing subscriptions keep their current period price. What price applies at their next renewal is not decided by any story (Q5 covered only retries); see Backlog issues. | AC-KAN-183-03 |
| AS-9 | Concurrent edits are detected with the plan's `updatedAt`; last write does not silently win. | AC-KAN-183-06 |
| AS-10 | Deactivating the last `active` plan is allowed after a warning; the catalog then shows its empty state. | AC-KAN-184-04 |
| AS-11 | The plans list is not paginated: the number of plans is small. | AC-KAN-185-01 |
| AS-12 | Limits (`limits`) are also editable in KAN-183, with the same rules as creation, although the story only names price, features and billing period. | AC-KAN-183-01 |

## Backlog issues
- KAN-182 (platform settings) sits in the plans epic but is not about plans. Specified here, in `src/portals/admin/features/plans`, as the backlog places it; the team may move it to its own folder (for example `src/portals/admin/features/platform-settings`) in `epic-map.md`.
- KAN-182 "límite máximo de reservas por negocio" overlaps with KAN-181 plan limit "reservas máximas". Which one wins when both apply is not stated (for example the lower of the two). Needs a decision before the booking specs enforce limits.
- KAN-182 grace days decide when `past_due` becomes `expired` (glossary §4.2); since Q5 deferred renewal retries (out of MVP), nothing else changes that date.
- No story says whether a plan price change applies to existing subscriptions at their next renewal (AS-8).
- KAN-181 mentions a collaborator limit ("número de colaboradores"), which depends on Q1.
- KAN-183 says "duración" for monthly/annual; it is the billing period, not a length of time. It does not say whether limits can be edited (AS-12).
- KAN-184 "manteniendo activos a los negocios" matches the glossary rule for `Plan` (inactive plans keep their subscribers).

## Non-functional
- i18n: new keys under `admin:plans.list.*`, `admin:plans.form.*`, `admin:plans.create.*`, `admin:plans.edit.*`, `admin:plans.status.*`, `admin:plans.billingPeriod.*` (labels for `monthly` / `annual`), `admin:plans.settings.*`. Reused: `validation:required`, `validation:outOfRange`, `validation:tooLong`, `common:errors.network`, `common:errors.permissionDenied`.
- Security: `plans` and `platformSettings/current` are writable only by `super_admin`; `plans` with `status == active` are publicly readable for the catalog; `platformSettings/current` is readable by any signed-in user (idle timeout).
- Idle logout: this spec owns the value `PlatformSettings.idleTimeoutMinutes`; the logout behavior belongs to the `features/auth` spec (KAN-38).
- Money: prices are integers in `priceInCents`, formatted with the locale of the viewer.
- No pagination for plans (AS-11), no export, no realtime.
- Accessibility: form fields have labels and error text linked to the field; the feature list can be edited with the keyboard (add, remove, reorder); status changes use a confirmation dialog.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-181 | AC-KAN-181-01 … AC-KAN-181-09 | `tests/PlanFormScreen.test.tsx` |
| KAN-182 | AC-KAN-182-01, AC-KAN-182-02, AC-KAN-182-04, AC-KAN-182-05, AC-KAN-182-07, AC-KAN-182-08 | `tests/PlatformSettingsScreen.test.tsx` |
| KAN-182 | AC-KAN-182-03 | `tests/IdleTimeout.test.tsx` (in `src/features/auth`) |
| KAN-182 | AC-KAN-182-06 | `functions/src/rules/tests/platformSettings.rules.test.ts` |
| KAN-183 | AC-KAN-183-01 … AC-KAN-183-07 | `tests/PlanFormScreen.test.tsx` |
| KAN-184 | AC-KAN-184-01 … AC-KAN-184-05 | `tests/PlanListScreen.test.tsx` |
| KAN-184 | AC-KAN-184-06 | `functions/src/rules/tests/plans.rules.test.ts` |
| KAN-185 | AC-KAN-185-01 … AC-KAN-185-05 | `tests/PlanListScreen.test.tsx` |
