# Collaborators (KAN-77)

| Field | Value |
| --- | --- |
| Portal | business |
| Feature folder | `src/portals/business/features/collaborators/` |
| Stories | KAN-78, KAN-79, KAN-80, KAN-81, KAN-82, KAN-83, KAN-84, KAN-85, KAN-86 |
| Status | Draft |
| Depends on | Q1 decided 2026-09-28 (collaborator is a fifth actor, uses the business portal limited by permissions); KAN-180 plans (`limits.maxCollaborators`, KAN-181); KAN-32 subscription (upgrade KAN-44, read-only KAN-49); KAN-30 services (`serviceIds`, KAN-61); KAN-63 schedule (collaborator bookings and absences); KAN-28 auth (`src/features/auth`: password rules, recovery KAN-36, idle logout KAN-38) |

## Intent
The subscriber manages the people who serve customers in their business (for example the barbers of a barbershop): registers them, invites them by email so they activate their own account, edits, deactivates and reactivates them, and decides what each one may do in the business portal. A collaborator then signs in to the same business portal and sees only what the subscriber enabled for them.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own business only) | Everything in this feature: register, invite, edit, deactivate, reactivate, list collaborators, resend emails and set permissions, while the business is `active`. Only list and view while the business is `inactive` or `suspended` (KAN-49). |
| collaborator (`collaborator`, own business only, while `active`) | Accept their invitation and set a password (KAN-79). In the business portal, see their own bookings and whatever their `permissions` allow (KAN-86). Never manage collaborators, even with every permission. |
| customer, visitor, super admin | Nothing in this feature. |

The business always comes from the session (`businessId` claim), never from the URL. A subscriber never sees another business's collaborators.

## In scope
- Collaborator form (register and edit): full name, email, phone, services they can serve, permissions (KAN-78, KAN-80, KAN-86).
- Email invitation and invitation acceptance page where the collaborator sets their password (KAN-79).
- Deactivate and reactivate (KAN-81, KAN-82).
- Paginated list with status filter and a collaborator profile (KAN-83).
- Resend the invitation or a password reset email (KAN-84).
- Collaborator limit of the plan with an upgrade offer (KAN-85).
- Permission set and how the business portal applies it for a collaborator (KAN-86).

## Out of scope
- Assigning collaborators from the service side and the "customer chooses / automatic" option (KAN-61, services spec); both edit the same `Collaborator.serviceIds`.
- Collaborator filters and views in the agenda (KAN-66, KAN-67, KAN-68, schedule spec), reports (KAN-103, KAN-105, reports spec) and the customer flow (KAN-136 to KAN-138, KAN-142, KAN-152).
- Deleting a collaborator (no story; deactivation replaces it) and cancelling a pending invitation (no story, AS-12).
- A collaborator's own profile or password change page (no story; password recovery reuses KAN-36).
- Payroll, commissions or working hours per collaborator (no story; absences are schedule blocks, KAN-66).

## Data
- `Collaborator` at `businesses/{businessId}/collaborators/{collaboratorId}` (`domain-glossary` §3): `fullName`, `email`, `phone` (`Nullable`), `status` (`invited` → `active` ↔ `inactive`, §4.6), `permissions` (`CollaboratorPermission[]`), `serviceIds` (services they can serve), `userId` (`Nullable`, set when the invitation is accepted), `createdAt`, `updatedAt`. Written only by Cloud Functions, because they also set Auth claims.
- `CollaboratorPermission` (`COLLABORATOR_PERMISSION`, `@/shared/domain`): `manage_bookings`, `manage_customers`, `manage_schedule_blocks`, `manage_services`, `view_reports` (AS-3).
- Custom claims of a collaborator: `{ role: "collaborator", businessId, collaboratorId }` (`auth-and-roles` §1), set when the invitation is accepted.
- `Plan.limits.maxCollaborators` (KAN-181) and the business `Subscription.planId` for the limit (KAN-85).
- `Booking.collaboratorId` is read to count and keep a collaborator's bookings (KAN-81); it is written by the booking functions, not here.
- Invitation token: single use, with an expiry (AS-2); stored by the function, never readable by clients.

## Acceptance criteria

### KAN-78 — Register a new collaborator with name, email, role/permissions and the services they can serve
- [ ] **AC-KAN-78-01** · happy · Given a subscriber of an `active` business below its collaborator limit, when they enter a full name, an email, optionally a phone, choose the services the collaborator can serve and their permissions (KAN-86) and save, then a `Collaborator` is created with status `invited`, it appears in the list with its status badge, the invitation email is sent (KAN-79) and `business:collaborators.create.success` is shown. [KAN-78]
- [ ] **AC-KAN-78-02** · happy · Given the service picker, when the subscriber opens it, then it lists the business's `active` services only, and the permission picker lists exactly the `CollaboratorPermission` values with the labels `business:collaborators.permissions.<value>`. [KAN-78, KAN-86]
- [ ] **AC-KAN-78-03** · error · Given an empty full name or email, when the subscriber saves, then nothing is created and `validation:required` is shown on each empty field. [KAN-78]
- [ ] **AC-KAN-78-04** · error · Given an email that is not a valid address, or a name or phone outside the limits of AS-10, when the field is validated, then `validation:emailInvalid`, `validation:tooShort` or `validation:tooLong` is shown and nothing is created. [KAN-78]
- [ ] **AC-KAN-78-05** · error · Given the email already belongs to a collaborator of this business in any status, when the subscriber saves, then nothing is created and `business:collaborators.form.duplicateEmailError` is shown. [KAN-78]
- [ ] **AC-KAN-78-06** · error · Given the email already belongs to a platform account with another role (the subscriber, a customer, a super admin or a collaborator of another business), when the subscriber saves, then nothing is created and `business:collaborators.form.emailInUseError` is shown. See AS-1. [KAN-78]
- [ ] **AC-KAN-78-07** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to register a collaborator, then the action is disabled or rejected, nothing is created and `business:errors.readOnly` is shown. [KAN-78, KAN-49]
- [ ] **AC-KAN-78-08** · error · Given the request fails because of the network, when the subscriber saves, then no collaborator is created, the form keeps its values and `common:errors.network` is shown. [KAN-78]
- [ ] **AC-KAN-78-09** · error · Given a signed-in `collaborator`, even one with every permission, when they open the collaborators section or call the register function directly, then they are sent to the business portal home and the server rejects the call with `common:errors.permissionDenied`. [KAN-78, KAN-86]
- [ ] **AC-KAN-78-10** · edge · Given no service is selected, when the subscriber saves, then the collaborator is created and `business:collaborators.form.noServicesWarning` explains that customers cannot book with them until a service is assigned. [KAN-78, KAN-61]
- [ ] **AC-KAN-78-11** · edge · Given the business already has as many `invited` and `active` collaborators as its plan allows, when the subscriber tries to register one more, then the flow of AC-KAN-85-01 applies and nothing is created. [KAN-78, KAN-85]
- [ ] **AC-KAN-78-12** · edge · Given the subscriber double-clicks save, when the first request is in progress, then the button is disabled and only one collaborator and one invitation are created. [KAN-78]

### KAN-79 — Email invitation so the collaborator activates their own account and password
- [ ] **AC-KAN-79-01** · happy · Given a collaborator was registered (AC-KAN-78-01), when the invitation is sent, then the collaborator receives one email `business:collaborators.invitationEmail.*` in the subscriber's `User.language` (AS-11) with the business name and a single-use link that expires after the time in AS-2. [KAN-79]
- [ ] **AC-KAN-79-02** · happy · Given a valid invitation link, when the collaborator opens it, then a page shows the business name and their email (not editable) and asks for a password with show / hide and the strength feedback of KAN-37, plus its confirmation. [KAN-79, KAN-37]
- [ ] **AC-KAN-79-03** · happy · Given a password that meets every `PASSWORD_RULE` and a matching confirmation, when the collaborator submits, then their account is created, the claims `{ role: "collaborator", businessId, collaboratorId }` are set, the `Collaborator` becomes `active` with its `userId`, and they are taken to sign-in with `common:auth.invitation.accepted` and their email filled in. [KAN-79]
- [ ] **AC-KAN-79-04** · happy · Given a collaborator who accepted the invitation, when they sign in, then they land on the business portal home of that business, limited to their permissions (KAN-86). [KAN-79, KAN-86]
- [ ] **AC-KAN-79-05** · error · Given an invitation link that is expired, already used, replaced by a newer one (KAN-84) or malformed, when the collaborator opens it, then `common:auth.invitation.linkInvalid` is shown, no password form is shown and the page says to ask the business for a new invitation. [KAN-79, KAN-84]
- [ ] **AC-KAN-79-06** · error · Given a password that fails any `PASSWORD_RULE` or a confirmation that does not match, when the collaborator submits, then nothing changes and `validation:passwordTooWeak` or `common:auth.passwordReset.mismatch` is shown. [KAN-79]
- [ ] **AC-KAN-79-07** · error · Given the request fails because of the network, when the collaborator submits, then no account is created, the `Collaborator` stays `invited`, the link stays valid and `common:errors.network` is shown. [KAN-79]
- [ ] **AC-KAN-79-08** · error · Given the email was registered by another account after the invitation was sent, when the collaborator submits, then no account is created, the `Collaborator` stays `invited` and `common:auth.invitation.cannotAccept` is shown with a way to contact the business. See AS-1. [KAN-79]
- [ ] **AC-KAN-79-09** · edge · Given the invitation email cannot be delivered (for example the address bounces), when the subscriber views the collaborator, then it stays `invited` and the resend action of KAN-84 is available. [KAN-79, KAN-84]

### KAN-80 — Edit an existing collaborator's data
- [ ] **AC-KAN-80-01** · happy · Given a collaborator of their business, when the subscriber changes the full name, phone, services or permissions and saves, then the changes are stored, the list and profile show them and `business:collaborators.edit.success` is shown. [KAN-80]
- [ ] **AC-KAN-80-02** · happy · Given an `active` collaborator who is signed in, when the subscriber changes their permissions, then the collaborator's next screen load shows only the newly allowed sections and the server applies the new permissions to their next request, without signing them out. [KAN-80, KAN-86]
- [ ] **AC-KAN-80-03** · edge · Given an `invited` collaborator, when the subscriber changes the email and saves, then the previous invitation link stops working and a new invitation is sent to the new email; for an `active` or `inactive` collaborator the email is shown read-only. See AS-7. [KAN-80, KAN-79]
- [ ] **AC-KAN-80-04** · edge · Given a collaborator with future `pending` or `confirmed` bookings of a service, when the subscriber removes that service from them, then those bookings are kept with that collaborator and `business:collaborators.edit.serviceHasBookingsWarning` shows their count. See AS-8. [KAN-80]
- [ ] **AC-KAN-80-05** · error · Given an empty or invalid field, or an email already used (AC-KAN-78-05, AC-KAN-78-06), when the subscriber saves, then nothing changes and the matching validation message is shown. [KAN-80]
- [ ] **AC-KAN-80-06** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to edit a collaborator, then nothing changes and `business:errors.readOnly` is shown. [KAN-80, KAN-49]
- [ ] **AC-KAN-80-07** · error · Given the collaborator was changed in another session after the form was opened, when the subscriber saves, then nothing is overwritten, `business:collaborators.edit.conflictError` is shown and the latest values can be reloaded. [KAN-80]
- [ ] **AC-KAN-80-08** · error · Given the request fails because of the network, when the subscriber saves, then the collaborator keeps its previous values and `common:errors.network` is shown. [KAN-80]

### KAN-81 — Deactivate a collaborator (temporary or indefinite leave)
- [ ] **AC-KAN-81-01** · happy · Given an `active` collaborator, when the subscriber deactivates them and confirms, then the status becomes `inactive`, the list shows the new badge, `business:collaborators.deactivate.success` is shown, and the collaborator is no longer offered to customers (KAN-136) nor assigned new bookings. [KAN-81]
- [ ] **AC-KAN-81-02** · happy · Given a collaborator who is signed in when they are deactivated, when they make their next request, then every read of the business is denied, and they are signed out with `common:auth.signIn.accountDisabled` at the latest on their next token refresh. [KAN-81]
- [ ] **AC-KAN-81-03** · edge · Given a collaborator with future `pending` or `confirmed` bookings, when the subscriber opens the deactivation dialog, then `business:collaborators.deactivate.hasUpcomingBookingsWarning` shows their count; if they confirm, the bookings are kept with that collaborator and are marked in the agenda as needing reassignment. See AS-8. [KAN-81, KAN-67]
- [ ] **AC-KAN-81-04** · error · Given an `invited` collaborator, when the subscriber views them, then deactivate is not offered; and when the call reaches the server, it is rejected with `business:collaborators.status.invalidTransitionError` and nothing changes. [KAN-81]
- [ ] **AC-KAN-81-05** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to deactivate a collaborator, then nothing changes and `business:errors.readOnly` is shown. [KAN-81, KAN-49]
- [ ] **AC-KAN-81-06** · error · Given the request fails because of the network, when the subscriber confirms, then the collaborator stays `active` and `common:errors.network` is shown. [KAN-81]

### KAN-82 — Reactivate a previously deactivated collaborator
- [ ] **AC-KAN-82-01** · happy · Given an `inactive` collaborator and a business below its collaborator limit, when the subscriber reactivates them and confirms, then the status becomes `active`, they can sign in again with their existing password and are offered to customers again for their services. [KAN-82]
- [ ] **AC-KAN-82-02** · error · Given the business already has as many `invited` and `active` collaborators as its plan allows, when the subscriber reactivates an `inactive` one, then the collaborator stays `inactive` and the flow of AC-KAN-85-01 applies. [KAN-82, KAN-85]
- [ ] **AC-KAN-82-03** · error · Given the collaborator was reactivated meanwhile in another session, when the subscriber confirms, then nothing changes, `business:collaborators.status.invalidTransitionError` is shown and the current status is reloaded. [KAN-82]
- [ ] **AC-KAN-82-04** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to reactivate a collaborator, then nothing changes and `business:errors.readOnly` is shown. [KAN-82, KAN-49]
- [ ] **AC-KAN-82-05** · error · Given the request fails because of the network, when the subscriber confirms, then the collaborator stays `inactive` and `common:errors.network` is shown. [KAN-82]

### KAN-83 — List collaborators, filter by status, paginated on the server, with their profile
- [ ] **AC-KAN-83-01** · happy · Given a business with collaborators, when the subscriber opens the collaborators list, then they see one page of their own business's collaborators sorted by full name, each with name, email, status badge and the number of services they serve, with a total count and previous / next controls. [KAN-83]
- [ ] **AC-KAN-83-02** · happy · Given the list, when the subscriber filters by status `active`, `inactive` or `invited` (AS-9), then only collaborators with that status are listed, the total count matches, the filter is kept in the URL and pagination restarts at page 1. [KAN-83]
- [ ] **AC-KAN-83-03** · happy · Given a collaborator in the list, when the subscriber opens their profile, then it shows full name, email, phone, status, the services they serve, their permissions and the date they were registered, with the actions allowed for their status. [KAN-83]
- [ ] **AC-KAN-83-04** · edge · Given a business without collaborators, when the list loads, then `business:collaborators.list.empty` is shown with an action to register the first collaborator, and a note that bookings are served by the business itself until then (AS-6). [KAN-83]
- [ ] **AC-KAN-83-05** · edge · Given a filter that matches no collaborator, when the list loads, then `business:collaborators.list.emptyFiltered` and an action to clear the filter are shown. [KAN-83]
- [ ] **AC-KAN-83-06** · error · Given the request fails because of the network, when the list loads or changes page, then an error state with `common:errors.network` and a retry action is shown. [KAN-83]
- [ ] **AC-KAN-83-07** · error · Given a collaborator id of another business, when the subscriber opens that profile URL, then `common:errors.notFound` is shown and no data is loaded (the rules deny the read). [KAN-83]

### KAN-84 — Resend the verification or password-reset email to a collaborator
- [ ] **AC-KAN-84-01** · happy · Given an `invited` collaborator, when the subscriber chooses resend invitation, then a new invitation email is sent (KAN-79), the previous link stops working and `business:collaborators.resend.invitationSent` is shown. [KAN-84, KAN-79]
- [ ] **AC-KAN-84-02** · happy · Given an `active` collaborator, when the subscriber chooses send password reset, then the password reset email of KAN-36 is sent to the collaborator's email in their `User.language` and `business:collaborators.resend.passwordResetSent` is shown. [KAN-84, KAN-36]
- [ ] **AC-KAN-84-03** · edge · Given an email was sent to that collaborator less than the waiting time ago (auth spec AS-2), when the subscriber looks at the action, then it is disabled with a countdown. [KAN-84]
- [ ] **AC-KAN-84-04** · error · Given an `inactive` collaborator, when the subscriber views them, then neither action is offered; and a direct call is rejected with `business:collaborators.status.invalidTransitionError`. [KAN-84]
- [ ] **AC-KAN-84-05** · error · Given the request fails because of the network, when the subscriber chooses either action, then `common:errors.network` is shown and the previous invitation link keeps working. [KAN-84]

### KAN-85 — Warn when the plan's collaborator limit is reached and offer a plan upgrade
- [ ] **AC-KAN-85-01** · happy · Given the business has as many `invited` and `active` collaborators as `Plan.limits.maxCollaborators` of its current plan (AS-5), when the subscriber tries to register or reactivate a collaborator, then nothing is created or changed and a dialog shows `business:collaborators.limit.reached` with the limit and an upgrade action that opens the plan comparison (KAN-44). [KAN-85, KAN-44]
- [ ] **AC-KAN-85-02** · happy · Given the subscriber upgraded to a plan with a higher limit (KAN-44), when they register a collaborator again, then it is created. [KAN-85, KAN-44]
- [ ] **AC-KAN-85-03** · edge · Given `inactive` collaborators, when the limit is checked, then they do not count; the list shows "used / allowed" with `business:collaborators.limit.usage`. [KAN-85]
- [ ] **AC-KAN-85-04** · edge · Given no `active` plan has a higher collaborator limit than the current one, when the limit is reached, then `business:collaborators.limit.reachedNoUpgrade` is shown without the upgrade action. [KAN-85]
- [ ] **AC-KAN-85-05** · error · Given one free place and two registrations sent at the same time, when both reach the server, then only one collaborator is created and the other request is rejected with `business:collaborators.limit.reached`. [KAN-85]
- [ ] **AC-KAN-85-06** · edge · Given the super admin lowered the plan's limit below the business's current count (KAN-183), when the subscriber views the list, then every existing collaborator is kept and no new one can be registered or reactivated until the count is below the limit. See AS-12. [KAN-85, KAN-183]

### KAN-86 — Define what each collaborator can and cannot do in the business portal
- [ ] **AC-KAN-86-01** · happy · Given a collaborator's profile, when the subscriber turns permissions on or off from the list of `CollaboratorPermission` values and saves, then exactly those permissions are stored and `business:collaborators.permissions.saveSuccess` is shown. [KAN-86]
- [ ] **AC-KAN-86-02** · happy · Given a signed-in `active` collaborator, when the business portal loads, then the sidebar shows the business name and logo (KAN-39), their own agenda (their bookings only, read-only, AS-4) and only the sections their permissions allow: `manage_bookings` → the whole agenda and booking actions (KAN-69 to KAN-74), `manage_schedule_blocks` → schedule blocks (KAN-65, KAN-66), `manage_customers` → customers (KAN-87), `manage_services` → services (KAN-30), `view_reports` → reports (KAN-102). [KAN-86]
- [ ] **AC-KAN-86-03** · happy · Given a collaborator with `manage_bookings`, when they open the agenda, then they see and act on the bookings of every collaborator, with the same rules as the subscriber (status transitions, read-only business). [KAN-86, KAN-67]
- [ ] **AC-KAN-86-04** · error · Given a collaborator without a permission, when they open the URL of that section, then they are sent to the business portal home and no data of that section is loaded; a direct read or write is rejected by the server with `common:errors.permissionDenied`. [KAN-86]
- [ ] **AC-KAN-86-05** · error · Given any collaborator, when they open the subscription (KAN-32), business hours and booking settings (KAN-64, KAN-70), business profile (PROP-4), notification settings (KAN-99), support (PROP-3) or collaborators (KAN-77) sections, then they are sent to the business portal home: these areas are never granted to a collaborator. [KAN-86]
- [ ] **AC-KAN-86-06** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to change permissions, then nothing changes and `business:errors.readOnly` is shown. [KAN-86, KAN-49]
- [ ] **AC-KAN-86-07** · error · Given the request fails because of the network, when the subscriber saves the permissions, then they keep their previous values and `common:errors.network` is shown. [KAN-86]
- [ ] **AC-KAN-86-08** · edge · Given a permission is removed while the collaborator has that section open, when they make their next request, then the server denies it and the screen shows `common:errors.permissionDenied` with a link to the portal home. [KAN-86]
- [ ] **AC-KAN-86-09** · edge · Given a collaborator of a business that becomes `inactive` or `suspended`, when they use the portal, then everything they can see is read-only with `business:errors.readOnly`, as for the subscriber. [KAN-86, KAN-49]

## BLOCKED
None. Q1 was decided on 2026-09-28.

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | A platform account has exactly one role, so a collaborator's email cannot belong to any other account (the owner, a customer, a super admin or a collaborator of another business). | AC-KAN-78-06, AC-KAN-79-08 |
| AS-2 | An invitation link is valid for 7 days and works once; resending or changing the email invalidates the previous link. | AC-KAN-79-01, AC-KAN-79-05, AC-KAN-84-01 |
| AS-3 | The permission list is exactly `manage_bookings`, `manage_customers`, `manage_schedule_blocks`, `manage_services`, `view_reports`, derived from the business-portal features. Subscription, business settings (hours, booking policy), business profile, notification settings, support and collaborators are subscriber-only. A collaborator keeps their own personal settings (language, theme, password; KAN-31 settings spec). The team confirms the list. | AC-KAN-78-02, AC-KAN-86-01 … AC-KAN-86-05 |
| AS-4 | Without any permission a collaborator sees only their own bookings in the agenda, read-only; marking their own bookings `completed` or `no_show` needs `manage_bookings`. | AC-KAN-86-02 |
| AS-5 | The collaborator limit counts `invited` and `active` collaborators; `inactive` ones do not count. | AC-KAN-85-01, AC-KAN-85-03 |
| AS-6 | A business without collaborators (or a service without a collaborator assigned) is served by the business as one resource: one booking at a time, `Booking.collaboratorId` = `null` (`domain-glossary` §3). | AC-KAN-83-04 |
| AS-7 | The email of an `active` or `inactive` collaborator cannot be edited, because it is their sign-in; only an `invited` collaborator's email can change. | AC-KAN-80-03 |
| AS-8 | Deactivating a collaborator or removing one of their services never cancels or moves bookings automatically; the subscriber reassigns them by rescheduling or editing the booking. | AC-KAN-80-04, AC-KAN-81-03 |
| AS-9 | The status filter also offers `invited`, although KAN-83 only names active / inactive. | AC-KAN-83-02 |
| AS-10 | Limits: full name 2–80 characters; phone optional, 7–20 characters (digits, spaces, `+`, `-`). | AC-KAN-78-04 |
| AS-11 | Invitation emails are sent in the subscriber's `User.language`. | AC-KAN-79-01 |
| AS-12 | There is no "cancel invitation" or delete action; an unwanted `invited` collaborator is left as is (it counts against the limit, AS-5). If this is a problem the team adds a story. Lowering a plan's limit never removes collaborators. | AC-KAN-85-06, Out of scope |
| AS-13 | A collaborator with `manage_bookings` sees the other collaborators' names in the agenda, not their records; how those names are read is decided with the schedule feature (the rules today let a collaborator read only their own record). | AC-KAN-86-03 |

## Backlog issues
- KAN-78 mixes "rol/permiso" into registration while KAN-86 defines permissions as its own story. Resolved: the registration form includes the permission picker of KAN-86; both stories use the same `permissions` field.
- The epic is named "Gestion Colaboradores" in the CSV and "Colaboradores" in `epic-map.md` (missing accent in "Gestión" as well).
- KAN-83 says "paginado" twice ("paginado con su perfil de forma paginada"); read as a paginated list plus a profile page.
- KAN-85 overlaps KAN-44 (upgrade plan, KAN-32): the upgrade action opens the KAN-44 comparison instead of a second flow.
- KAN-84 (resend verification / password reset) reuses the auth recovery flow (KAN-36) for active collaborators; for invited ones it resends the invitation (there is no separate email verification: accepting the invitation proves the email).
- No story lets the subscriber cancel an invitation or delete a collaborator (AS-12).

## Non-functional
- i18n keys: `business:collaborators.list.*`, `business:collaborators.form.*`, `business:collaborators.create.*`, `business:collaborators.edit.*`, `business:collaborators.deactivate.*`, `business:collaborators.status.*`, `business:collaborators.resend.*`, `business:collaborators.limit.*`, `business:collaborators.permissions.*` (one label per `CollaboratorPermission`), `business:collaborators.invitationEmail.*`; `common:auth.invitation.*` for the acceptance page (shared auth feature). Reused: `validation:required`, `validation:emailInvalid`, `validation:tooShort`, `validation:tooLong`, `validation:passwordTooWeak`, `common:errors.network`, `common:errors.notFound`, `common:errors.permissionDenied`, `business:errors.readOnly`.
- All writes run through callable functions (`api-mutation-standards` §1): they set claims, check `Plan.limits.maxCollaborators` in a transaction and validate the transition with `COLLABORATOR_STATUS_TRANSITIONS`. `firestore.rules`: collaborator documents are readable by the owner and by the collaborator themselves, never writable from clients (`tests/rules/collaborators.rules.test.ts`).
- Pagination: cursor pagination with `PAGINATION.DEFAULT_PAGE_SIZE`, total count from the server, status filter in the URL.
- The invitation acceptance page is guest-only and protected by reCAPTCHA (`auth-and-roles` §5).
- Idle logout (KAN-38) applies to subscribers and collaborators.
- Accessibility: status badges have text; the permission list is a group of labelled checkboxes; confirmation dialogs trap focus.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-78 | AC-KAN-78-01 … AC-KAN-78-12 | `tests/CollaboratorFormScreen.test.tsx`; `functions/src/collaborators/tests/registerCollaborator.test.ts` |
| KAN-79 | AC-KAN-79-01, AC-KAN-79-03, AC-KAN-79-08, AC-KAN-79-09 | `functions/src/collaborators/tests/acceptCollaboratorInvitation.test.ts` |
| KAN-79 | AC-KAN-79-02, AC-KAN-79-04 … AC-KAN-79-07 | `src/features/auth/tests/AcceptInvitationPage.test.tsx` |
| KAN-80 | AC-KAN-80-01 … AC-KAN-80-08 | `tests/CollaboratorFormScreen.test.tsx` |
| KAN-81 | AC-KAN-81-01, AC-KAN-81-03 … AC-KAN-81-06 | `tests/CollaboratorProfileScreen.test.tsx` |
| KAN-81 | AC-KAN-81-02 | `tests/rules/collaborators.rules.test.ts` |
| KAN-82 | AC-KAN-82-01 … AC-KAN-82-05 | `tests/CollaboratorProfileScreen.test.tsx` |
| KAN-83 | AC-KAN-83-01 … AC-KAN-83-07 | `tests/CollaboratorListScreen.test.tsx`; `tests/rules/collaborators.rules.test.ts` |
| KAN-84 | AC-KAN-84-01 … AC-KAN-84-05 | `tests/CollaboratorProfileScreen.test.tsx` |
| KAN-85 | AC-KAN-85-01 … AC-KAN-85-06 | `tests/CollaboratorFormScreen.test.tsx`; `functions/src/collaborators/tests/registerCollaborator.test.ts` |
| KAN-86 | AC-KAN-86-01, AC-KAN-86-06, AC-KAN-86-07 | `tests/CollaboratorPermissionsScreen.test.tsx` |
| KAN-86 | AC-KAN-86-02 … AC-KAN-86-05, AC-KAN-86-08, AC-KAN-86-09 | `src/portals/business/layout/tests/BusinessLayout.test.tsx`; `tests/rules/collaborators.rules.test.ts` |
