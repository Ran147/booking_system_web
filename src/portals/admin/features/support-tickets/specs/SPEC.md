# Support and inquiries (ticketing) (KAN-189)

| Field | Value |
| --- | --- |
| Portal | admin |
| Feature folder | `src/portals/admin/features/support-tickets/` |
| Stories | KAN-190, KAN-191, KAN-192 |
| Status | Draft |
| Depends on | A subscriber-side story to create tickets (missing, see Backlog issues); KAN-174 businesses spec (business profile link); email sending in `functions/` |

## Intent
Business owners raise support tickets and the super admin handles them from the admin portal: sees them all with their status, answers by email and marks them resolved when done. The owner gets the answer in their inbox and the platform keeps a record of each ticket's state.

## Actors and permissions
| Actor | Can |
| --- | --- |
| super admin (`super_admin`) | List all `SupportTicket`s, read them, reply, resolve |
| subscriber | Create tickets and read their own (not specified here, see Backlog issues); never sees other businesses' tickets |
| customer, visitor | Nothing |

## In scope
- Paginated list of all tickets with status filter (KAN-190).
- Ticket detail with its message and reply history.
- Reply from the admin panel, sent to the business owner's email (KAN-191).
- Resolve a ticket (KAN-192).

## Out of scope
- Creating tickets and the subscriber's view of them (no story in the backlog).
- Reopening a ticket (the glossary has no transition out of `resolved`).
- Attachments, assignment to other admins, priorities, SLAs.
- Replies from the owner by email back into the ticket.
- Export and realtime updates.

## Data
- `SupportTicket` (`supportTickets/{supportTicketId}`, glossary §3, §4.4). Status: `open` → `in_progress` (super admin replies) → `resolved`; `open` → `resolved`. No other transitions.
- Proposed fields (new; to confirm): `businessId`, `createdByUserId`, `subject`, `message`, `status`, `createdAt`, `updatedAt`, `resolvedAt: Nullable<Date>`, and `replies: { body, sentAt, sentByUserId }[]` (or a `replies` subcollection, AS-6).
- `Business` (name) and `User` (owner email, from `Business.ownerUserId`) for display and email.

## Acceptance criteria

### KAN-190 — See a paginated list of all support tickets created by business owners, with their status (open, in progress, resolved)
- [ ] **AC-KAN-190-01** · happy · Given tickets from several businesses, when the super admin opens the tickets list, then they see the first page with subject, business name, creation date, last update and a `status` badge (`open`, `in_progress`, `resolved`), newest first (AS-1), with a total count and previous/next controls. [KAN-190]
- [ ] **AC-KAN-190-02** · happy · Given the list, when the super admin filters by one status, then only tickets with that status are listed, the count matches and pagination restarts at page 1; the filter is kept in the URL. [KAN-190]
- [ ] **AC-KAN-190-03** · happy · Given a ticket in the list, when the super admin selects it, then the ticket detail opens with the original message, the business, the owner email and all previous replies in order. [KAN-190]
- [ ] **AC-KAN-190-04** · edge · Given no ticket matches the filter (or none exists), when the list loads, then an empty state with `admin:supportTickets.list.empty` is shown. [KAN-190]
- [ ] **AC-KAN-190-05** · edge · Given a ticket whose business no longer has an owner email available, when it is listed, then it still appears and the detail shows `admin:supportTickets.detail.ownerUnavailable`. [KAN-190]
- [ ] **AC-KAN-190-06** · error · Given the request fails because of the network, when the list loads or changes page, then an error state with `common:errors.network` and a retry action is shown. [KAN-190]
- [ ] **AC-KAN-190-07** · error · Given a signed-in `subscriber`, when they try to read tickets of another business directly, then the read is rejected with `common:errors.permissionDenied`. [KAN-190]

### KAN-191 — Reply to a ticket from the panel, sending the reply to the business owner's email
- [ ] **AC-KAN-191-01** · happy · Given an `open` ticket, when the super admin writes a reply and sends it, then the reply is added to the ticket history with its date, an email with the reply and the ticket subject is sent to the owner's email (`Business.ownerUserId` → `User`), the status becomes `in_progress` and `admin:supportTickets.reply.success` is shown. [KAN-191]
- [ ] **AC-KAN-191-02** · happy · Given an `in_progress` ticket, when the super admin sends another reply, then it is added to the history and emailed, and the status stays `in_progress`. [KAN-191]
- [ ] **AC-KAN-191-03** · edge · Given a `resolved` ticket, when the super admin opens it, then the reply field is not offered, because there is no reopen transition (AS-2). [KAN-191]
- [ ] **AC-KAN-191-04** · error · Given an empty reply (or only spaces), when the super admin sends it, then nothing is sent and `validation:required` is shown. [KAN-191]
- [ ] **AC-KAN-191-05** · error · Given a reply longer than the limit in AS-3, when the super admin sends it, then nothing is sent and `validation:tooLong` is shown. [KAN-191]
- [ ] **AC-KAN-191-06** · error · Given the ticket was resolved in another session after the detail was opened, when the super admin sends a reply, then the reply is not saved or emailed and `admin:supportTickets.reply.alreadyResolvedError` is shown. [KAN-191]
- [ ] **AC-KAN-191-07** · error · Given the request fails because of the network, when the super admin sends, then no reply is added, the status does not change, the typed text is kept and `common:errors.network` is shown. [KAN-191]
- [ ] **AC-KAN-191-08** · error · Given the reply is saved but the email cannot be delivered, when the super admin sends it, then the reply stays in the history marked with `admin:supportTickets.reply.emailFailed` and can be re-sent (AS-4). [KAN-191]
- [ ] **AC-KAN-191-09** · edge · Given the super admin presses send twice quickly, when the first request is in flight, then send is disabled and only one reply and one email are produced. [KAN-191]

### KAN-192 — Close or mark a support ticket as resolved once it has been handled
- [ ] **AC-KAN-192-01** · happy · Given an `open` or `in_progress` ticket, when the super admin marks it as resolved and confirms, then its status becomes `resolved`, the resolution date is recorded, the list shows the new badge and `admin:supportTickets.resolve.success` is shown. [KAN-192]
- [ ] **AC-KAN-192-02** · happy · Given a `resolved` ticket, when the super admin opens it, then its history is still readable and no resolve or reply action is offered. [KAN-192]
- [ ] **AC-KAN-192-03** · edge · Given an `open` ticket with no reply, when it is resolved, then it moves straight to `resolved` (glossary: `open` → `resolved`). [KAN-192]
- [ ] **AC-KAN-192-04** · error · Given the ticket was already resolved in another session, when the super admin confirms, then nothing changes, `admin:supportTickets.resolve.alreadyResolvedError` is shown and the ticket reloads. [KAN-192]
- [ ] **AC-KAN-192-05** · error · Given the request fails because of the network, when the super admin confirms, then the ticket keeps its previous status and `common:errors.network` is shown. [KAN-192]
- [ ] **AC-KAN-192-06** · error · Given a caller without the `super_admin` role, when they try to change a ticket's status directly, then it is rejected with `common:errors.permissionDenied`. [KAN-192]

## BLOCKED
None. No story in this epic depends on Q1–Q7.

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | The list is sorted by creation date, newest first, with `PAGINATION.DEFAULT_PAGE_SIZE` rows; no search by text. | AC-KAN-190-01 |
| AS-2 | A `resolved` ticket accepts no more replies; the owner opens a new ticket instead. | AC-KAN-191-03, AC-KAN-192-02 |
| AS-3 | A reply is 1–5,000 characters of plain text. | AC-KAN-191-04, AC-KAN-191-05 |
| AS-4 | The reply is stored first and the email is sent by a Cloud Function; if sending fails, the reply is kept and marked, and the status change still applies. | AC-KAN-191-01, AC-KAN-191-08 |
| AS-5 | Resolving a ticket does not send an email to the owner. | AC-KAN-192-01 |
| AS-6 | Replies are stored with the ticket (array or subcollection, decided in design) and are visible to the owner in a future subscriber view. | Data |
| AS-7 | Emails are sent in the owner's `User.language`. | AC-KAN-191-01 |

## Backlog issues
- No story lets a subscriber create a support ticket or see its answers; KAN-190 assumes tickets "creados por los dueños de negocio". A business-portal story is needed (KAN-19 "sección de ayuda" in the landing is the closest, but it is for visitors).
- KAN-192 has a typo: "ticket de sport" = "ticket de soporte". "Cerrar" and "marcar como resuelto" are the same transition (`resolved`), as the glossary states.
- KAN-190 lists the statuses in Spanish (abierto, en proceso, resuelto); they map to `open`, `in_progress`, `resolved`.
- KAN-5 (landing contact form) is another inbound channel; it is not a `SupportTicket` and is not listed here.

## Non-functional
- i18n: new keys under `admin:supportTickets.list.*`, `admin:supportTickets.detail.*`, `admin:supportTickets.reply.*`, `admin:supportTickets.resolve.*`, `admin:supportTickets.status.*` (badge labels), and the reply email template keys under `admin:supportTickets.email.*`. Reused: `validation:required`, `validation:tooLong`, `common:errors.network`, `common:errors.permissionDenied`.
- Pagination: server-side cursor pagination with `totalCount`; the status filter lives in the URL; `status` + `createdAt` needs a composite index.
- Security: status changes and replies go through a Cloud Function that checks `super_admin` and the glossary transition; the email is sent only from the server.
- Idle logout applies (`PlatformSettings.idleTimeoutMinutes`, KAN-182).
- Accessibility: the reply field has a visible label and a character counter announced to screen readers; status badges carry text.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-190 | AC-KAN-190-01 … AC-KAN-190-06 | `tests/SupportTicketListScreen.test.tsx` |
| KAN-190 | AC-KAN-190-07 | `functions/src/rules/tests/supportTickets.rules.test.ts` |
| KAN-191 | AC-KAN-191-01 … AC-KAN-191-09 | `tests/SupportTicketDetailScreen.test.tsx` |
| KAN-191 | AC-KAN-191-01, AC-KAN-191-06, AC-KAN-191-08 | `functions/src/supportTickets/tests/replyToSupportTicket.test.ts` |
| KAN-192 | AC-KAN-192-01 … AC-KAN-192-05 | `tests/SupportTicketDetailScreen.test.tsx` |
| KAN-192 | AC-KAN-192-04, AC-KAN-192-06 | `functions/src/supportTickets/tests/resolveSupportTicket.test.ts` |
