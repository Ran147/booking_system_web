# Tooling setup

Run these once the Vite + React + TypeScript project is created (code phase). They install what `eslint.config.js`, `.prettierrc.json` and the skills expect.

## Dev dependencies

```bash
npm install -D eslint@9 @eslint/js typescript-eslint globals \
  eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y \
  eslint-plugin-import-x eslint-import-resolver-typescript eslint-plugin-i18next \
  eslint-config-prettier prettier \
  vitest jsdom @vitest/coverage-v8 \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom \
  @firebase/rules-unit-testing firebase-tools
```

## Runtime dependencies

```bash
npm install react-router @tanstack/react-query firebase \
  react-hook-form zod @hookform/resolvers \
  i18next react-i18next i18next-browser-languagedetector \
  clsx tailwind-merge class-variance-authority
```

Tailwind CSS v4 and shadcn/ui are added with their own CLIs (`npx shadcn@latest init`); generated components go to `src/shared/components/ui/`.

## package.json scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "typecheck": "tsc -b --noEmit",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:rules": "firebase emulators:exec --only firestore \"vitest run tests/rules\"",
    "emulators": "firebase emulators:start"
  }
}
```

`package.json` must also have `"type": "module"` so `eslint.config.js` loads.

## tsconfig paths

`tsconfig.json` only references `tsconfig.app.json` (browser code in `src/`) and `tsconfig.node.json` (`vite.config.ts`, `vitest.config.ts`, `tests/`), so `typecheck` uses `tsc -b` to check both.

`tsconfig.app.json` needs `"baseUrl": "."`, `"paths": { "@/*": ["src/*"] }`, `"strict": true`, `"resolveJsonModule": true` and `"types": ["vitest/globals"]`. `vite.config.ts` needs the same `@` alias.

## Verified versions

The examples in every skill were type-checked, linted and formatted with: TypeScript 5.9, React 19, ESLint 9.39, Prettier 3.9, TanStack Query 5, React Router 8, Zod 4, React Hook Form 7, i18next 26, Firebase 12.

## Added when the project was scaffolded

- Build: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `@types/react`, `@types/react-dom`, `@types/node`.
- shadcn/ui runtime: `radix-ui`, `sonner`, `lucide-react`, `tw-animate-css`. The shadcn registry was not reachable when scaffolding, so `src/shared/components/ui/` holds hand-copied new-york sources for button, card, input, label, form and sonner. Add more with `npx shadcn@latest add <component>`.
