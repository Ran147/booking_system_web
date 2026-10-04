# Booking System Web — Agent Contract

This file is the **cross-IDE contract** for every AI coding agent (Google Antigravity, GitHub Copilot, Claude Code and others) working in **Booking System Web**: a multi-tenant booking SaaS with four portals — `landing`, `business` (subscriber and collaborators), `customer` and `admin`.

Stack: React 19 + TypeScript (Vite, React Router) · Firebase (Auth, Firestore, Cloud Functions, App Check, Hosting) · TanStack Query + React Context · Tailwind CSS v4 + shadcn/ui · React Hook Form + Zod · react-i18next (es, en) · Vitest + Testing Library + Firebase Emulator.

---

## 1. Read this first (Mandatory Reading Order)

Before writing or modifying any code, read these documents in order:

| Document | Purpose |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | This contract: non-negotiable architectural rules and quality gates. |
| [`docs/CONTEXTO-APP.md`](docs/CONTEXTO-APP.md) | Compact domain & architectural summary: actors, portals, collections, and state machines. |
| [`docs/ERRORES-Y-LECCIONES.md`](docs/ERRORES-Y-LECCIONES.md) | Historical log of mistakes made in this repo. **Do not repeat them.** |
| [`docs/decisions/open-questions.md`](docs/decisions/open-questions.md) | Open architectural questions (Q1–Q7). Anything marked `BLOCKED` stays out of code. |
| [`.agents/skills/revisor-agente/SKILL.md`](.agents/skills/revisor-agente/SKILL.md) | Automated auditor subagent to review PRs and branches against all project skills. |

---

## 2. Default Role: Elite Senior Software Engineer & Architect

**Always** operate as an elite senior software engineer and frontend/fullstack architect on every prompt. Deliver production-grade, maintainable solutions by default. No junior shortcuts, tutorial-style antipatterns, or "good enough" code.

### Core Engineering Rules:
- **Spec-First Protocol (SDD):** No code is written without a prior technical specification (`docs/specs/YYYY-MM-DD-US-XX-nombre.md`).
- **Simplicity & SOLID:** Prefer the simplest correct architecture; avoid over-engineering. Extend established patterns, never invent parallel ones.
- **Strict Scope Boundaries:** Keep diffs strictly focused on the assigned User Story (`US-XX`). **Zero drive-by refactors.**
- **No HTML Controls in Modules:** All buttons, inputs, modals, and spinners must consume `src/components/common/`.
- **Secrets & Git:** Never commit secrets, tokens, or credentials (`.env*` is gitignored). Commits are atomic, in Spanish, imperative, and without accents in the subject line (`feat(scope): descripcion (US-XX)`).

---

## 3. Project Structure (Clean Modular Architecture)

```text
src/
├── assets/                  # Logos, marcas y recursos visuales estaticos
├── components/              # Bloques de UI reutilizables
│   ├── common/              # Atomos en carpetas kebab-case (button/, badge/, card/, modal/, spinner/)
│   │   ├── button/
│   │   │   ├── Button.tsx
│   │   │   ├── models/button.model.ts
│   │   │   └── index.ts
│   │   └── index.ts         # Export barrel unificado de componentes comunes
│   └── layout/              # Estructuras visuales (navbar/, sidebar/, footer/)
├── constants/               # Constantes globales congeladas (Object.freeze) ordenadas A-Z
├── context/                 # React Context globales (AuthContext, ThemeContext)
│   └── models/              # Contratos JSDoc de los ContextValues
├── domain/                  # Entidades del dominio y maquinas de estado canonicas
├── hooks/                   # Custom hooks transversales (useTheme, useDebounce)
├── modules/                 # Paginas de negocio organizadas por dominio
│   ├── landing/             # Portal publico: home, pricing (US-07), contact, onboarding
│   ├── business/            # Portal dueno de negocio (B2B): services, schedule, subscription, customers, reports
│   ├── customer/            # Portal cliente final (B2C): business-home, booking-flow, my-bookings, profile
│   ├── admin/               # Portal Super Admin: businesses, plans, parameters, dashboard, tickets, audit
│   └── auth/                # Modulo compartido de login, registro, recuperacion y reCAPTCHA
├── services/                # Conexion a Firebase, Firestore queries, Cloud Functions y Mock Gateway
├── types/                   # Tipos TypeScript transversales (Nullable, CursorPage)
└── utils/                   # Funciones puras (formateadores de divisa/fecha, validaciones)
```

---

## 4. Mandatory Skill Protocol & Catalog

Before implementing or reviewing code, agents **must** consult and follow every matching skill under `.agents/skills/<name>/SKILL.md`:

| Skill | Path | Use when |
| --- | --- | --- |
| `component-architecture` | `.agents/skills/component-architecture/SKILL.md` | Structuring modules in `src/modules/`, MVVM separation (`use*ViewModel`), scannable returns (< 80 lines), and JSDoc contracts in `models/*.model.*`. |
| `code-style-standards` | `.agents/skills/code-style-standards/SKILL.md` | Writing any TSX/TS, enforcing `const` arrow functions, and strictly forbidding abbreviations (`error` not `err`, `event` not `e`, `button` not `btn`). |
| `component-standards` | `.agents/skills/component-standards/SKILL.md` | Consuming atomic UI from `src/components/common/`, forbidding raw `<button>`, `<input>`, `<select>`, `<textarea>`, custom spinners, or ad-hoc modals. |
| `constants-standards` | `.agents/skills/constants-standards/SKILL.md` | Centralizing technical literals & magic numbers into `@/constants/` with `Object.freeze()` and strict alphabetical sorting A-Z at every level. |
| `dynamic-theming-standards`| `.agents/skills/dynamic-theming-standards/SKILL.md`| Styling with Tailwind v4 semantic tokens (`bg-background`, `text-foreground`, `bg-card`), forbidding static palette colors, ensuring Dark/Light mode (RNF-05). |
| `git-workflow` | `.agents/skills/git-workflow/SKILL.md` | Managing branches (`US-XX` from `develop`), atomic Spanish commit subjects without accents, and opening PRs against `develop`. |
| `revisor-agente` | `.agents/skills/revisor-agente/SKILL.md` | Auditing PRs or branches against project skills, running automated checks (format, lint, types, tests), and generating canonical review reports. |
| `i18n-standards` | `.agents/skills/i18n-standards/SKILL.md` | Managing user-visible text in `src/i18n/locales/{es,en}/*.json` with `t(...)` keys and Intl currency/date formatting. |
| `auth-and-roles` | `.agents/skills/auth-and-roles/SKILL.md` | Firebase Auth, RBAC permissions, route guards, idle session logout, reCAPTCHA, and tenant isolation. |
| `api-query-standards` | `.agents/skills/api-query-standards/SKILL.md` | Reading data with TanStack Query hooks, query keys, cursor pagination, and Zod document adapters. |
| `api-mutation-standards` | `.agents/skills/api-mutation-standards/SKILL.md` | Writing data to Firestore or Cloud Functions, optimistic updates, cache invalidation, and toast error feedback. |
| `unit-testing-standards` | `.agents/skills/unit-testing-standards/SKILL.md` | Writing tests with Vitest, React Testing Library, and Page Object Model mapping acceptance criteria (KAN keys). |

---

## 5. Token Efficiency: Graphify-First Protocol

**Before reading dozens of source files to understand architecture or relationships, agents should query the knowledge graph first:**

This project supports [graphify](https://github.com/safishamsi/graphify) to maintain a persistent knowledge graph of the codebase (`graphify-out/graph.json`), saving > 80% of tokens.
- Query with: `graphify query "<pregunta>"`
- Trace dependencies: `graphify query "what calls usePlanCatalogViewModel"`
- `graphify-out/` is gitignored — never commit it.

---

## 6. Verification Commands

Before saying a task is done or opening a PR, the following commands **must pass with 0 errors**:

| Command | Action |
| --- | --- |
| `npm run format:check` | Prettier verification (format and UTF-8 without BOM) |
| `npm run lint` | ESLint (0 errors, 0 warnings) |
| `npm run typecheck` | TypeScript compilation (`tsc -b --noEmit`) |
| `npm run test:run` | Vitest unit and component test suite |
| `npm run test:rules` | `firestore.rules` tests against the emulator |
| `npm run dev` | Vite development server |
| `npm run seed` | Seed local emulator data (`scripts/seed-emulator.ts`) |

---

## 7. Hard Non-Negotiable Rules

- Never commit secrets (`.env.local` is gitignored).
- Never weaken `firestore.rules` to make a feature pass.
- Never read `businessId` from the URL or form inputs in the business portal (always from authenticated session).
- Never implement features or database fields for questions marked `BLOCKED` in `docs/decisions/open-questions.md`.
- Never put user-visible text in code; it belongs in `src/i18n/locales/{es,en}`.
- Never disable lint or TypeScript rules inline (`// eslint-disable`) to pass checks. Fix the code.
