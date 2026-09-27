# Notification settings (KAN-99)

| Field | Value |
| --- | --- |
| Portal | business |
| Feature folder | `src/portals/business/features/notification-settings/` |
| Stories | KAN-100, KAN-101 |
| Status | Draft |
| Depends on | KAN-163 customer notifications (KAN-165 reminder emails, sent by `functions/src/notifications`); KAN-168 customer profile (reminder opt-in, not yet defined); KAN-63 schedule and KAN-155 customer cancellation (events for alerts); KAN-32 subscription (KAN-49 read-only, period end); KAN-29 business layout (where alerts are shown) |

## Intent
For the subscriber who wants to decide how and when their customers are reminded of upcoming bookings, and which internal alerts they receive about their own business (new bookings, customer cancellations, subscription about to end). The outcome is fewer no-shows and fewer surprises, without alerts the subscriber does not want.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own business only) | Read and change the reminder settings and the internal alert settings of their own business. Changes are rejected while the business is `inactive` or `suspended` (KAN-49). Receives `Notification`s for the alert types they enabled. |
| customer | Nothing in this epic. Receives reminders according to these settings, only if their own reminder opt-in allows it (KAN-100). |
| super admin | Nothing in this epic. |

## In scope
- Business-level reminder settings: on/off and how long before `startsAt` the reminder is sent (KAN-100).
- Business-level internal alert settings: which event types create a `Notification` for the subscriber (KAN-101).
- Creation of `Notification` documents for enabled alert types.

## Out of scope
- Sending and content of the reminder email itself (KAN-165, `functions/src/notifications`).
- The customer's reminder opt-in control (no customer story defines it; see Backlog issues).
- Where and how the subscriber reads the `Notification` list (no story defines the inbox; see Backlog issues).
- Alerts for failed renewal charges and retries (KAN-48/KAN-50, blocked on Q5).
- Any alert or reminder for a collaborator (Q1).
- Channels other than email for reminders, and email/push for internal alerts (AS-1, AS-5).

## Data
- `Business` (`domain-glossary` §3): `timeZone`.
- `Booking` (read only): `startsAt`, `status` (§4.1). Reminders only concern `pending` and `confirmed` bookings (AS-3).
- `Reminder` (§3): scheduled Cloud Function, reads the settings below.
- `Notification` (§3): `users/{userId}/notifications/{notificationId}`, created for the subscriber (`Business.ownerUserId`).
- `Subscription` (read only): `currentPeriodEndsAt`, `cancelAtPeriodEnd` (§4.2).
- New fields (proposed names, to confirm in review; none relates to an open question):
  - `Business.reminderSettings`: `{ isEnabled: boolean, leadTimesMinutes: number[] }`.
  - `Business.alertSettings`: `{ bookingCreated: boolean, bookingCancelledByCustomer: boolean, subscriptionEnding: boolean }`.
  - `Notification` fields: `type` (one of the three alert types above), `createdAt`, `isRead`, and a reference to the booking or subscription it is about.

## Acceptance criteria

### KAN-100 — Configure how and when booking reminders are sent to customers (if the customer enabled reminders)
- [ ] **AC-KAN-100-01** · happy · Given a subscriber of an `active` business, when they open the reminder settings, then they see whether reminders are on and the current lead time(s), with the defaults shown the first time. See AS-1, AS-2. [KAN-100]
- [ ] **AC-KAN-100-02** · happy · Given reminders are on with a lead time of 24 hours, when the subscriber changes it to 2 hours and saves, then `business:notificationSettings.reminders.saved` is shown and reminders for bookings not yet reminded are sent 2 hours before `startsAt`. See AS-2. [KAN-100, KAN-165]
- [ ] **AC-KAN-100-03** · happy · Given the subscriber turns reminders off and saves, when a booking reaches its reminder time, then no reminder email is sent to its customer. [KAN-100]
- [ ] **AC-KAN-100-04** · error · Given reminders are on and no lead time is selected, or a lead time outside the allowed range, when the subscriber saves, then nothing is saved and `validation:required` or `validation:outOfRange` is shown. See AS-2. [KAN-100]
- [ ] **AC-KAN-100-05** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to save the settings, then nothing changes and `business:errors.readOnly` is shown. [KAN-100, KAN-49]
- [ ] **AC-KAN-100-06** · error · Given the request fails because of the network, when the subscriber saves, then the previous settings stay in effect, the form keeps the edited values and `common:errors.network` is shown. [KAN-100]
- [ ] **AC-KAN-100-07** · edge · Given a customer who has not enabled reminders, when their booking reaches the reminder time, then no reminder is sent to them, whatever the business settings. See AS-4. [KAN-100]
- [ ] **AC-KAN-100-08** · edge · Given a booking created after its reminder time has already passed (for example, 1 hour before `startsAt` with a 24-hour lead time), when the reminder job runs, then no late reminder is sent. See AS-3. [KAN-100]
- [ ] **AC-KAN-100-09** · edge · Given a business whose `timeZone` differs from the subscriber's browser, when the settings and a preview of the next reminder time are shown, then times are expressed in the business `timeZone`. [KAN-100]
- [ ] **AC-KAN-100-10** · edge · Given a booking that becomes `cancelled`, `completed` or `no_show` before its reminder time, when the reminder job runs, then no reminder is sent for it. [KAN-100]

### KAN-101 — Configure my own internal alerts (new booking, customer cancellation, subscription about to end, etc.)
- [ ] **AC-KAN-101-01** · happy · Given a subscriber of an `active` business, when they open the alert settings, then they see one switch per alert type (`bookingCreated`, `bookingCancelledByCustomer`, `subscriptionEnding`) with its current value, all on the first time. See AS-5, AS-6. [KAN-101]
- [ ] **AC-KAN-101-02** · happy · Given `bookingCreated` is on, when a new booking is created for the business (by a customer or by the subscriber), then a `Notification` of that type is created for the subscriber with the service, date and time in the business `timeZone`. See AS-7. [KAN-101]
- [ ] **AC-KAN-101-03** · happy · Given `bookingCancelledByCustomer` is on, when a customer cancels a booking (KAN-159), then a `Notification` of that type is created for the subscriber; a cancellation by the subscriber creates none. [KAN-101, KAN-159]
- [ ] **AC-KAN-101-04** · happy · Given `subscriptionEnding` is on, when the subscription's `currentPeriodEndsAt` is within the notice period and it will not renew (`cancelAtPeriodEnd` is true), then one `Notification` of that type is created for the subscriber. See AS-8. [KAN-101, KAN-47]
- [ ] **AC-KAN-101-05** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to change an alert switch, then nothing changes and `business:errors.readOnly` is shown. [KAN-101, KAN-49]
- [ ] **AC-KAN-101-06** · error · Given the request fails because of the network, when the subscriber changes a switch, then the switch returns to its previous value and `common:errors.network` is shown. [KAN-101]
- [ ] **AC-KAN-101-07** · edge · Given an alert type is off, when its event happens, then no `Notification` is created for it, and turning it on later does not create notifications for past events. [KAN-101]
- [ ] **AC-KAN-101-08** · edge · Given the subscription-ending alert was already created for the current period, when the daily check runs again, then no duplicate `Notification` is created. [KAN-101]
- [ ] **AC-KAN-101-09** · edge · Given two businesses, when an event happens in one of them, then only that business's subscriber gets a `Notification`. [KAN-101]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| — | — | No story of this epic depends on Q1–Q7. Alerts about renewal retries or `past_due` (KAN-48, Q5) are not part of KAN-101 and must not be added under its "etc." until Q5 is decided. |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | "How" reminders are sent means email only; the only other choice is on/off. Default: on. | AC-KAN-100-01 |
| AS-2 | Lead time is chosen from a fixed list: 1, 2, 12, 24 and 48 hours; up to two lead times may be selected. Default: 24 hours. | AC-KAN-100-01, AC-KAN-100-02, AC-KAN-100-04 |
| AS-3 | Reminders only apply to `pending` and `confirmed` future bookings; a reminder whose time has already passed when the booking is created is skipped, not sent late. | AC-KAN-100-08, AC-KAN-100-10 |
| AS-4 | A customer reminder opt-in exists on the customer side (to be defined by KAN-165/KAN-168). Customers without an account (KAN-88) have no opt-in and receive no reminders. | AC-KAN-100-07 |
| AS-5 | The alert types for the MVP are exactly `bookingCreated`, `bookingCancelledByCustomer` and `subscriptionEnding`; the "etc." in the story adds nothing until the team lists more. | AC-KAN-101-01 |
| AS-6 | Internal alerts are in-app `Notification` documents only (no email or push). Default: every type on. | AC-KAN-101-01 |
| AS-7 | `bookingCreated` also fires for bookings the subscriber creates manually (KAN-69). | AC-KAN-101-02 |
| AS-8 | "Subscription about to end" means `cancelAtPeriodEnd` is true and `currentPeriodEndsAt` is 7 days away or less; the check runs once a day. | AC-KAN-101-04, AC-KAN-101-08 |

## Backlog issues
- KAN-100 depends on a customer reminder opt-in ("si el cliente habilitó el recordatorio") that no customer story defines. KAN-165 only says the customer receives reminders, and KAN-168 (profile) has no setting for it. A customer story is needed (AS-4).
- KAN-101 ends with "etc."; the full list of alert types is not defined (AS-5).
- No story defines where the subscriber reads internal alerts (bell, inbox, mark as read). It probably belongs to the business layout (KAN-29).
- KAN-101 "suscripción por vencer" overlaps KAN-48/KAN-50 (notify on each failed renewal attempt), which is blocked on Q5; KAN-48 and KAN-50 are also duplicates.
- KAN-100 overlaps KAN-165 (customer receives reminders): KAN-165 owns the email, this epic owns the business settings.

## Non-functional
- New i18n key prefixes: `business:notificationSettings.reminders.*`, `business:notificationSettings.alerts.*`, `business:notifications.types.*` (titles of each `Notification` type).
- Reminders and alerts are produced by Cloud Functions (scheduled or triggered); the UI only writes the settings. Rules allow writes only for the owner of the business and only while it is writable.
- Session: idle logout after `PlatformSettings.idleTimeoutMinutes` (KAN-182).
- All times in the business `timeZone`.
- Accessibility: every switch has a visible label and announces its state; saving shows a toast that is also announced to screen readers.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-100 | AC-KAN-100-01 … AC-KAN-100-06, AC-KAN-100-09 | `tests/ReminderSettingsScreen.test.tsx` |
| KAN-100 | AC-KAN-100-02, AC-KAN-100-03, AC-KAN-100-07, AC-KAN-100-08, AC-KAN-100-10 | `functions/src/notifications/tests/sendBookingReminders.test.ts` |
| KAN-101 | AC-KAN-101-01, AC-KAN-101-05, AC-KAN-101-06 | `tests/AlertSettingsScreen.test.tsx` |
| KAN-101 | AC-KAN-101-02, AC-KAN-101-03, AC-KAN-101-04, AC-KAN-101-07, AC-KAN-101-08, AC-KAN-101-09 | `functions/src/notifications/tests/createBusinessAlerts.test.ts` |
