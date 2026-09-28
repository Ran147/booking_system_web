---
name: backlog-to-spec
description: Use when turning a Jira KAN epic or story into a feature spec, when creating or updating any specs/SPEC.md, or when asked to write acceptance criteria. Defines the SPEC.md template, how every criterion cites its KAN key (or PROP key for a proposed story not yet in Jira), the mandatory happy and error cases per story, how open decisions mark a spec as BLOCKED, and how stories out of the MVP are listed as Deferred.
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
| Decisions (Q1–Q7, all decided on 2026-09-28) and proposed stories (`PROP-n`) | `docs/decisions/open-questions.md` |
| Vocabulary and state machines | `domain-glossary` |

The stories have titles but **no acceptance criteria**. This skill writes them.

## 2. Procedure

1. **Collect.** Read the epic row and every story whose `Clave principal` is the epic. List them in key order.
2. **Locate.** Find the feature folder in `epic-map.md`. The spec goes to `<feature>/specs/SPEC.md`: one spec per epic. When `epic-map.md` sends two epics to the same folder (`features/auth`, `portals/customer/layout`), one `SPEC.md` covers both and lists both epic keys in its title.
3. **Check decisions.** Every story ends in exactly one of three places:
   - **Acceptance criteria** — the normal case.
   - **BLOCKED** — it depends on a question that is still open in `open-questions.md`. List it with its question id; it gets no criteria yet. A story can be partly in criteria and partly BLOCKED (name the blocked part).
   - **Deferred (out of MVP)** — the team decided it is not built in the MVP (for example KAN-48 / KAN-50 by Q5). List it with the reason and the decision; it gets no criteria. It is not a failure of the spec.
   When a decision unblocks a story, move it to criteria, continue its id numbering, strike through criteria the decision invalidates, and remove its BLOCKED row.
4. **Proposed stories.** When a decision needs a story that Jira does not have yet, add it with the next free key `PROP-<n>` (keys are unique across the repository and listed in `open-questions.md`). Its heading ends with "(Proposed — not in Jira yet)", its criteria ids are `AC-PROP-<n>-<two digits>` and they end with `[PROP-<n>]`. Once the story exists in Jira, add the KAN key next to the PROP key; the ids do not change.
5. **Clean up, don't rewrite.** Translate each story into English using `domain-glossary` terms. Fix obvious typos silently. Report duplicates and contradictions (for example, KAN-48 and KAN-50 have the same text) in "Backlog issues" instead of merging them on your own.
6. **Write criteria.** For every story in criteria (KAN or PROP), write:
   - at least one **happy-path** criterion,
   - at least one **error** criterion (invalid input, missing permission, conflict, network or server failure),
   - edge cases where the story implies them (empty list, limits, time zone, concurrency).
7. **Mark assumptions.** Any detail the story does not state (a limit, a time window, a default) is written as an **assumption** with an id (`AS-1`) and never presented as a requirement. The team confirms or corrects it.
8. **Trace.** Fill the traceability table: every KAN or PROP key → its criteria → the test file that will cover them (BLOCKED and Deferred stories appear with that word instead of criteria).
9. **Review.** Run the checklist (§7). A spec is ready when the team approves it in the PR.

## 3. Criterion format

```
- [ ] **AC-KAN-58-02** · error · Given a subscriber of a business whose status is `suspended`,
      when they try to deactivate a service, then the action is rejected and the message
      `business:errors.readOnly` is shown. [KAN-58, KAN-49]
```

- Id: `AC-<KAN key>-<two digits>` (for example `AC-KAN-58-02`), or `AC-PROP-<n>-<two digits>` for a proposed story (for example `AC-PROP-1-03`). Ids never change once published; removed criteria are struck through (`~~…~~` plus a short reason), not renumbered, and new criteria continue the story's numbering.
- Type: `happy`, `error` or `edge`.
- Given / When / Then, in English, observable from outside (UI, data, email). No implementation details (no component or hook names).
- Every criterion ends with the KAN or PROP key(s) it covers in brackets.
- Statuses, roles and entities use the exact `domain-glossary` names in backticks.
- Visible messages are referenced by i18n key, not by text, so the spec does not go stale when copy changes.

## 4. SPEC.md template

````md
# <Epic title in English> (<Epic key>)

| Field | Value |
| --- | --- |
| Portal | landing / business / customer / admin |
| Feature folder | `src/portals/<portal>/features/<feature>/` |
| Stories | KAN-…, KAN-… (and PROP-… when the spec has proposed stories) |
| Status | Draft / Ready / BLOCKED (partially) / BLOCKED |
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

### PROP-n — <story title> (Proposed — not in Jira yet)
- [ ] **AC-PROP-n-01** · happy · Given …, when …, then … [PROP-n]
- [ ] **AC-PROP-n-02** · error · Given …, when …, then … [PROP-n]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| KAN-… | Q8 — <open question> | … |

(Or "None." when no story depends on an open question.)

## Deferred (out of MVP)
Not criteria. Stories the team decided not to build in the MVP.

| Story | Why | Note |
| --- | --- | --- |
| KAN-… | Q5: … | … |

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
| PROP-n | AC-PROP-n-01, AC-PROP-n-02 | `tests/<Screen>.test.tsx` |
| KAN-zz | Deferred, out of MVP (Q5) | — |
````

The "Deferred (out of MVP)" section and PROP stories are optional: include them only when the spec has such stories.

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

Problems: no KAN keys or ids, no error case, untestable wording, and it invents a collaborator notification that no story asks for (an unstated detail must be an assumption, not a requirement).

---

## 6. Enforced by

| Rule | Tool |
| --- | --- |
| Every story of the epic appears (as criteria, BLOCKED or Deferred) | Review against the CSV; the PR lists the epic's keys |
| Every criterion has an id and a KAN or PROP key; no id appears twice | Review; `grep -oE "AC-(KAN|PROP)-[0-9]+-[0-9]{2}"` over all `SPEC.md` files, then `sort | uniq -d` must print nothing |
| At least one happy and one error criterion per story in criteria | Review (checklist below) |
| Criteria covered by tests | `unit-testing-standards` (test names start with the KAN key) |

## 7. Checklist

- [ ] One spec per epic (or per shared folder), in the feature folder from `epic-map.md`.
- [ ] Every story of the epic is in "Acceptance criteria", in "BLOCKED" with its open question id, or in "Deferred (out of MVP)" with the decision that deferred it.
- [ ] Every criterion has an `AC-KAN-…` or `AC-PROP-…` id, a type, Given / When / Then and its KAN or PROP key; ids are unique and never renumbered.
- [ ] Every proposed story uses a `PROP-n` key listed in `open-questions.md` and is marked "Proposed — not in Jira yet".
- [ ] Every story in criteria has at least one `happy` and one `error` criterion.
- [ ] Names, statuses and roles match `domain-glossary`; messages are i18n keys.
- [ ] Nothing depends on an open decision without being marked BLOCKED; nothing deferred has criteria.
- [ ] Unstated details are listed as assumptions, not as requirements.
- [ ] Duplicates and contradictions are reported in "Backlog issues".
- [ ] The traceability table is complete.
