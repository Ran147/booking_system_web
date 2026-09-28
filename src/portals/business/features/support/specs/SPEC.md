# Business support tickets (PROP-3)

| Field | Value |
| --- | --- |
| Portal | business |
| Feature folder | `src/portals/business/features/support/` |
| Stories | PROP-3 (proposed, not in Jira yet) |
| Status | Draft |
| Depends on | KAN-189 admin support tickets (`src/portals/admin/features/support-tickets` spec: replies KAN-191, resolve KAN-192); KAN-28 subscriber sign-in; KAN-32 subscription (KAN-49 read-only); `domain-glossary` §3 and §4.4 (`SupportTicket`) |

## Intent
A subscriber who has a problem with the platform opens a support ticket from the business portal, follows its status and reads the super admin's replies in one place. It is the missing subscriber side of the admin support epic (KAN-189), which assumes tickets "created by business owners" but has no story for creating them.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own business only) | Create tickets for their own business, list them, read each one with its replies. Never sees another business's tickets. |
| collaborator | Nothing: support is subscriber-only (collaborators spec AC-KAN-86-05). |
| super admin | Replies and resolves in the admin portal (KAN-191, KAN-192); not part of this spec. |
| customer, visitor | Nothing. |

## In scope
- Creating a ticket with a subject and a message.
- The list of the business's tickets with their status, paginated on the server.
- The ticket detail with the original message and the super admin's replies.

## Out of scope
- Replying from the business portal or by email into the ticket (the admin spec keeps replies one-way; AS-2).
- Reopening a `resolved` ticket (no transition out of `resolved`, glossary §4.4).
- Attachments, priorities, categories.
- The visitor help section and contact form of the landing (KAN-19, KAN-5), which are not `SupportTicket`s.

## Data
- `SupportTicket` (`supportTickets/{supportTicketId}`, glossary §3, §4.4): created `open`; the super admin moves it to `in_progress` and `resolved` (admin spec).
- Fields written at creation (proposed names, the same as the admin spec's Data, to confirm): `businessId` (from the session, never the form), `createdByUserId`, `subject`, `message`, `status` = `open`, `createdAt`, `updatedAt`, `resolvedAt` = `null`. Replies are read as the admin spec stores them (admin spec AS-6).
- Rules: a subscriber creates tickets only for their own business, with `status` `open` and no replies; reads only the tickets of their business; never updates or deletes a ticket.
- No new entity. `FIRESTORE_COLLECTION.SUPPORT_TICKETS` is added with the feature if it does not exist yet.

## Acceptance criteria

### PROP-3 — Subscriber creates a support ticket and sees its replies and status (Proposed — not in Jira yet)
- [ ] **AC-PROP-3-01** · happy · Given a signed-in subscriber, when they fill in a subject and a message and send them, then one `SupportTicket` is created for their business with `status` `open`, `business:support.create.success` is shown and the new ticket is first in their list. See AS-1. [PROP-3]
- [ ] **AC-PROP-3-02** · happy · Given a business with tickets, when the subscriber opens the support section, then they see one page of their own tickets, newest first, each with subject, creation date, last update (business `timeZone`) and a status badge (`open`, `in_progress`, `resolved`), with the total count. See AS-3. [PROP-3]
- [ ] **AC-PROP-3-03** · happy · Given a ticket the super admin has replied to (KAN-191), when the subscriber opens it, then the detail shows the original message and every reply in order with its date, and the current status. [PROP-3, KAN-191]
- [ ] **AC-PROP-3-04** · error · Given an empty subject or message (or only spaces), when the subscriber sends, then nothing is created and `validation:required` is shown next to the field. [PROP-3]
- [ ] **AC-PROP-3-05** · error · Given a subject or a message longer than the limits of AS-1, when the subscriber sends, then nothing is created and `validation:tooLong` is shown next to the field. See AS-1. [PROP-3]
- [ ] **AC-PROP-3-06** · error · Given the request fails because of the network, when the subscriber sends, then no ticket is created, the typed text is kept and `common:errors.network` is shown. [PROP-3]
- [ ] **AC-PROP-3-07** · error · Given a signed-in subscriber, when they try to read a ticket of another business or create one with another `businessId` directly, then the server rejects it with `common:errors.permissionDenied`. [PROP-3]
- [ ] **AC-PROP-3-08** · edge · Given a business with no tickets, when the subscriber opens the support section, then `business:support.list.empty` is shown with the action to create a ticket. [PROP-3]
- [ ] **AC-PROP-3-09** · edge · Given a business that is `inactive` or `suspended`, when the subscriber opens the support section, then they can still read and create tickets (the read-only rule of KAN-49 does not apply). See AS-4. [PROP-3, KAN-49]
- [ ] **AC-PROP-3-10** · edge · Given the subscriber presses send twice quickly, when the first request is in flight, then send is disabled and only one ticket is created. [PROP-3]

## BLOCKED
None.

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | A subject is 1–120 characters and a message 1–5,000 characters of plain text (the same message limit as an admin reply, admin spec AS-3). | AC-PROP-3-01, AC-PROP-3-05 |
| AS-2 | Communication is one-way inside the platform: the subscriber writes the first message, the super admin replies by email and in the ticket; to add information the subscriber opens a new ticket. | Out of scope |
| AS-3 | The list uses server cursor pagination with `PAGINATION.DEFAULT_PAGE_SIZE`, newest first, with no filter. | AC-PROP-3-02 |
| AS-4 | A read-only or suspended business can still ask for support, because support is how it reaches the platform about its situation. | AC-PROP-3-09 |

## Backlog issues
- PROP-3 is proposed, not in Jira yet (`docs/decisions/open-questions.md`). It must be created in Jira (epic: a business-portal support epic, or under KAN-189) before it is implemented; then its KAN key is added next to PROP-3.
- KAN-190 assumes tickets "creados por los dueños de negocio" without a story that creates them; this spec is that story.

## Non-functional
- i18n keys (new prefixes): `business:support.create.*`, `business:support.list.*`, `business:support.detail.*`. Status badge labels are shared with `admin:supportTickets.status.*` values through `common` status labels. Reused: `validation:required`, `validation:tooLong`, `common:errors.network`, `common:errors.permissionDenied`.
- Creation is a direct Firestore write that the rules fully validate (`api-mutation-standards` §1); `businessId` comes from `useCurrentBusiness()`.
- Pagination: server-side cursors with `totalCount`; a composite index on `businessId` + `createdAt`. No realtime (the detail reloads on open).
- Private page: `RequireRole` for `subscriber`; idle logout after `PlatformSettings.idleTimeoutMinutes` (KAN-38). No reCAPTCHA (authenticated form).
- Accessibility: the form fields have visible labels and character counters announced to screen readers; status badges carry text, not colour only; the replies are an ordered list.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| PROP-3 | AC-PROP-3-01, AC-PROP-3-04 … AC-PROP-3-06, AC-PROP-3-10 | `tests/CreateSupportTicketForm.test.tsx` |
| PROP-3 | AC-PROP-3-02, AC-PROP-3-03, AC-PROP-3-08, AC-PROP-3-09 | `tests/SupportTicketsPage.test.tsx` |
| PROP-3 | AC-PROP-3-07 | `tests/rules/supportTickets.rules.test.ts` |
