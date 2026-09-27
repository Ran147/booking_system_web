# Collaborators (KAN-77)

| Field | Value |
| --- | --- |
| Portal | business |
| Feature folder | `src/portals/business/features/collaborators/` |
| Stories | KAN-78, KAN-79, KAN-80, KAN-81, KAN-82, KAN-83, KAN-84, KAN-85, KAN-86 |
| Status | BLOCKED |
| Depends on | Q1 — collaborator (whole epic); KAN-180 plan limits (KAN-181) and KAN-32 upgrade (KAN-44) once Q1 is decided; KAN-28 auth |

## Intent
For the subscriber who wants to manage the people who work in their business: register them, invite them to activate their own account, edit, deactivate and reactivate them, and decide what each one may do in the business panel. Whether the collaborator exists as a fifth actor is still being voted (Q1), so nothing in this epic is specified yet.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own business only) | Nothing yet — every action of this epic waits on Q1. |
| collaborator | **BLOCKED — Q1.** No role, claim, portal or entity exists for it. |

## In scope
- Nothing until Q1 is decided. The story list below is kept so the epic is traceable.

## Out of scope
- Any `Collaborator` entity, `collaboratorId` field, collaborator role or collaborator permission set (`domain-glossary` §5, `auth-and-roles`).
- Collaborator filters and views in other epics (KAN-61, KAN-67, KAN-68, KAN-103, KAN-105, KAN-136, KAN-137, KAN-138, KAN-142, collaborator field in KAN-152). Those specs mark them BLOCKED themselves.

## Data
None. No entity, field or status is added while Q1 is open (`domain-glossary` §3 and §5).

## Acceptance criteria
None. Every story of the epic is BLOCKED (see below).

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| KAN-78 — Register a new collaborator (name, email, role/permission, services they can serve) | Q1 — collaborator | Whole story |
| KAN-79 — Email invitation so the collaborator activates their own account and password | Q1 — collaborator | Whole story |
| KAN-80 — Edit an existing collaborator's data | Q1 — collaborator | Whole story |
| KAN-81 — Deactivate a collaborator (temporary or indefinite leave) | Q1 — collaborator | Whole story |
| KAN-82 — Reactivate a previously deactivated collaborator | Q1 — collaborator | Whole story |
| KAN-83 — List collaborators, filter by active/inactive, paginated (backend), with their profile | Q1 — collaborator | Whole story |
| KAN-84 — Resend the verification or password-reset email to a collaborator | Q1 — collaborator | Whole story |
| KAN-85 — Warn when the plan's collaborator limit is exceeded and offer a plan upgrade | Q1 — collaborator | Whole story |
| KAN-86 — Define what each collaborator can and cannot do in the panel (permissions/roles) | Q1 — collaborator | Whole story |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| — | None while the epic is BLOCKED. | — |

## Backlog issues
- Q1 lists KAN-78, 79, 84, 85, 86 as the collaborator stories, but KAN-80, KAN-81, KAN-82 and KAN-83 are in the same epic and are also collaborator-only. They are BLOCKED on Q1 too; `open-questions.md` should list them.
- The epic is named "Gestion Colaboradores" in the CSV and "Colaboradores" in `epic-map.md` (missing accent in "Gestión" as well).
- KAN-83 says "paginado" twice ("paginado con su perfil de forma paginada"); the "with their profile" part is unclear (list with a profile link, or profile inside the list).
- KAN-78 mixes "rol/permiso" into registration while KAN-86 defines permissions as its own story. The two overlap; decide which one owns the permission model if Q1 keeps the collaborator.
- KAN-85 overlaps KAN-44 (upgrade plan, KAN-32) and depends on a collaborator limit in `Plan.limits` (KAN-181), which also mentions "número de colaboradores". If Q1 removes the collaborator, KAN-181 must drop that limit too.
- KAN-84 (resend verification / password reset) overlaps the auth epic's recovery flow (KAN-28); it should reuse it rather than define a second flow.
- If Q1 removes the collaborator, this epic and the collaborator parts of KAN-61, 67, 68, 103, 105, 134–138, 142 and 152 should be closed in Jira.

## Non-functional
- i18n keys: none yet. The prefix `business:collaborators.*` is reserved for this epic.
- Pagination (KAN-83), idle timeout (`PlatformSettings.idleTimeoutMinutes`), read-only rule (`business:errors.readOnly`, KAN-49) and isolation between businesses will apply once Q1 is decided.
- Accessibility: not applicable until specified.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-78 | — (BLOCKED, Q1) | `tests/CollaboratorFormScreen.test.tsx` (to be written after Q1) |
| KAN-79 | — (BLOCKED, Q1) | `functions/src/collaborators/tests/inviteCollaborator.test.ts` (to be written after Q1) |
| KAN-80 | — (BLOCKED, Q1) | `tests/CollaboratorFormScreen.test.tsx` (to be written after Q1) |
| KAN-81 | — (BLOCKED, Q1) | `tests/CollaboratorListScreen.test.tsx` (to be written after Q1) |
| KAN-82 | — (BLOCKED, Q1) | `tests/CollaboratorListScreen.test.tsx` (to be written after Q1) |
| KAN-83 | — (BLOCKED, Q1) | `tests/CollaboratorListScreen.test.tsx` (to be written after Q1) |
| KAN-84 | — (BLOCKED, Q1) | `tests/CollaboratorListScreen.test.tsx` (to be written after Q1) |
| KAN-85 | — (BLOCKED, Q1) | `tests/CollaboratorFormScreen.test.tsx` (to be written after Q1) |
| KAN-86 | — (BLOCKED, Q1) | `tests/CollaboratorPermissionsScreen.test.tsx` (to be written after Q1) |
