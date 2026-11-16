# Business support tickets (KAN-202 / PROP-3)

| Field | Value |
| --- | --- |
| Portal | business |
| Feature folder | `src/modules/business/features/support/` |
| Stories | KAN-202 (Jira: "Como suscriptor quiero crear un ticket de soporte y ver su estado y respuesta"; previously PROP-3) |
| Epic | KAN-197 / KAN-198 ([Negocio] Soporte) |
| Status | Approved for Implementation |
| Depends on | KAN-189 admin support tickets (`src/modules/admin/features/support-tickets` spec: replies KAN-191, resolve KAN-192); KAN-28 subscriber sign-in; KAN-32 subscription (KAN-49 read-only); `domain-glossary` §3 and §4.4 (`SupportTicket`) |

## Intent
A subscriber who has a problem with the platform opens a support ticket from the business portal, follows its status and reads the super admin's replies in one place. It is the business side of the ticketing system, connecting subscriber requests with super admin resolutions.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own business only) | Create tickets for their own business, list them, read each one with its replies. Never sees another business's tickets. |
| collaborator | Nothing: support is subscriber-only (collaborators spec AC-KAN-86-05). |
| super admin | Replies and resolves in the admin portal (KAN-191, KAN-192); not part of this spec. |
| customer, visitor | Nothing. |

## In scope
- Creating a ticket with a subject and a message.
- The list of the business's tickets with their status, ordered newest first.
- The ticket detail with the original message and the super admin's replies.

## Out of scope
- Replying from the business portal or by email into the ticket (the admin spec keeps replies one-way; AS-2).
- Reopening a `resolved` ticket (no transition out of `resolved`, glossary §4.4).
- Attachments, priorities, categories.
- The visitor help section and contact form of the landing (KAN-19, KAN-5), which are not `SupportTicket`s.

## Data
- `SupportTicket` (`supportTickets/{supportTicketId}`, glossary §3, §4.4): created `open`; the super admin moves it to `in_progress` and `resolved` (admin spec).
- Fields written at creation: `businessId` (from the authenticated session, never the form), `createdByUserId`, `subject`, `message`, `status` = `open`, `createdAt`, `updatedAt`, `resolvedAt` = `null`, `replies` = `[]`.
- Rules: a subscriber creates tickets only for their own business, with `status` `open` and no replies; reads only the tickets of their business; never updates or deletes a ticket directly.

## Acceptance criteria

### KAN-202 — Subscriber creates a support ticket and sees its replies and status (KAN-202 / PROP-3)
- [ ] **AC-KAN-202-01** · happy · Given a signed-in subscriber, when they fill in a subject and a message and send them, then one `SupportTicket` is created for their business with `status` `open`, `business:support.create.success` is shown and the new ticket is first in their list. See AS-1. [KAN-202, PROP-3]
- [ ] **AC-KAN-202-02** · happy · Given a business with tickets, when the subscriber opens the support section, then they see their own tickets, newest first, each with subject, creation date, last update (business `timeZone`) and a status badge (`open`, `in_progress`, `resolved`), with the total count. See AS-3. [KAN-202, PROP-3]
- [ ] **AC-KAN-202-03** · happy · Given a ticket the super admin has replied to (KAN-191), when the subscriber opens it, then the detail shows the original message and every reply in order with its date, and the current status. [KAN-202, PROP-3, KAN-191]
- [ ] **AC-KAN-202-04** · error · Given an empty subject or message (or only spaces), when the subscriber sends, then nothing is created and `validation:required` is shown next to the field. [KAN-202, PROP-3]
- [ ] **AC-KAN-202-05** · error · Given a subject or a message longer than the limits of AS-1, when the subscriber sends, then nothing is created and `validation:tooLong` is shown next to the field. See AS-1. [KAN-202, PROP-3]
- [ ] **AC-KAN-202-06** · error · Given the request fails because of the network, when the subscriber sends, then no ticket is created, the typed text is kept and `common:errors.network` is shown. [KAN-202, PROP-3]
- [ ] **AC-KAN-202-07** · error · Given a signed-in subscriber, when they try to read a ticket of another business or create one with another `businessId` directly, then the server rejects it with `common:errors.permissionDenied`. [KAN-202, PROP-3]
- [ ] **AC-KAN-202-08** · edge · Given a business with no tickets, when the subscriber opens the support section, then `business:support.list.empty` is shown with the action to create a ticket. [KAN-202, PROP-3]
- [ ] **AC-KAN-202-09** · edge · Given a business that is `inactive` or `suspended`, when the subscriber opens the support section, then they can still read and create tickets (the read-only rule of KAN-49 does not apply). See AS-4. [KAN-202, PROP-3, KAN-49]
- [ ] **AC-KAN-202-10** · edge · Given the subscriber presses send twice quickly, when the first request is in flight, then send is disabled and only one ticket is created. [KAN-202, PROP-3]

## BLOCKED
None.

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | A subject is 1–120 characters and a message 1–5,000 characters of plain text (the same message limit as an admin reply, admin spec AS-3). | AC-KAN-202-01, AC-KAN-202-05 |
| AS-2 | Communication is one-way inside the platform: the subscriber writes the first message, the super admin replies by email and in the ticket; to add information the subscriber opens a new ticket. | Out of scope |
| AS-3 | The list uses newest first, with no status filter required for business portal. | AC-KAN-202-02 |
| AS-4 | A read-only or suspended business can still ask for support, because support is how it reaches the platform about its situation. | AC-KAN-202-09 |

## Backlog issues
- KAN-202 in Jira (Epic KAN-197 / KAN-198 `[Negocio] Soporte`) corresponds to this specification.

## Non-functional
- i18n keys (new prefixes): `business:support.create.*`, `business:support.list.*`, `business:support.detail.*`. Status badge labels are shared with `common` status labels. Reused: `validation:required`, `validation:tooLong`, `common:errors.network`, `common:errors.permissionDenied`.
- Creation runs via Cloud Function `createSupportTicket` validating payload and tenant permissions on the server.
- Reading runs via client Firestore query filtered by `businessId` and ordered by `createdAt` desc, protected by `firestore.rules`.
- Private page: `RequireRole` for `subscriber`; idle logout after `PlatformSettings.idleTimeoutMinutes` (KAN-38). No reCAPTCHA (authenticated form).
- Accessibility: the form fields have visible labels and character counters announced to screen readers; status badges carry text, not colour only; the replies are an ordered list.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-202 | AC-KAN-202-01, AC-KAN-202-04 … AC-KAN-202-06, AC-KAN-202-10 | `tests/CreateSupportTicketModal.test.tsx` |
| KAN-202 | AC-KAN-202-02, AC-KAN-202-03, AC-KAN-202-08, AC-KAN-202-09 | `tests/BusinessSupportPage.test.tsx` |
| KAN-202 | AC-KAN-202-07 | `tests/rules/supportTickets.rules.test.ts` |
