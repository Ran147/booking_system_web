---
name: backlog-to-spec
description: Use when turning a Jira KAN epic or story into a feature spec, when creating or updating any specs/SPEC.md, or when asked to write acceptance criteria. Defines the SPEC.md template, how every criterion cites its KAN key, the mandatory error case per story, and how open decisions mark a spec as BLOCKED.
---

# Backlog to Spec

This skill is the **single source of truth** for `specs/SPEC.md`: how it is produced from the Jira backlog (project KAN) and what it must contain. `component-architecture` requires a spec before implementation; this skill defines it.

## Precedence

| Topic | Owner |
| --- | --- |
| SPEC.md format, acceptance criteria, BLOCKED marking | **this skill** |
| Names, statuses and transitions used in the spec | `domain-glossary` |
| Permissions stated in the spec | `auth-and-roles` |
| Where the spec lives (feature folder) | `component-architecture` |
| How criteria become tests | `unit-testing-standards` |

---

## 1. Inputs

| Input | Location |
| --- | --- |
| Backlog export (epics and stories, titles only) | `docs/backlog/jira-export.csv` (columns `Clave de incidencia`, `Resumen`, `Tipo de Incidencia`, `Clave principal`) |
| Epic → portal → feature folder | `docs/backlog/epic-map.md` |
| Open decisions Q1–Q7 | `docs/decisions/open-questions.md` |
| Vocabulary and state machines | `domain-glossary` |

The stories have titles but **no acceptance criteria**. This skill writes them.

## 2. Procedure

1. **Collect.** Read the epic row and every story whose `Clave principal` is the epic. List them in key order.
2. **Locate.** Find the feature folder in `epic-map.md`. The spec goes to `<feature>/specs/SPEC.md`: one spec per epic. When `epic-map.md` sends two epics to the same folder (`features/auth`, `portals/customer/layout`), one `SPEC.md` covers both and lists both epic keys in its title.
3. **Check decisions.** For each story, check whether it depends on Q1–Q7. If it does, it goes in the BLOCKED section, with its question id, and gets no criteria yet.
4. **Clean up, don't rewrite.** Translate each story into English using `domain-glossary` terms. Fix obvious typos silently. Report duplicates and contradictions (for example, KAN-48 and KAN-50 have the same text) in "Backlog issues" instead of merging them on your own.
5. **Write criteria.** For every non-blocked story, write:
   - at least one **happy-path** criterion,
   - at least one **error** criterion (invalid input, missing permission, conflict, network or server failure),
   - edge cases where the story implies them (empty list, limits, time zone, concurrency).
6. **Mark assumptions.** Any detail the story does not state (a limit, a time window, a default) is written as an **assumption** with an id (`AS-1`) and never presented as a requirement. The team confirms or corrects it.
7. **Trace.** Fill the traceability table: every KAN key → its criteria → the test file that will cover them.
8. **Review.** Run the checklist (§5). A spec is ready when the team approves it in the PR.

## 3. Criterion format

```
- [ ] **AC-KAN-58-02** · error · Given a subscriber of a business whose status is `suspended`,
      when they try to deactivate a service, then the action is rejected and the message
      `business:errors.readOnly` is shown. [KAN-58, KAN-49]
```

- Id: `AC-<KAN key>-<two digits>`. Ids never change once published; removed criteria are struck through, not renumbered.
- Type: `happy`, `error` or `edge`.
- Given / When / Then, in English, observable from outside (UI, data, email). No implementation details (no component or hook names).
- Every criterion ends with the KAN key(s) it covers in brackets.
- Statuses, roles and entities use the exact `domain-glossary` names in backticks.
- Visible messages are referenced by i18n key, not by text, so the spec does not go stale when copy changes.

## 4. SPEC.md template

````md
# <Epic title in English> (<Epic key>)

| Field | Value |
| --- | --- |
| Portal | landing / business / customer / admin |
| Feature folder | `src/portals/<portal>/features/<feature>/` |
| Stories | KAN-…, KAN-… |
| Status | Draft / Ready / BLOCKED (partially) |
| Depends on | Other epics or specs this one needs |

## Intent
Who this is for and what outcome they get, in two or three sentences.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own business only) | … |

## In scope
- …

## Out of scope
- …

## Data
Entities, fields and statuses touched (links to `domain-glossary` sections). New fields are listed here.

## Acceptance criteria

### KAN-xx — <story title in English>
- [ ] **AC-KAN-xx-01** · happy · Given …, when …, then … [KAN-xx]
- [ ] **AC-KAN-xx-02** · error · Given …, when …, then … [KAN-xx]

### KAN-yy — …

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| KAN-… | Q1 — collaborator | … |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | … | AC-KAN-…-… |

## Backlog issues
- KAN-48 and KAN-50 have the same text. Treated as one story; KAN-50 should be closed in Jira.

## Non-functional
- i18n keys needed (namespace and prefix)
- Pagination, export, realtime, reCAPTCHA or idle-timeout requirements that apply
- Accessibility notes

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-xx | AC-KAN-xx-01, AC-KAN-xx-02 | `tests/<Screen>.test.tsx` |
````

## 5. Example (excerpt, epic KAN-30)

```md
### KAN-58 — Deactivate a service
- [ ] **AC-KAN-58-01** · happy · Given a subscriber and an `active` service of their business,
      when they deactivate it and confirm, then its status becomes `inactive`, it disappears
      from the public catalog (KAN-113) and it stays visible in their own list with its status badge. [KAN-58]
- [ ] **AC-KAN-58-02** · error · Given a subscriber whose business is `inactive` or `suspended`,
      when they try to deactivate a service, then nothing changes and `business:errors.readOnly`
      is shown. [KAN-58, KAN-49]
- [ ] **AC-KAN-58-03** · error · Given the request fails because of the network,
      when the subscriber confirms, then the service keeps its previous status and
      `common:errors.network` is shown. [KAN-58]
- [ ] **AC-KAN-58-04** · edge · Given an `active` service with `confirmed` future bookings,
      when it is deactivated, then those bookings are kept. See AS-2. [KAN-58]

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-2 | Deactivating a service does not cancel existing bookings; it only hides the service for new bookings. | AC-KAN-58-04 |
```

### Incorrect

```md
## Acceptance criteria
- The user can deactivate services.
- It should work fast and look good.
- The collaborator is notified when a service is deactivated.
```

Problems: no KAN keys or ids, no error case, untestable wording, and it invents behavior for the collaborator while Q1 is open.

---

## 6. Enforced by

| Rule | Tool |
| --- | --- |
| Every story of the epic appears (as criteria or BLOCKED) | Review against the CSV; the PR lists the epic's keys |
| Every criterion has an id and a KAN key | Review; `grep -E "AC-KAN-[0-9]+-[0-9]{2}"` in the PR |
| At least one error criterion per story | Review (checklist below) |
| Criteria covered by tests | `unit-testing-standards` (test names start with the KAN key) |

## 7. Checklist

- [ ] One spec per epic (or per shared folder), in the feature folder from `epic-map.md`.
- [ ] Every story of the epic is either in "Acceptance criteria" or in "BLOCKED" with its question id.
- [ ] Every criterion has an `AC-KAN-…` id, a type, Given / When / Then and its KAN key.
- [ ] Every non-blocked story has at least one `error` criterion.
- [ ] Names, statuses and roles match `domain-glossary`; messages are i18n keys.
- [ ] Nothing depends on an open decision without being marked BLOCKED.
- [ ] Unstated details are listed as assumptions, not as requirements.
- [ ] Duplicates and contradictions are reported in "Backlog issues".
- [ ] The traceability table is complete.
