# Business sidebar and sign-out (KAN-29)

| Field | Value |
| --- | --- |
| Portal | business |
| Feature folder | `src/portals/business/layout/` |
| Stories | KAN-39, KAN-40, KAN-41, KAN-42 |
| Status | Draft |
| Depends on | KAN-28 (subscriber sign-in and session); KAN-38 (idle logout); KAN-32 (subscription data, payment page KAN-45, read-only KAN-49); KAN-182 (`PlatformSettings`); Q5 decided 2026-09-28 (no renewal retries in the MVP, so the `past_due` countdown follows the grace days only); Q1 decided 2026-09-28 (the collaborator uses this layout, sections limited by KAN-86); Q2 decided 2026-09-28 (a `pending` or `rejected` business shows the status screens of KAN-33, not this layout); PROP-4 business profile (where the logo is set) |

## Intent
Every screen of the business portal shows a sidebar that tells the subscriber which business they are managing, the state of their subscription, and warns them before the subscription runs out. From the sidebar the subscriber can sign out to protect their account when they finish.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own business only) | See their own business name and logo and their own subscription banners; sign out. Allowed whatever the business status, including `inactive` and `suspended`. |
| customer, super admin, visitor | Never reach the business layout (route guard redirects them). |
| collaborator (own business only, `active`) | See the business name and logo and their own name; sign out. No subscription banners (AS-10). Which navigation sections they see is decided by KAN-86 (collaborators spec, AC-KAN-86-02). |

## In scope
- Sidebar header with the business name and logo.
- Subscription banner (plan and status) and "about to end" warning banner.
- Sign-out action in the sidebar.
- The same sidebar for a collaborator, without the subscription banners.

## Out of scope
- Navigation links of the sidebar: no story in this epic defines them (see Backlog issues).
- Where the subscriber uploads or changes the logo (PROP-4, business-profile spec); the business name is set at sign-up (KAN-25).
- The "under review" and "rejected" screens of a `pending` or `rejected` business (KAN-33, auth spec: AC-KAN-33-09 … AC-KAN-33-11).
- Which navigation sections a collaborator sees (KAN-86, collaborators spec).
- Idle logout (KAN-38, auth spec) — only referenced.
- Paying, upgrading or cancelling (KAN-44, KAN-45, KAN-47 in the subscription spec); the banners only link there.
- Internal alerts "subscription about to end" (KAN-101, notifications epic).
- Retry schedule of failed renewals (KAN-48): deferred, out of MVP (Q5).

## Data
- `Business` (`domain-glossary` §3): `name`, `status` (`pending`, `active`, `inactive`, `suspended`, `rejected`; this layout is shown only for `active`, `inactive` and `suspended`), `timeZone`. **Logo field:** not defined in the glossary; this spec reads a Nullable `logoUrl` (name to confirm with PROP-4; see Backlog issues).
- `Collaborator` (`businesses/{businessId}/collaborators/{collaboratorId}`): `fullName`, read for the signed-in collaborator only (session `collaboratorId`).
- `Subscription` at `businesses/{businessId}/subscription/current`: `status` (`active`, `past_due`, `expired`, `cancelled`), `planId`, `currentPeriodEndsAt`, `cancelAtPeriodEnd` (`domain-glossary` §4.2).
- `Plan` (`plans/{planId}`): `name`.
- `PlatformSettings` (`platformSettings/current`): `gracePeriodDays` (KAN-182), for the `past_due` countdown.
- No field is written by this spec.

## Acceptance criteria

### KAN-39 — Business name and logo in the sidebar
- [ ] **AC-KAN-39-01** · happy · Given a signed-in subscriber, when any business-portal screen is shown, then the sidebar shows the name and logo of their own business (taken from the session's business, never from the URL). [KAN-39]
- [ ] **AC-KAN-39-02** · error · Given the business data cannot be loaded because of the network, when the sidebar is shown, then a placeholder is shown instead of the name and logo, `common:errors.network` is announced, and the sign-out action still works. [KAN-39]
- [ ] **AC-KAN-39-03** · edge · Given a business without a logo, or whose logo fails to load, when the sidebar is shown, then a fallback with the business initials is shown and no broken image appears. See AS-1. [KAN-39]
- [ ] **AC-KAN-39-04** · edge · Given a business name longer than the sidebar width, when it is shown, then it is truncated with an ellipsis and the full name is available as accessible text and on hover. [KAN-39]
- [ ] **AC-KAN-39-05** · edge · Given the sidebar is collapsed or the screen is narrow, when it is shown, then only the logo (or initials) is visible and the business name stays available to screen readers. See AS-2. [KAN-39]
- [ ] **AC-KAN-39-06** · happy · Given a signed-in `active` collaborator, when any business-portal screen is shown, then the sidebar shows the name and logo of their business (from the session `businessId`) and their own full name. [KAN-39, KAN-86]
- [ ] **AC-KAN-39-07** · edge · Given a subscriber whose business is `pending` or `rejected`, when they open any business-portal URL, then the sidebar is not shown; the status screen of AC-KAN-33-09 or AC-KAN-33-11 is shown instead. [KAN-39, KAN-33]

### KAN-40 — Subscription banner
- [ ] **AC-KAN-40-01** · happy · Given a subscriber with an `active` subscription, when the sidebar is shown, then a banner shows the plan name, a status badge `active` and the renewal date (`currentPeriodEndsAt`) formatted in the business `timeZone`, with a link to the subscription page (KAN-43). [KAN-40]
- [ ] **AC-KAN-40-02** · happy · Given an `active` subscription with `cancelAtPeriodEnd` true, when the banner is shown, then it says the subscription ends on `currentPeriodEndsAt` (`business:layout.subscriptionBanner.endsOn`) instead of the renewal date. [KAN-40, KAN-47]
- [ ] **AC-KAN-40-03** · happy · Given a subscription that is `past_due`, when the banner is shown, then it shows the `past_due` badge in the attention tone and a link to pay (KAN-45). [KAN-40]
- [ ] **AC-KAN-40-04** · happy · Given a subscription that is `expired` or `cancelled`, when the banner is shown, then it shows that status in the negative tone, `business:layout.subscriptionBanner.readOnlyNotice` and a link to pay (KAN-45). [KAN-40, KAN-49]
- [ ] **AC-KAN-40-05** · error · Given the subscription cannot be loaded because of the network, when the sidebar is shown, then the banner shows `business:layout.subscriptionBanner.loadError` with a retry action, and the rest of the sidebar works. [KAN-40]
- [ ] **AC-KAN-40-06** · edge · Given the subscription status changes while the subscriber is using the portal (for example after paying in KAN-45), when they return to any screen, then the banner shows the new status without signing out. See AS-3. [KAN-40]
- [ ] **AC-KAN-40-07** · edge · Given the business is `suspended` by the super admin, when the banner is shown, then it shows `business:layout.subscriptionBanner.suspendedNotice` and no pay link, because paying does not lift a suspension (`domain-glossary` §4.3). [KAN-40]
- [ ] **AC-KAN-40-08** · edge · Given a signed-in collaborator, when the sidebar is shown, then no subscription banner and no "about to end" warning are shown, and the subscription is not read. See AS-10. [KAN-40, KAN-41, KAN-86]

### KAN-41 — Warning banner when the subscription is about to end
- [ ] **AC-KAN-41-01** · happy · Given an `active` subscription with `cancelAtPeriodEnd` true and `currentPeriodEndsAt` within the warning window, when the subscriber opens any business-portal screen, then a warning banner `business:layout.expiryWarning.message` with the remaining days and the end date (business `timeZone`) and a link to the subscription page is shown. See AS-4. [KAN-41]
- [ ] ~~**AC-KAN-41-02** · happy · Given a subscription that is `past_due`, when any business-portal screen is shown, then a warning banner `business:layout.expiryWarning.pastDue` with a link to pay (KAN-45) is shown, without a countdown (see BLOCKED). [KAN-41]~~ Replaced by AC-KAN-41-07 after Q5 was decided.
- [ ] **AC-KAN-41-03** · error · Given the subscription cannot be loaded, when the screen is shown, then no warning banner with guessed dates is shown; only the load error of AC-KAN-40-05 appears. [KAN-41]
- [ ] **AC-KAN-41-04** · edge · Given an `active` subscription with `cancelAtPeriodEnd` false, when `currentPeriodEndsAt` is near, then no warning is shown, because it renews automatically. See AS-5. [KAN-41]
- [ ] **AC-KAN-41-05** · edge · Given the end date is exactly at the edge of the window or "today" in the business `timeZone` but "tomorrow" in the browser's time zone, when the remaining days are computed, then they are counted in the business `timeZone`, and the last day reads `business:layout.expiryWarning.endsToday`. [KAN-41]
- [ ] **AC-KAN-41-06** · edge · Given the subscriber dismisses the warning banner, when they move to another screen in the same session, then it stays hidden; it is shown again in a new session. See AS-6. [KAN-41]
- [ ] **AC-KAN-41-07** · happy · Given a subscription that is `past_due`, when any business-portal screen is shown, then a warning banner `business:layout.expiryWarning.pastDue` shows the days left before it becomes `expired` and that date (business `timeZone`), with a link to pay (KAN-45). See AS-9. [KAN-41, KAN-182]
- [ ] **AC-KAN-41-08** · error · Given a `past_due` subscription and `PlatformSettings` cannot be loaded, when the banner is shown, then it shows `business:layout.expiryWarning.pastDue` with the link to pay but without days left or a date (never a guessed date). [KAN-41]

### KAN-42 — Sign out from the sidebar
- [ ] **AC-KAN-42-01** · happy · Given a signed-in subscriber, when they choose sign out in the sidebar, then the session ends, the cached data of their business is cleared and they land on the sign-in page. [KAN-42]
- [ ] **AC-KAN-42-02** · happy · Given the subscriber has signed out, when they press the browser back button or open a business-portal URL, then no business data is shown and they are redirected to sign-in. [KAN-42]
- [ ] **AC-KAN-42-03** · error · Given sign-out fails (for example a network error while revoking the session), when the subscriber chooses sign out, then the local session and cached data are cleared anyway, they land on sign-in, and `common:errors.network` is not shown as a blocking error. See AS-7. [KAN-42]
- [ ] **AC-KAN-42-04** · edge · Given a form with unsaved changes, when the subscriber chooses sign out, then a confirmation `business:layout.signOut.unsavedChangesConfirm` is shown; cancelling keeps them on the screen with their changes. See AS-8. [KAN-42]
- [ ] **AC-KAN-42-05** · edge · Given the portal is open in several tabs, when the subscriber signs out in one, then the other tabs also end up on sign-in without showing business data. [KAN-42]
- [ ] **AC-KAN-42-06** · edge · Given a business that is `inactive` or `suspended`, when the subscriber signs out, then sign-out works normally (the read-only rule does not apply to it). [KAN-42, KAN-49]
- [ ] **AC-KAN-42-07** · edge · Given a sign-out through the idle timeout (`PlatformSettings.idleTimeoutMinutes`, KAN-38), when it happens, then the result is the same as AC-KAN-42-01. [KAN-42, KAN-38]
- [ ] **AC-KAN-42-08** · happy · Given a signed-in collaborator, when they choose sign out in the sidebar, then the result is the same as AC-KAN-42-01. [KAN-42]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| — | — | None. Q5 was decided on 2026-09-28: there are no renewal retries in the MVP, so the `past_due` countdown is specified (AC-KAN-41-07, AC-KAN-41-08). |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | The logo fallback is the first letters of the first two words of the business name on a neutral token background. | AC-KAN-39-03 |
| AS-2 | The sidebar collapses to icons below the tablet breakpoint and can be collapsed by the subscriber. | AC-KAN-39-05 |
| AS-3 | The banner refreshes the subscription when the subscriber navigates or returns to the tab; no realtime listener. | AC-KAN-40-06 |
| AS-4 | The warning window is 7 days before `currentPeriodEndsAt`. It could become a `PlatformSettings` value later (KAN-182). | AC-KAN-41-01 |
| AS-5 | "Por vencer" means the subscription will stop: cancelled at period end, or a failed renewal (`past_due`). An auto-renewing `active` subscription shows no warning. | AC-KAN-41-01, AC-KAN-41-04 |
| AS-6 | The warning can be dismissed for the current session only; the `past_due` warning cannot be dismissed. | AC-KAN-41-06 |
| AS-7 | Sign-out always clears the local session even if the server call fails, so a subscriber is never stuck signed in. | AC-KAN-42-03 |
| AS-8 | Unsaved-changes confirmation on sign-out applies to forms of the business portal that track unsaved changes. | AC-KAN-42-04 |
| AS-9 | A `past_due` subscription becomes `expired` at `currentPeriodEndsAt` plus `PlatformSettings.gracePeriodDays` (fallback: the default of the admin plans spec, AS-6 there), counted in the business `timeZone`. No retry changes that date in the MVP (Q5). | AC-KAN-41-07 |
| AS-10 | Subscription banners and warnings are for the subscriber only; a collaborator never sees subscription data (the subscription is subscriber-only, collaborators spec AS-3). | AC-KAN-40-08 |

## Backlog issues
- No Jira story lets the subscriber set or change the logo shown here (KAN-39); the proposed story PROP-4 (business-profile spec, not in Jira yet) covers it. The logo field is not in `domain-glossary` yet; `logoUrl` is used as a proposed name. The business name is set at sign-up (KAN-25).
- The epic is called "Sidebar (Logout)" but has no story for the sidebar's navigation links.
- KAN-41 overlaps KAN-101 (internal alert "suscripción por vencer", notifications epic). This spec covers the banner only.
- KAN-40 "ver un banner de mi suscripción" does not say what the banner contains; the content (plan, status, date) is inferred.

## Non-functional
- i18n keys (new prefixes): `business:layout.sidebar.*`, `business:layout.subscriptionBanner.*`, `business:layout.expiryWarning.*`, `business:layout.signOut.*`. Reused: `common:errors.network`. Status labels come from `common` status labels.
- Idle logout: the layout runs the idle timeout with `PlatformSettings.idleTimeoutMinutes` (KAN-182, fallback default) and a warning dialog first (KAN-38).
- Sign-out clears the query cache (`auth-and-roles` §5).
- No pagination, export or reCAPTCHA. No realtime (AS-3).
- Tenant isolation: business and subscription come from the session `businessId`.
- Dates in the business `timeZone`.
- Accessibility: the sidebar is a `nav` landmark with a label; banners use a status role (warning uses an alert role once, not on every render); sign-out is a keyboard-reachable button with a visible label; tone is never the only signal (text + icon).

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-39 | AC-KAN-39-01 … AC-KAN-39-07 | `tests/BusinessSidebar.test.tsx` |
| KAN-40 | AC-KAN-40-01 … AC-KAN-40-08 | `tests/SubscriptionBanner.test.tsx` |
| KAN-41 | AC-KAN-41-01, AC-KAN-41-03 … AC-KAN-41-08 (AC-KAN-41-02 replaced) | `tests/ExpiryWarningBanner.test.tsx` |
| KAN-42 | AC-KAN-42-01 … AC-KAN-42-08 | `tests/BusinessSidebar.test.tsx` |
