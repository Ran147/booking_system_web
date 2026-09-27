# Audit and action traceability (KAN-193)

| Field | Value |
| --- | --- |
| Portal | admin |
| Feature folder | `src/portals/admin/features/audit-log/` |
| Stories | KAN-194, KAN-195 |
| Status | BLOCKED (partially) |
| Depends on | Q3 (which actions are recorded, `AuditLogEntry.actionType` values); the admin specs that produce critical actions (KAN-174 businesses, KAN-180 plans) |

## Intent
The super admin can look back at the critical actions taken in the admin portal, when and by whom, to keep the platform traceable and secure. The log is read-only: entries are written by the server and nobody can edit or delete them.

## Actors and permissions
| Actor | Can |
| --- | --- |
| super admin (`super_admin`) | Read the audit log and filter it by date |
| subscriber, customer, visitor | Nothing; `auditLog` is readable only by `super_admin` and writable only by functions (`auth-and-roles`) |

## In scope
- Paginated, read-only list of `AuditLogEntry` documents (KAN-194, viewing part).
- Filter by date range (KAN-195, date part).
- Entry detail with the values recorded on the entry.

## Out of scope
- Which actions produce entries and the list of `actionType` values (Q3).
- The action type filter (Q3).
- Editing, deleting or exporting entries.
- Logs of subscriber or customer actions (the story is about the super admin's own actions).
- Retention and archiving (AS-4).

## Data
- `AuditLogEntry` (`auditLog/{auditLogEntryId}`, glossary §3). Read only.
- Proposed fields that do not depend on Q3 (new; to confirm): `createdAt: Date`, `actorUserId`, `actorEmail`, `actionType` (value set **BLOCKED — Q3**; shown as stored), `targetType`, `targetId`, `summary` / before–after values (AS-2).
- No `actionType` values are defined in this spec.

## Acceptance criteria

### KAN-194 — View an audit history (logs) of my critical actions
- [ ] **AC-KAN-194-01** · happy · Given entries in `auditLog`, when a signed-in super admin opens the audit log, then they see the first page of entries, newest first, each with date and time, the super admin who acted, the action (label for its `actionType`) and the affected item, with a total count and previous/next controls. [KAN-194]
- [ ] **AC-KAN-194-02** · happy · Given an entry, when the super admin opens it, then they see all values recorded on it (for example the previous and new values when the entry has them) and a link to the affected business or plan when it still exists. [KAN-194]
- [ ] **AC-KAN-194-03** · happy · Given the audit log, when the super admin views any entry, then no edit or delete action is offered. [KAN-194]
- [ ] **AC-KAN-194-04** · edge · Given no entries exist yet, when the log loads, then an empty state with `admin:auditLog.list.empty` is shown. [KAN-194]
- [ ] **AC-KAN-194-05** · edge · Given an entry whose `actionType` has no translation in the current language, when it is listed, then the raw value is shown with `admin:auditLog.list.unknownAction` instead of an empty cell. [KAN-194]
- [ ] **AC-KAN-194-06** · error · Given the request fails because of the network, when the log loads or changes page, then an error state with `common:errors.network` and a retry action is shown. [KAN-194]
- [ ] **AC-KAN-194-07** · error · Given a signed-in `subscriber` or `customer`, when they open the admin audit log URL, then they are redirected to their own portal; and when any client tries to read, create, change or delete an `auditLog` entry directly, then it is rejected with `common:errors.permissionDenied` (only `super_admin` reads, nobody writes from the client). [KAN-194]

### KAN-195 — Filter the audit history by date and action type
- [ ] **AC-KAN-195-01** · happy · Given entries on several days, when the super admin sets a from / to date range, then only entries within that range, both days included, are listed, the count matches and pagination restarts at page 1. [KAN-195]
- [ ] **AC-KAN-195-02** · happy · Given a date range is applied, when the super admin reloads or shares the page URL, then the same range and results are shown. [KAN-195]
- [ ] **AC-KAN-195-03** · happy · Given a date range is applied, when the super admin clears it, then all entries are listed again from page 1. [KAN-195]
- [ ] **AC-KAN-195-04** · edge · Given a "from" date later than the "to" date, when the super admin applies it, then no query runs and `admin:auditLog.filters.invalidDateRange` is shown. [KAN-195]
- [ ] **AC-KAN-195-05** · edge · Given an entry created at 23:30 in the super admin's time zone, when they filter by that day, then the entry is included (days are whole days in that time zone, AS-3). [KAN-195]
- [ ] **AC-KAN-195-06** · edge · Given a range with no entries, when it is applied, then `admin:auditLog.list.emptyFiltered` and an action to clear the filter are shown. [KAN-195]
- [ ] **AC-KAN-195-07** · error · Given the filtered request fails, when the range is applied, then `common:errors.network` with a retry action is shown and the selected range is kept. [KAN-195]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| KAN-194 (which actions are recorded) | Q3 — which "approvals" the audit log records | The list of audited actions and the `actionType` values; which functions write entries. Viewing the log is specified. |
| KAN-195 (filter by action type only) | Q3 | The action type filter and its options. The date filter is specified. |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | The log is paginated with `PAGINATION.DEFAULT_PAGE_SIZE` entries per page, ordered by `createdAt` descending. | AC-KAN-194-01 |
| AS-2 | Each entry stores the actor, the target and a before/after snapshot of the changed values when there is one. | AC-KAN-194-02 |
| AS-3 | Dates are shown and filtered in the super admin's browser time zone (the admin has no business `timeZone`). | AC-KAN-195-01, AC-KAN-195-05 |
| AS-4 | Entries are kept indefinitely; no retention rule in the MVP. | Out of scope |
| AS-5 | The log shows actions of all super admins, not only the viewer's own, although the story says "mis acciones". | AC-KAN-194-01 |

## Backlog issues
- KAN-194 lists "aprobaciones" as audited actions, but no story approves anything (Q3). It also lists "suspensiones", and no story suspends a business (see KAN-174 spec).
- KAN-194 has a typo: "suspenciones" = "suspensiones".
- KAN-194 says "mis acciones críticas"; with several super admins it is unclear whether each sees only their own entries (AS-5).
- "Cambios de planes" and "ediciones de precios" overlap (KAN-183 edits price as a plan change); Q3 should settle them as one action type or two.

## Non-functional
- i18n: new keys under `admin:auditLog.list.*`, `admin:auditLog.detail.*`, `admin:auditLog.filters.*`, and `admin:auditLog.actionType.*` (labels, added once Q3 is decided). Reused: `common:errors.network`, `common:errors.permissionDenied`.
- Pagination: server-side cursor pagination with `totalCount`; the date range lives in the URL; `createdAt` is the only range field, so no composite index is needed until the action type filter (Q3).
- Security: `auditLog` read only for `super_admin`, write `false` from clients (`auth-and-roles` §4); entries are written only by Cloud Functions.
- Idle logout applies (`PlatformSettings.idleTimeoutMinutes`, KAN-182).
- No export, no realtime.
- Accessibility: the date range inputs have labels and accept keyboard entry; the table has headers and a caption.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-194 | AC-KAN-194-01 … AC-KAN-194-06 | `tests/AuditLogScreen.test.tsx` |
| KAN-194 | AC-KAN-194-07 | `tests/AuditLogScreen.test.tsx`, `functions/src/rules/tests/auditLog.rules.test.ts` |
| KAN-194 (recorded actions) | BLOCKED (Q3) | — |
| KAN-195 | AC-KAN-195-01 … AC-KAN-195-07 | `tests/AuditLogScreen.test.tsx` |
| KAN-195 (action type filter) | BLOCKED (Q3) | — |
