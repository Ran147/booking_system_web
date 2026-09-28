# AGENTS.md

Guide for AI coding agents (GitHub Copilot, Google Antigravity, Claude Code and others) working in **booking_system_web**: a multi-tenant booking SaaS with four portals — `landing`, `business` (subscriber and collaborators), `customer` and `admin`.

Stack: React + TypeScript (Vite, React Router) · Firebase (Auth, Firestore, Cloud Functions, App Check, Hosting) · TanStack Query + React Context · Tailwind CSS v4 + shadcn/ui · React Hook Form + Zod · react-i18next (es, en) · Vitest + Testing Library + Firebase Emulator.

## 1. Before you write code

1. **Find the spec.** Every feature has `specs/SPEC.md` in its folder. If it does not exist, create it first with the `backlog-to-spec` skill. Do not implement from a vague prompt.
2. **Load the skills for the task** (table below). Each skill is `.agents/skills/<name>/SKILL.md`.
3. **Respect decisions.** Q1–Q7 are decided (`docs/decisions/open-questions.md`). Anything still marked `BLOCKED` is not implemented or invented; stories under "Deferred (out of MVP)" are not built; `PROP-n` stories are proposals not yet in Jira: create the Jira story before implementing one.
4. **Check your work** with the commands in §4 before saying you are done.

## 2. Which skills to load

| If the task is… | Load |
| --- | --- |
| Any TypeScript or TSX change | `code-style-standards` (always) |
| Naming a domain concept, a status, a collection or a field | `domain-glossary` |
| Turning a KAN story or epic into a spec, or writing acceptance criteria | `backlog-to-spec`, `domain-glossary` |
| A new feature, page or screen | `component-architecture`, `component-standards`, `state-management`, `i18n-standards` |
| Rendering UI elements, creating a shared component | `component-standards`, `theming-standards`, `i18n-standards` |
| Any text a person reads (labels, messages, emails, exports) | `i18n-standards` |
| A technical string or a number in code | `constants-standards` |
| Colors, dark mode, status badges | `theming-standards` |
| Deciding where state lives, filters in the URL, a new Context | `state-management` |
| Reading data, lists, pagination, search, realtime, export | `api-query-standards`, `auth-and-roles` |
| Creating, updating, deleting, status changes, Cloud Functions | `api-mutation-standards`, `auth-and-roles`, `domain-glossary` |
| Forms and validation | `forms-validation-standards`, `i18n-standards`, `api-mutation-standards` |
| Sign-in, roles, route guards, `firestore.rules`, idle logout, reCAPTCHA | `auth-and-roles` |
| Writing or reviewing tests | `unit-testing-standards` |

## 3. Precedence between skills

When two skills seem to disagree, the higher one wins:

1. **Tooling** — ESLint, Prettier and `tsc` (`eslint.config.js`, `.prettierrc.json`, `tsconfig.json`). If a skill contradicts them, the skill is wrong and must be fixed.
2. **`auth-and-roles`** — security, permissions, tenant isolation.
3. **`domain-glossary`** — names, statuses and transitions.
4. **Topic owners**, each on its own topic:
   - visible text → `i18n-standards` (over `constants-standards`)
   - technical literals and numbers → `constants-standards`
   - colors and tokens → `theming-standards` (over `component-standards`)
   - structure and logic → `component-architecture` (over `component-standards`)
   - which primitive → `component-standards`
   - where state lives → `state-management`
   - reads → `api-query-standards`; writes → `api-mutation-standards`
   - forms → `forms-validation-standards`
   - spec format → `backlog-to-spec`; tests → `unit-testing-standards`
5. **`code-style-standards`** — the base layer for everything not covered above.

## 4. Commands

| Command | Does |
| --- | --- |
| `npm run dev` | Vite dev server (uses the Firebase emulators when `VITE_USE_EMULATORS=true`) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (write) · `npm run format:check` to verify |
| `npm run typecheck` | `tsc -b --noEmit` (app and tool configs) |
| `npm run test:run` | Unit and component tests |
| `npm run test:rules` | `firestore.rules` tests against the emulator |
| `npm run emulators` | Firebase Emulator Suite |
| `npm run seed` | Test accounts (super admin, subscriber, collaborator, customer, subscriber of a pending business), an active and a pending business in the emulators only (`scripts/seed-emulator.ts`; needs `FIRESTORE_EMULATOR_HOST` and `FIREBASE_AUTH_EMULATOR_HOST`) |

Before finishing a task: `npm run lint && npm run typecheck && npm run test:run` must pass (plus `npm run format:check`, `npm run build`, and `npm run test:rules` when `firestore.rules` changed). There is no CI for now: these checks are run locally before each PR. CI can be re-enabled later.

## 5. Repository map

```
.agents/skills/          # the skills listed above
docs/backlog/            # jira-export.csv, epic-map.md (epic → portal → folder)
docs/decisions/          # open-questions.md (Q1–Q7, all decided) and ADRs
functions/               # Cloud Functions (emails, payments, bookings, exports, audit)
src/app/                 # App, providers, router
src/portals/<portal>/    # landing | business | customer | admin: routes, layout, features/
src/features/            # features shared by several portals (auth)
src/shared/              # components, constants, domain, hooks, lib, types, utils, test-utils
src/i18n/                # i18n setup and locales/{es,en}
src/styles/tokens.css    # design tokens (light / dark)
firestore.rules          # the security boundary
```

## 6. Hard rules

- Never commit secrets. Firebase web config comes from `.env.local` (`VITE_FIREBASE_*`), which is git-ignored.
- Never weaken `firestore.rules` to make a feature work.
- Never read `businessId` from the URL or a form in the business portal.
- Never add a status, role, field or screen for a `BLOCKED` question.
- Never write user-visible text in code. It goes to `src/i18n/locales/{es,en}`.
- Never disable a lint rule inline to get green. Fix the code, or propose a change to the rule and the skill.
- Do not add dependencies (state libraries, UI kits, date libraries) without the team's agreement.
