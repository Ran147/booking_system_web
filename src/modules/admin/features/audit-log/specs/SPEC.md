# Audit and action traceability (KAN-193)

| Field | Value |
| --- | --- |
| Portal | admin |
| Feature folder | `src/portals/admin/features/audit-log/` |
| Stories | KAN-194, KAN-195 |
| Status | Draft |
| Depends on | Q3 decided 2026-09-28 (`AUDIT_LOG_ACTION_TYPE`); the admin specs that produce the audited actions (KAN-174 businesses: PROP-1, PROP-2, KAN-179; KAN-180 plans: KAN-181 to KAN-184) |

## Intent
The super admin can look back at the critical actions taken in the admin portal, when and by whom, to keep the platform traceable and secure. The log is read-only: entries are written by the server and nobody can edit or delete them.

## Actors and permissions
| Actor | Can |
| --- | --- |
| super admin (`super_admin`) | Read the audit log and filter it by date and action type |
| subscriber, collaborator, customer, visitor | Nothing; `auditLog` is readable only by `super_admin` and writable only by functions (`auth-and-roles`) |

## In scope
- Paginated, read-only list of `AuditLogEntry` documents (KAN-194).
- Which super admin actions write an entry, one `actionType` each (KAN-194, Q3).
- Filter by date range and by action type (KAN-195).
- Entry detail with the values recorded on the entry.

## Out of scope
- Editing, deleting or exporting entries.
- Logs of subscriber, collaborator or customer actions (the story is about the super admin's own actions).
- Retention and archiving (AS-4).
- Writing the entries: each admin function writes its own entry (businesses and plans specs); this spec defines the list and what an entry holds.

## Data
- `AuditLogEntry` (`auditLog/{auditLogEntryId}`, glossary §3). Read only from the client.
- `actionType`: one of `AUDIT_LOG_ACTION_TYPE` (`@/shared/domain`, Q3 decided 2026-09-28):

  | Value | Written when | Story |
  | --- | --- | --- |
  | `business_approved` | the super admin approves a `pending` business | PROP-1, KAN-176 |
  | `business_rejected` | the super admin rejects a `pending` business (with reason) | PROP-1 |
  | `business_suspended` | the super admin suspends a business (with reason) | PROP-2 |
  | `business_reactivated` | the super admin reactivates a suspended business | KAN-179 |
  | `plan_created` | a plan is created | KAN-181 |
  | `plan_updated` | a plan's name, features, billing period or limits change | KAN-183 |
  | `plan_price_changed` | a plan's price changes | KAN-183 |
  | `plan_activated` / `plan_deactivated` | a plan's status changes | KAN-184 |
  | `platform_settings_updated` | `PlatformSettings` change | KAN-182 |

- Proposed fields (new; to confirm): `createdAt: Date`, `actorUserId`, `actorEmail`, `actionType`, `targetType` (`business`, `plan`, `platform_settings`), `targetId`, `targetName` (name at the time of the action), `before` / `after` (changed values), `reason` (`Nullable`, rejections and suspensions) (AS-2).

## Acceptance criteria

### KAN-194 — View an audit history (logs) of my critical actions
- [ ] **AC-KAN-194-01** · happy · Given entries in `auditLog`, when a signed-in super admin opens the audit log, then they see the first page of entries, newest first, each with date and time, the super admin who acted, the action (label for its `actionType`) and the affected item, with a total count and previous/next controls. [KAN-194]
- [ ] **AC-KAN-194-02** · happy · Given an entry, when the super admin opens it, then they see all values recorded on it (for example the previous and new values when the entry has them) and a link to the affected business or plan when it still exists. [KAN-194]
- [ ] **AC-KAN-194-03** · happy · Given the audit log, when the super admin views any entry, then no edit or delete action is offered. [KAN-194]
- [ ] **AC-KAN-194-04** · edge · Given no entries exist yet, when the log loads, then an empty state with `admin:auditLog.list.empty` is shown. [KAN-194]
- [ ] **AC-KAN-194-05** · edge · Given an entry whose `actionType` has no translation in the current language, when it is listed, then the raw value is shown with `admin:auditLog.list.unknownAction` instead of an empty cell. [KAN-194]
- [ ] **AC-KAN-194-06** · error · Given the request fails because of the network, when the log loads or changes page, then an error state with `common:errors.network` and a retry action is shown. [KAN-194]
- [ ] **AC-KAN-194-07** · error · Given a signed-in `subscriber` or `customer`, when they open the admin audit log URL, then they are redirected to their own portal; and when any client tries to read, create, change or delete an `auditLog` entry directly, then it is rejected with `common:errors.permissionDenied` (only `super_admin` reads, nobody writes from the client). [KAN-194]
- [ ] **AC-KAN-194-08** · happy · Given a super admin approves, rejects, suspends or reactivates a business (PROP-1, PROP-2, KAN-179), when the action succeeds, then exactly one entry is written in the same transaction with `actionType` `business_approved`, `business_rejected`, `business_suspended` or `business_reactivated`, the actor, the business as target, the previous and new status and, for rejections and suspensions, the reason. [KAN-194, PROP-1, PROP-2, KAN-179]
- [ ] **AC-KAN-194-09** · happy · Given a super admin creates a plan, edits it, changes its price, activates or deactivates it, or changes the platform settings (KAN-181 to KAN-184, KAN-182), when the action succeeds, then an entry is written with `plan_created`, `plan_updated`, `plan_price_changed`, `plan_activated`, `plan_deactivated` or `platform_settings_updated` and the before / after values; an edit that changes the price and other fields writes one `plan_price_changed` and one `plan_updated` entry. [KAN-194, KAN-181, KAN-182, KAN-183, KAN-184]
- [ ] **AC-KAN-194-10** · happy · Given an entry of each action type, when it is listed, then its action shows the label `admin:auditLog.actionType.<value>` in the current language. [KAN-194]
- [ ] **AC-KAN-194-11** · error · Given an audited action fails on the server, when the transaction is rolled back, then no entry is written and the target keeps its previous values (the entry and the change are one transaction). [KAN-194]
- [ ] **AC-KAN-194-12** · edge · Given the target business or plan was renamed after the action, when the entry is shown, then it shows the name recorded at the time of the action (`targetName`) and a link to the current item. [KAN-194]

### KAN-195 — Filter the audit history by date and action type
- [ ] **AC-KAN-195-01** · happy · Given entries on several days, when the super admin sets a from / to date range, then only entries within that range, both days included, are listed, the count matches and pagination restarts at page 1. [KAN-195]
- [ ] **AC-KAN-195-02** · happy · Given a date range is applied, when the super admin reloads or shares the page URL, then the same range and results are shown. [KAN-195]
- [ ] **AC-KAN-195-03** · happy · Given a date range is applied, when the super admin clears it, then all entries are listed again from page 1. [KAN-195]
- [ ] **AC-KAN-195-04** · edge · Given a "from" date later than the "to" date, when the super admin applies it, then no query runs and `admin:auditLog.filters.invalidDateRange` is shown. [KAN-195]
- [ ] **AC-KAN-195-05** · edge · Given an entry created at 23:30 in the super admin's time zone, when they filter by that day, then the entry is included (days are whole days in that time zone, AS-3). [KAN-195]
- [ ] **AC-KAN-195-06** · edge · Given a range with no entries, when it is applied, then `admin:auditLog.list.emptyFiltered` and an action to clear the filter are shown. [KAN-195]
- [ ] **AC-KAN-195-07** · error · Given the filtered request fails, when the range is applied, then `common:errors.network` with a retry action is shown and the selected range is kept. [KAN-195]
- [ ] **AC-KAN-195-08** · happy · Given entries of several action types, when the super admin selects one or more action types from the list of `AUDIT_LOG_ACTION_TYPE` labels, then only entries of those types are listed, the count matches, the selection is kept in the URL and pagination restarts at page 1. [KAN-195]
- [ ] **AC-KAN-195-09** · happy · Given a date range and an action type are both applied, when the list loads, then only entries matching both are listed. [KAN-195]
- [ ] **AC-KAN-195-10** · error · Given an unknown action type value in the URL, when the page loads, then it is ignored, the filter shows no selection and `admin:auditLog.filters.invalidActionType` is shown. [KAN-195]
- [ ] **AC-KAN-195-11** · error · Given the filtered request fails, when an action type is selected, then `common:errors.network` with a retry action is shown and the selection is kept. [KAN-195]

## BLOCKED
None. Q3 was decided on 2026-09-28: the action types are `AUDIT_LOG_ACTION_TYPE`.

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | The log is paginated with `PAGINATION.DEFAULT_PAGE_SIZE` entries per page, ordered by `createdAt` descending. | AC-KAN-194-01 |
| AS-2 | Each entry stores the actor, the target (with its name at that time) and a before/after snapshot of the changed values when there is one, plus the reason for rejections and suspensions. | AC-KAN-194-02, AC-KAN-194-08, AC-KAN-194-12 |
| AS-6 | The action type filter allows several types at once ("or"); combined with the date range it is "and". | AC-KAN-195-08, AC-KAN-195-09 |
| AS-7 | A price change and another field change in one save write two entries (`plan_price_changed` and `plan_updated`), so price edits can be found with the filter alone. | AC-KAN-194-09 |
| AS-3 | Dates are shown and filtered in the super admin's browser time zone (the admin has no business `timeZone`). | AC-KAN-195-01, AC-KAN-195-05 |
| AS-4 | Entries are kept indefinitely; no retention rule in the MVP. | Out of scope |
| AS-5 | The log shows actions of all super admins, not only the viewer's own, although the story says "mis acciones". | AC-KAN-194-01 |

## Backlog issues
- KAN-194 lists "aprobaciones" and "suspensiones": they are the approval / rejection of new businesses (PROP-1, Q2) and the suspension of a business (PROP-2), both proposed stories not in Jira yet.
- KAN-194 has a typo: "suspenciones" = "suspensiones".
- KAN-194 says "mis acciones críticas"; with several super admins it is unclear whether each sees only their own entries (AS-5).
- "Cambios de planes" and "ediciones de precios" are two action types (`plan_updated`, `plan_price_changed`, AS-7).
- Platform settings changes (KAN-182) are audited although KAN-194 does not name them (Q3 decision).

## Non-functional
- i18n: new keys under `admin:auditLog.list.*`, `admin:auditLog.detail.*`, `admin:auditLog.filters.*`, and `admin:auditLog.actionType.*` (one label per `AUDIT_LOG_ACTION_TYPE` value). Reused: `common:errors.network`, `common:errors.permissionDenied`.
- Pagination: server-side cursor pagination with `totalCount`; the date range lives in the URL; filtering by `actionType` with the `createdAt` range needs a composite index (`actionType` + `createdAt` descending) in `firestore.indexes.json`.
- Security: `auditLog` read only for `super_admin`, write `false` from clients (`auth-and-roles` §4); entries are written only by Cloud Functions.
- Idle logout applies (`PlatformSettings.idleTimeoutMinutes`, KAN-182).
- No export, no realtime.
- Accessibility: the date range inputs have labels and accept keyboard entry; the table has headers and a caption.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-194 | AC-KAN-194-01 … AC-KAN-194-06, AC-KAN-194-10, AC-KAN-194-12 | `tests/AuditLogScreen.test.tsx` |
| KAN-194 | AC-KAN-194-07 | `tests/AuditLogScreen.test.tsx`, `tests/rules/auditLog.rules.test.ts` |
| KAN-194 | AC-KAN-194-08, AC-KAN-194-09, AC-KAN-194-11 | `functions/src/audit/tests/writeAuditLogEntry.test.ts` |
| KAN-195 | AC-KAN-195-01 … AC-KAN-195-11 | `tests/AuditLogScreen.test.tsx` |

