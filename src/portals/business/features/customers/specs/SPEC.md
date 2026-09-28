# Customer management (KAN-87)

| Field | Value |
| --- | --- |
| Portal | business |
| Feature folder | `src/portals/business/features/customers/` |
| Stories | KAN-88, KAN-89, KAN-90, KAN-91, KAN-92, KAN-93, KAN-94, KAN-95, KAN-97, KAN-98 |
| Status | Draft |
| Depends on | KAN-63 schedule (bookings, KAN-69 manual booking, KAN-73/KAN-74 statuses); KAN-145 booking checkout (enforces blocking); KAN-122 customer sign-up (invitation target); KAN-32 subscription (KAN-49 read-only); KAN-28 auth; Q4 decided 2026-09-28 (the invitation link goes to the customer sign-up under the business's `/<businessSlug>`) |

## Intent
For the subscriber who needs one place to know and look after the people who book with their business. They can add customers without an account, find them quickly, see each one's history and metrics, keep private notes, block or unblock them for their own business, invite them to create an account, and delete or anonymize a record, always without touching the customer's platform account or other businesses.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own business only) | Create, list, search, view, edit, note, block, unblock, invite, delete and anonymize the `Customer` records of their own business. Writes are rejected while the business is `inactive` or `suspended` (KAN-49); reads stay available. |
| customer | Nothing in this epic. Is affected by blocking (cannot book with that business) and receives the invitation email. |
| super admin | Nothing in this epic. |

The business always comes from the signed-in subscriber's session, never from the URL. A `Customer` of another business is never listed, shown or changed.

## In scope
- `Customer` records under `businesses/{businessId}/customers/{customerId}`, with or without a linked `User` (`userId` `Nullable`).
- Customer list with server pagination, search and status filter.
- Customer profile: basic data, booking history with this business, metrics.
- Private internal notes.
- Block / unblock with a mandatory note (`active` ↔ `blocked`).
- Hard delete of records without bookings; anonymization of a registered customer's data in this business.
- Sign-up invitation email to a customer without an account.

## Out of scope
- The customer's `User` account and profile (KAN-168). Nothing here changes a `User`.
- Creating bookings for a customer (KAN-69, KAN-63 spec).
- How the customer portal shows the "blocked" refusal (KAN-145 spec); only the effect is stated here.
- Collaborator data of any kind (Q1).
- Export of the customer list (no story asks for it).

## Data
- `Customer` (`domain-glossary` §3), `Customer` status machine `active` ↔ `blocked`, both directions require a `note` (§4.5).
- `Booking` (read only here): `customerId`, `status`, `startsAt`, `serviceSnapshot` (§3, §4.1).
- `User` (read only here): only to know whether `userId` is set.
- Fields this spec needs on `Customer` (proposed names, to confirm in review; none relates to an open question):
  - `name`, `phone`, `email` (`Nullable`), `searchName` (normalized name, `api-query-standards` §6), `status`, `userId` (`Nullable`), `createdAt`.
  - `statusHistory`: list of `{ status, note, changedAt }` for block / unblock (KAN-93, KAN-94).
  - `invitedAt` (`Nullable`) for the last sign-up invitation (KAN-97).
  - `anonymizedAt` (`Nullable`) (KAN-98).
- Internal notes (KAN-92): new sub-collection `businesses/{businessId}/customers/{customerId}/notes/{noteId}` with `text`, `createdAt` (proposed; see AS-5).

## Acceptance criteria

### KAN-88 — Register a customer with minimal data (name and phone, no account needed)
- [ ] **AC-KAN-88-01** · happy · Given a subscriber of an `active` business, when they enter a name and a phone and save, then a `Customer` with status `active` and `userId` empty is created in their business and appears in the customer list. [KAN-88]
- [ ] **AC-KAN-88-02** · error · Given the name or the phone is empty, when the subscriber saves, then nothing is created and `validation:required` is shown next to each empty field. [KAN-88]
- [ ] **AC-KAN-88-03** · error · Given a phone that does not match the accepted format, or a name longer than the limit, when the subscriber saves, then nothing is created and `validation:outOfRange` or `validation:tooLong` is shown. See AS-1. [KAN-88]
- [ ] **AC-KAN-88-04** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to register a customer, then nothing is created and `business:errors.readOnly` is shown. [KAN-88, KAN-49]
- [ ] **AC-KAN-88-05** · error · Given the request fails because of the network, when the subscriber saves, then no customer is created, the form keeps the entered data and `common:errors.network` is shown. [KAN-88]
- [ ] **AC-KAN-88-06** · edge · Given a `Customer` of the same business already has that phone, when the subscriber saves, then the record is not created and `business:customers.create.duplicatePhoneError` is shown with a way to open the existing record. See AS-2. [KAN-88]

### KAN-89 — List customers, paginated, with search and filters
- [ ] **AC-KAN-89-01** · happy · Given a business with more customers than one page, when the subscriber opens the customer list, then the first page is shown with each customer's name, phone, email and status badge, plus the total count and next/previous controls; only customers of their own business appear. [KAN-89]
- [ ] **AC-KAN-89-02** · happy · Given the list, when the subscriber types a search term, then only customers whose name starts with the term (ignoring case and accents), or whose email or phone matches it, are shown, and pagination restarts at page 1. See AS-3. [KAN-89]
- [ ] **AC-KAN-89-03** · happy · Given the list, when the subscriber filters by status `active` or `blocked`, then only customers with that status are shown and the total count reflects the filter. [KAN-89]
- [ ] **AC-KAN-89-04** · error · Given the list request fails, when the subscriber opens or changes the page, then the previous content is not replaced by wrong data and `common:errors.network` (or `common:errors.unknown` for other failures) is shown with a retry action. [KAN-89]
- [ ] **AC-KAN-89-05** · edge · Given the business has no customers, or the search/filter matches none, when the list loads, then an empty state `business:customers.list.empty` (or `business:customers.list.noResults`) is shown instead of a table. [KAN-89]
- [ ] **AC-KAN-89-06** · edge · Given an `inactive` or `suspended` business, when the subscriber opens the list, then the list is readable, a read-only notice `business:errors.readOnly` is shown and the create action is disabled. [KAN-89, KAN-49]

### KAN-90 — Customer profile with booking history and key metrics
- [ ] **AC-KAN-90-01** · happy · Given a customer of the subscriber's business, when the subscriber opens the profile, then it shows the basic data, status, whether the customer has an account, and the customer's bookings with this business (date and time in the business `timeZone`, service name and price from `serviceSnapshot` in the business currency, booking status). [KAN-90]
- [ ] **AC-KAN-90-02** · happy · Given the customer's bookings, when the profile loads, then the metrics show the total number of bookings, the number of `cancelled` bookings, the number of `no_show` bookings and the last visit date. See AS-4. [KAN-90]
- [ ] **AC-KAN-90-03** · error · Given a `customerId` that does not exist in the subscriber's business (including one from another business), when the profile is opened, then no data is shown and `common:errors.notFound` is shown. [KAN-90]
- [ ] **AC-KAN-90-04** · error · Given the profile request fails because of the network, when it loads, then `common:errors.network` is shown with a retry action. [KAN-90]
- [ ] **AC-KAN-90-05** · edge · Given a customer with no bookings, when the profile loads, then the history shows `business:customers.profile.noBookings`, the counters show 0 and the last visit shows `business:customers.profile.noVisits`. [KAN-90]
- [ ] **AC-KAN-90-06** · edge · Given a customer with more bookings than one page, when the history loads, then it is paginated on the server, newest first, while the metrics still count every booking. [KAN-90]

### KAN-91 — Edit a customer's basic data (name, phone, email)
- [ ] **AC-KAN-91-01** · happy · Given a customer of the subscriber's business, when the subscriber changes the name, phone or email and saves, then the `Customer` record shows the new values in the list and profile. [KAN-91]
- [ ] **AC-KAN-91-02** · happy · Given a customer with a linked account (`userId` set), when the subscriber edits the data, then only this business's `Customer` record changes; the customer's `User` account and other businesses' records stay unchanged. See AS-6. [KAN-91]
- [ ] **AC-KAN-91-03** · error · Given an empty name or phone, or an invalid email, when the subscriber saves, then nothing changes and `validation:required` or `validation:emailInvalid` is shown. [KAN-91]
- [ ] **AC-KAN-91-04** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to save, then nothing changes and `business:errors.readOnly` is shown. [KAN-91, KAN-49]
- [ ] **AC-KAN-91-05** · error · Given the request fails because of the network, when the subscriber saves, then the record keeps its previous values and `common:errors.network` is shown. [KAN-91]
- [ ] **AC-KAN-91-06** · edge · Given an anonymized customer (KAN-98), when the subscriber opens it, then the edit action is not available. [KAN-91, KAN-98]

### KAN-92 — Private internal notes about a customer
- [ ] **AC-KAN-92-01** · happy · Given a customer's profile, when the subscriber writes a note and saves, then the note appears in the profile with its date and time in the business `timeZone`, newest first. [KAN-92]
- [ ] **AC-KAN-92-02** · happy · Given notes exist for a customer, when the customer signs in to the customer portal or another business views the same person, then those notes are never shown to them. [KAN-92]
- [ ] **AC-KAN-92-03** · error · Given an empty note or one longer than the limit, when the subscriber saves, then nothing is saved and `validation:required` or `validation:tooLong` is shown. See AS-7. [KAN-92]
- [ ] **AC-KAN-92-04** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to add a note, then nothing is saved and `business:errors.readOnly` is shown. [KAN-92, KAN-49]
- [ ] **AC-KAN-92-05** · error · Given the request fails because of the network, when the subscriber saves the note, then it is not added to the list and `common:errors.network` is shown with the text kept in the field. [KAN-92]

### KAN-93 — Block a customer (this business only), with a mandatory internal reason
- [ ] **AC-KAN-93-01** · happy · Given an `active` customer, when the subscriber blocks them with a note and confirms, then the status becomes `blocked`, the note and date are stored in the status history and the list shows the `blocked` badge. [KAN-93]
- [ ] **AC-KAN-93-02** · happy · Given a `blocked` customer with an account, when that customer tries to book with this business in the customer portal, then the booking is not created; the same customer can still book with other businesses and their account keeps working. [KAN-93, KAN-145]
- [ ] **AC-KAN-93-03** · error · Given the note is empty, when the subscriber confirms the block, then the status does not change and `validation:required` is shown. [KAN-93]
- [ ] **AC-KAN-93-04** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to block a customer, then the status does not change and `business:errors.readOnly` is shown. [KAN-93, KAN-49]
- [ ] **AC-KAN-93-05** · error · Given the request fails because of the network, when the subscriber confirms, then the customer stays `active` and `common:errors.network` is shown. [KAN-93]
- [ ] **AC-KAN-93-06** · edge · Given a customer is blocked, when the customer is refused a booking, then the internal note is never shown to the customer. See AS-8. [KAN-93]
- [ ] **AC-KAN-93-07** · edge · Given the customer has `pending` or `confirmed` future bookings, when they are blocked, then those bookings are kept unchanged. See AS-9. [KAN-93]

### KAN-94 — Unblock a customer, with a short note
- [ ] **AC-KAN-94-01** · happy · Given a `blocked` customer, when the subscriber unblocks them with a note and confirms, then the status becomes `active`, the note and date are added to the status history and the customer can book with this business again. [KAN-94]
- [ ] **AC-KAN-94-02** · error · Given the note is empty, when the subscriber confirms, then the status does not change and `validation:required` is shown. [KAN-94]
- [ ] **AC-KAN-94-03** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to unblock, then the status does not change and `business:errors.readOnly` is shown. [KAN-94, KAN-49]
- [ ] **AC-KAN-94-04** · error · Given the request fails because of the network, when the subscriber confirms, then the customer stays `blocked` and `common:errors.network` is shown. [KAN-94]
- [ ] **AC-KAN-94-05** · edge · Given a customer who has been blocked and unblocked several times, when the profile is opened, then every change is shown in the status history with its note and date. [KAN-93, KAN-94]

### KAN-95 — Delete a customer record without bookings (or created by mistake)
- [ ] **AC-KAN-95-01** · happy · Given a customer with no bookings in the business, when the subscriber deletes them and confirms, then the record and its internal notes are removed and the customer no longer appears in the list or search. [KAN-95]
- [ ] **AC-KAN-95-02** · error · Given a customer with at least one booking in any status, when the subscriber tries to delete them, then nothing is deleted and `business:customers.delete.hasBookingsError` is shown, pointing to anonymization (KAN-98) instead. [KAN-95]
- [ ] **AC-KAN-95-03** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to delete, then nothing is deleted and `business:errors.readOnly` is shown. [KAN-95, KAN-49]
- [ ] **AC-KAN-95-04** · error · Given the request fails because of the network, when the subscriber confirms, then the record stays and `common:errors.network` is shown. [KAN-95]
- [ ] **AC-KAN-95-05** · edge · Given a customer with a linked account, when their record is deleted, then the `User` account and the customer's records in other businesses are unchanged. [KAN-95]
- [ ] **AC-KAN-95-06** · edge · Given the confirmation dialog is open, when the subscriber cancels it, then nothing is deleted. [KAN-95]

### KAN-97 — Invite a customer to complete a formal sign-up
- [ ] **AC-KAN-97-01** · happy · Given a customer without an account (`userId` empty) that has an email, when the subscriber sends the invitation, then an email in the language of the business is sent with a link to the customer sign-up (KAN-122), `invitedAt` is updated and `business:customers.invite.sent` is shown. See AS-10. [KAN-97]
- [ ] **AC-KAN-97-02** · happy · Given an invited customer, when they finish sign-up through the invitation, then this business's `Customer` record is linked to the new account and the profile shows that the customer has an account. See AS-11. [KAN-97, KAN-122]
- [ ] **AC-KAN-97-03** · error · Given a customer without an email, when the subscriber tries to invite them, then no email is sent and `business:customers.invite.emailRequiredError` is shown with a way to edit the customer. [KAN-97]
- [ ] **AC-KAN-97-04** · error · Given a customer who already has an account, when the subscriber opens the profile, then the invite action is not available; if a request is still sent, it is rejected with `business:customers.invite.alreadyRegisteredError`. [KAN-97]
- [ ] **AC-KAN-97-05** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to invite, then no email is sent and `business:errors.readOnly` is shown. [KAN-97, KAN-49]
- [ ] **AC-KAN-97-06** · error · Given the email cannot be sent (network or server failure), when the subscriber invites, then `invitedAt` does not change and `common:errors.network` or `common:errors.unknown` is shown. [KAN-97]
- [ ] **AC-KAN-97-07** · edge · Given an invitation was sent recently, when the subscriber sends it again within the waiting time, then no email is sent and `business:customers.invite.tooSoonError` is shown. See AS-12. [KAN-97]
- [ ] **AC-KAN-97-08** · edge · Given a `blocked` customer, when the subscriber opens the profile, then the invite action is not available. See AS-13. [KAN-97, KAN-93]
- [ ] **AC-KAN-97-09** · edge · Given an invitation email, when the customer opens its link, then the customer sign-up opens under the business's slug (`/<businessSlug>/...`) and, after sign-up and sign-in, they land on that business's pages (KAN-127). [KAN-97, KAN-127]

### KAN-98 — Delete or anonymize a registered customer's data on request
- [ ] **AC-KAN-98-01** · happy · Given a customer with bookings in the business, when the subscriber anonymizes them and confirms, then the name, phone, email, internal notes and status notes are removed from this business's record, the record shows `business:customers.anonymized.label` in lists and bookings, `anonymizedAt` is set and the bookings are kept so reports and metrics still count them. [KAN-98]
- [ ] **AC-KAN-98-02** · happy · Given a registered customer (`userId` set) is anonymized, when the process ends, then their `User` account, their sign-in and their records in other businesses are unchanged, and this business's record is no longer linked to the account. See AS-14. [KAN-98]
- [ ] **AC-KAN-98-03** · happy · Given a registered customer with no bookings in the business, when the subscriber chooses to delete instead of anonymize, then the record is deleted as in KAN-95. [KAN-98, KAN-95]
- [ ] **AC-KAN-98-04** · error · Given the customer has `pending` or `confirmed` future bookings, when the subscriber tries to anonymize, then nothing changes and `business:customers.anonymize.hasUpcomingBookingsError` is shown. See AS-15. [KAN-98]
- [ ] **AC-KAN-98-05** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to anonymize, then nothing changes and `business:errors.readOnly` is shown. [KAN-98, KAN-49]
- [ ] **AC-KAN-98-06** · error · Given the request fails, when the subscriber confirms, then either every field is anonymized or none is (never a partial result), and `common:errors.network` or `common:errors.unknown` is shown. [KAN-98]
- [ ] **AC-KAN-98-07** · edge · Given an anonymized record, when the subscriber searches by the old name, phone or email, then it is not found; the anonymization cannot be undone. [KAN-98]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| — | — | No story of this epic depends on an open question. The URL form of the invitation link (KAN-97) follows Q4, decided on 2026-09-28 (AC-KAN-97-09). |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | Name: 2–80 characters. Phone: international format with 7–15 digits, optional leading `+`. | AC-KAN-88-03, AC-KAN-91-03 |
| AS-2 | The phone is unique among the `Customer` records of one business (not across businesses). | AC-KAN-88-06 |
| AS-3 | Name search is a prefix match on `searchName`; email and phone search are exact matches (Firestore has no full-text search). One search box serves all three. | AC-KAN-89-02 |
| AS-4 | "Total" counts bookings in every status; "last visit" is the `startsAt` of the latest `completed` booking. | AC-KAN-90-02 |
| AS-5 | Internal notes are a list of dated entries (not a single text field) and cannot be edited after saving; deletion of a note is not in the backlog. | AC-KAN-92-01 |
| AS-6 | When the customer has an account, the subscriber may still edit this business's copy of the data; the account data is owned by the customer (KAN-170) and is never overwritten. | AC-KAN-91-02 |
| AS-7 | A note is at most 1000 characters. | AC-KAN-92-03 |
| AS-8 | The customer portal shows a generic refusal without the reason (message owned by the KAN-145 spec). | AC-KAN-93-06 |
| AS-9 | Blocking only stops new bookings; existing future bookings are handled by the subscriber from the schedule (KAN-72). | AC-KAN-93-07 |
| AS-10 | The invitation is written in the business's language, since the customer has no `User.language` yet. | AC-KAN-97-01 |
| AS-11 | The link carries a single-use invitation that identifies the `Customer` record; signing up through it links `userId`. The link is valid for 7 days. | AC-KAN-97-02 |
| AS-12 | An invitation can be resent after 24 hours. | AC-KAN-97-07 |
| AS-13 | Blocked customers cannot be invited. | AC-KAN-97-08 |
| AS-14 | After anonymization, the customer's own "My bookings" (KAN-150) no longer shows bookings with this business. | AC-KAN-98-02 |
| AS-15 | Anonymization is refused while there are `pending` or `confirmed` future bookings; the subscriber cancels them first. | AC-KAN-98-04 |

## Backlog issues
- KAN-91 is unclear about registered customers: "…editar los datos básicos…; si el cliente ya tiene una cuenta registrada" is a fragment. It could mean "only if they have an account", "even if they have an account" or "not if they have an account". The spec lets the subscriber edit this business's copy in every case (AS-6); the team must confirm.
- KAN-95 (hard delete) and KAN-98 ("eliminar o anonimizar") overlap on deletion. The spec keeps delete for records without bookings (KAN-95) and anonymize for records with bookings (KAN-98).
- KAN-98 speaks only of registered customers; customers without an account (KAN-88) can also ask to be forgotten. The criteria do not depend on `userId`, except AC-KAN-98-02.
- KAN-97 overlaps KAN-122 (customer sign-up): the sign-up epic does not say how an invited person is linked to an existing `Customer` record (AS-11).
- KAN-93 needs enforcement in KAN-145 (booking checkout) and in the booking functions; that epic has no story for it.
- KAN-89 lists "correo, teléfono" as search/filter fields; they are treated as search, and status as the only filter.
- Key KAN-96 is not in this epic (it is the Navbar epic); the gap in numbering is not a missing story.
- Epic name is "Gestion Clientes" in the CSV (missing accent) and "Clientes" in `epic-map.md`.

## Non-functional
- New i18n key prefixes: `business:customers.create.*`, `business:customers.list.*`, `business:customers.profile.*`, `business:customers.edit.*`, `business:customers.notes.*`, `business:customers.block.*`, `business:customers.unblock.*`, `business:customers.delete.*`, `business:customers.invite.*`, `business:customers.anonymize.*`, `business:customers.anonymized.*`. Invitation email texts live in `functions/src/notifications/locales/{en,es}/`.
- Pagination: cursor pagination on the server for the list and the booking history (`api-query-standards` §5), page size from `PAGINATION`, `totalCount` from the same filtered query. Search uses `searchName`; every new `where` + `orderBy` adds its index.
- Writes: rejected by `firestore.rules` for other businesses and for `inactive`/`suspended` businesses; the UI shows `business:errors.readOnly` and disables create actions. Anonymization and invitation run in callable functions (they touch more than one document or send email).
- Session: idle logout after `PlatformSettings.idleTimeoutMinutes` (KAN-182) applies to every screen.
- Dates and times in the business `timeZone`; prices from `serviceSnapshot.priceInCents` in the business currency.
- Accessibility: block, unblock, delete and anonymize use a confirmation dialog with focus moved to it; status badges carry text, not colour only; form errors are linked to their field.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-88 | AC-KAN-88-01 … AC-KAN-88-06 | `tests/CustomerFormScreen.test.tsx` |
| KAN-89 | AC-KAN-89-01 … AC-KAN-89-06 | `tests/CustomerListScreen.test.tsx` |
| KAN-90 | AC-KAN-90-01 … AC-KAN-90-06 | `tests/CustomerProfileScreen.test.tsx` |
| KAN-91 | AC-KAN-91-01 … AC-KAN-91-06 | `tests/CustomerFormScreen.test.tsx` |
| KAN-92 | AC-KAN-92-01 … AC-KAN-92-05 | `tests/CustomerProfileScreen.test.tsx` |
| KAN-93 | AC-KAN-93-01 … AC-KAN-93-07 | `tests/CustomerProfileScreen.test.tsx` |
| KAN-94 | AC-KAN-94-01 … AC-KAN-94-05 | `tests/CustomerProfileScreen.test.tsx` |
| KAN-95 | AC-KAN-95-01 … AC-KAN-95-06 | `tests/CustomerProfileScreen.test.tsx` |
| KAN-97 | AC-KAN-97-01 … AC-KAN-97-09 | `tests/CustomerProfileScreen.test.tsx`, `functions/src/customers/tests/inviteCustomer.test.ts` |
| KAN-98 | AC-KAN-98-01 … AC-KAN-98-07 | `tests/CustomerProfileScreen.test.tsx`, `functions/src/customers/tests/anonymizeCustomer.test.ts` |
