# Customer notifications and reminders (KAN-163)

| Field | Value |
| --- | --- |
| Portal | customer (emails sent by Cloud Functions; no portal UI) |
| Feature folder | `functions/src/notifications/` |
| Stories | KAN-164, KAN-165, KAN-166, KAN-167 |
| Status | Draft |
| Depends on | KAN-145 booking checkout and KAN-69 manual bookings (booking creation), KAN-70 confirmation mode, KAN-155 and KAN-71 / KAN-72 (reschedule and cancel), KAN-99 / KAN-100 business reminder settings (`notification-settings` spec), KAN-122 customer sign-up (`User` email and `User.language`) |

## Intent
A `customer` gets an email that records each booking they make, an email whenever a booking is rescheduled or cancelled (by them or by the business), and a reminder email before the booking so they do not forget it. All emails are sent by Cloud Functions reacting to booking changes or on a schedule; the client never sends email.

## Actors and permissions
| Actor | Can |
| --- | --- |
| `customer` (recipient) | Receive emails about their own bookings (`customerUserId` = their account) in their `User.language` |
| `subscriber` | Configures how and when reminders are sent for their business (KAN-100, other spec); triggers emails indirectly by creating, confirming, rescheduling or cancelling bookings |
| System (Cloud Functions) | Sends every email; the only actor that sends mail |

## In scope
- Booking confirmation email (KAN-164).
- Reminder email before the booking (KAN-165).
- Reschedule email (KAN-166).
- Cancellation email (KAN-167).
- Email language, time zone and money formatting.

## Out of scope
- In-app notifications for customers (no customer story; `Notification` is for subscriber alerts, KAN-101).
- Internal alerts for subscribers (KAN-101).
- The reminder settings screen (KAN-100, business portal).
- SMS, push or WhatsApp channels (not in the backlog).
- Emails to `Customer` records without an account (`customerUserId` `null`), see AS-2.
- Emails to collaborators, or the collaborator's name in customer emails: no story asks for them (Q1 decided 2026-09-28). The collaborator invitation email is in the collaborators spec (KAN-79).

## Data
- `Booking` (trigger source, read only here): `status`, `startsAt`, `endsAt`, `serviceSnapshot`, `cancellation` (`cancelledBy`, `isPenalized`, `note`), `rescheduleHistory`, `customerUserId`, `businessId`.
- `User` (read only): email, `language`.
- `Business` (read only): name, contact data, `timeZone`, currency, reminder settings (KAN-100).
- `Reminder`: scheduled Cloud Function, no stored entity (`domain-glossary` §3).
- No new fields are specified. How "already sent" is tracked to avoid duplicates is an implementation detail (AS-6).

## Acceptance criteria

### KAN-164 — Receive a confirmation email when I book
- [ ] **AC-KAN-164-01** · happy · Given a `customer` creates a booking that is stored as `confirmed`, when the booking is written, then one email is sent to their account email with the business name, service name, date, start and end time in the business `timeZone`, the price from `serviceSnapshot.priceInCents` in the business currency and the business's booking policy summary, using `customer:notifications.bookingConfirmed.*` in the recipient's `User.language`. [KAN-164]
- [ ] **AC-KAN-164-02** · happy · Given a booking stored as `pending` (manual confirmation, KAN-70), when it is written, then one email `customer:notifications.bookingReceived.*` is sent saying the business still has to confirm it; when the subscriber later confirms it (`pending` → `confirmed`), one `customer:notifications.bookingConfirmed.*` email is sent. [KAN-164, KAN-70]
- [ ] **AC-KAN-164-03** · edge · Given a subscriber creates a booking manually (KAN-69) for a `Customer` linked to an account, when the booking is written, then the customer receives the same email as in AC-KAN-164-01 / 02. See AS-2. [KAN-164, KAN-69]
- [ ] **AC-KAN-164-04** · edge · Given a recipient whose `User.language` is missing or not `es` / `en`, when the email is built, then it is sent in Spanish (`es`, the default). [KAN-164]
- [ ] **AC-KAN-164-05** · error · Given the email provider fails, when the function sends the email, then the booking is not affected, the failure is logged, and the send is retried; after the retries are exhausted no duplicate emails reach the customer. See AS-5. [KAN-164]
- [ ] **AC-KAN-164-06** · error · Given the booking has no `customerUserId`, or the account has no email, when the booking is written, then no email is sent and the function ends without error. [KAN-164]

### KAN-165 — Receive reminders before a booking
- [ ] **AC-KAN-165-01** · happy · Given a `confirmed` booking at a business with reminders enabled (KAN-100), when the scheduled function runs and the configured time before `startsAt` is reached, then one reminder email `customer:notifications.bookingReminder.*` is sent with business, service, date and time in the business `timeZone`, and a link to the booking in "My bookings". See AS-3, AS-4. [KAN-165, KAN-100]
- [ ] **AC-KAN-165-02** · edge · Given the booking was `cancelled`, or is `pending` at reminder time, when the scheduled function runs, then no reminder is sent. See AS-3. [KAN-165]
- [ ] **AC-KAN-165-03** · edge · Given a booking was rescheduled after its reminder was sent, when the new reminder time is reached, then a reminder is sent for the new time; the old time never gets a reminder. [KAN-165, KAN-158]
- [ ] **AC-KAN-165-04** · edge · Given a booking created after its reminder time had already passed (for example, booked 1 hour before with a 24-hour reminder), when the scheduled function runs, then no late reminder is sent. See AS-4. [KAN-165]
- [ ] **AC-KAN-165-05** · edge · Given the scheduled function runs twice over the same window (retry or overlap), when it processes the same booking, then only one reminder is sent. See AS-6. [KAN-165]
- [ ] **AC-KAN-165-06** · error · Given a business with reminders disabled, or a business that is `inactive` or `suspended`, when the scheduled function runs, then no reminder is sent for its bookings. See AS-7. [KAN-165, KAN-100, KAN-49]
- [ ] **AC-KAN-165-07** · error · Given the email provider fails for one booking, when the scheduled function runs, then reminders for the other bookings are still sent and the failed one is retried within its window. [KAN-165]

### KAN-166 — Receive a notification when a booking is rescheduled
- [ ] **AC-KAN-166-01** · happy · Given a `pending` or `confirmed` booking whose `startsAt` / `endsAt` change (by the customer, KAN-158, or by the business, KAN-71), when the change is written, then one email `customer:notifications.bookingRescheduled.*` is sent showing the previous and the new date and time in the business `timeZone`. [KAN-166]
- [ ] **AC-KAN-166-02** · edge · Given the business rescheduled the booking, when the email is built, then it states the change was made by the business and includes the business's contact data. See AS-8. [KAN-166, KAN-71]
- [ ] **AC-KAN-166-03** · edge · Given a booking update that changes neither `startsAt` nor `endsAt` (for example, `pending` → `confirmed`), when it is written, then no reschedule email is sent. [KAN-166]
- [ ] **AC-KAN-166-04** · error · Given the email provider fails, when the reschedule email is sent, then the booking change stays saved, the failure is logged and the email is retried without duplicates. See AS-5. [KAN-166]

### KAN-167 — Receive a notification when a booking is cancelled
- [ ] **AC-KAN-167-01** · happy · Given a `pending` or `confirmed` booking moves to `cancelled`, when the change is written, then one email `customer:notifications.bookingCancelled.*` is sent with business, service, the cancelled date and time in the business `timeZone`, who cancelled it (`cancelledBy`) and whether it was penalized (`isPenalized`). [KAN-167, KAN-72, KAN-159]
- [ ] **AC-KAN-167-02** · edge · Given the business cancelled the booking with a `note`, when the email is built, then the note is not included. See AS-8. [KAN-167, KAN-72]
- [ ] **AC-KAN-167-03** · edge · Given a booking moves to `completed` or `no_show`, when the change is written, then no cancellation email is sent. [KAN-167]
- [ ] **AC-KAN-167-04** · error · Given the email provider fails, when the cancellation email is sent, then the cancellation stays saved, the failure is logged and the email is retried without duplicates. See AS-5. [KAN-167]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| — | — | No story of this epic is blocked. |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | Emails are the only channel for this epic; "notificación" in KAN-166 / KAN-167 means email. | AC-KAN-166-01, AC-KAN-167-01 |
| AS-2 | Emails go only to customers with an account (`customerUserId` set), to the account email. `Customer` records without an account get no email. | AC-KAN-164-03, AC-KAN-164-06 |
| AS-3 | Reminders are sent only for `confirmed` bookings. | AC-KAN-165-01, AC-KAN-165-02 |
| AS-4 | When and how many reminders are sent comes from the business's reminder settings (KAN-100); default when not configured: one reminder 24 hours before `startsAt`. No late reminders. | AC-KAN-165-01, AC-KAN-165-04 |
| AS-5 | Failed sends are retried by the function up to 3 times; each email is sent at most once per event. | AC-KAN-164-05, AC-KAN-166-04, AC-KAN-167-04 |
| AS-6 | The functions record which emails were already sent per booking and event, so retries and overlapping runs do not duplicate them. | AC-KAN-165-05 |
| AS-7 | No reminders are sent while the business is `inactive` or `suspended`; confirmation, reschedule and cancellation emails still are. | AC-KAN-165-06 |
| AS-8 | Emails never include the business's cancellation `note` (it may be internal); a business-made change includes the business's contact data so the customer can ask. | AC-KAN-166-02, AC-KAN-167-02 |
| AS-9 | Until a customer opt-in exists, every customer with an account receives reminders when their business enabled them (see Backlog issues). | AC-KAN-165-01 |

## Backlog issues
- KAN-100 (business epic KAN-99) says reminders go out "si el cliente habilitó el recordatorio", but no customer story (including the profile epic KAN-168) defines that opt-in. AS-9 applies until a story exists.
- KAN-166 / KAN-167 overlap with KAN-162 (on-screen confirmation in KAN-155); the screen is specified in `booking-changes`, emails here.
- KAN-164 does not say what happens for bookings that need manual confirmation (KAN-70); this spec sends a "received" email and a "confirmed" email (AC-KAN-164-02).
- The epic sits in the customer portal but has no UI; its folder is `functions/src/notifications` (`epic-map.md`).

## Non-functional
- i18n keys: new prefix `customer:notifications.*` (`bookingConfirmed.*`, `bookingReceived.*`, `bookingReminder.*`, `bookingRescheduled.*`, `bookingCancelled.*`), stored in `functions/src/notifications/locales/{es,en}/` (`i18n-standards` §1); both languages required.
- Emails are sent only by functions triggered by `Booking` writes or by the scheduled reminder function (`api-mutation-standards` §1). No email address or content is exposed to the client.
- Dates and times in the business `timeZone` (never the server's); money from `priceInCents` in the business currency, formatted with `Intl` in the recipient's language.
- No pagination, export, reCAPTCHA or idle-timeout requirements apply (no UI).
- Accessibility: emails have a plain-text part, a meaningful subject, real text (not images) for all booking data, and sufficient contrast.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-164 | AC-KAN-164-01 … AC-KAN-164-06 | `functions/src/notifications/tests/onBookingCreated.test.ts`, `functions/src/notifications/tests/onBookingUpdated.test.ts` |
| KAN-165 | AC-KAN-165-01 … AC-KAN-165-07 | `functions/src/notifications/tests/sendBookingReminders.test.ts` |
| KAN-166 | AC-KAN-166-01 … AC-KAN-166-04 | `functions/src/notifications/tests/onBookingUpdated.test.ts` |
| KAN-167 | AC-KAN-167-01 … AC-KAN-167-04 | `functions/src/notifications/tests/onBookingUpdated.test.ts` |
