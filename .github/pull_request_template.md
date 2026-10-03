# US-XX: título de la historia

> Base del PR: **`develop`** (nunca `main`).

## Qué resuelve

<!-- La historia de usuario completa y, en una o dos frases, qué hace este cambio. KAN- / PROP-n -->
Como <rol>, quiero <objetivo>, para <beneficio>.

## Cambios

<!-- Tabla de archivos nuevos y modificados con su rol. -->

| Archivo | Estado | Rol |
| --- | --- | --- |
| | nuevo / editado | |

## Cómo se verificó

<!-- Comandos ejecutados y su resultado real. No marques nada que no hayas corrido. -->

- [ ] `npm run format:check` (Prettier) pasa sin advertencias
- [ ] `npm run lint` (ESLint) pasa con 0 errores y 0 warnings
- [ ] `npm run typecheck` (TypeScript) compila sin errores
- [ ] `npm run test:run` (Vitest) pasa el 100% de las pruebas
- [ ] `npm run test:rules` (si se modificó `firestore.rules`)
- [ ] `npm run test:e2e` (si se modificó un flujo crítico: login, reservar, pagar)
- [ ] Verificado visualmente con `npm run dev` en modo claro y oscuro

Notas de la verificación:

## Checklist de skills del proyecto

Marcá solo lo que revisaste de verdad.

- [ ] **code-style-standards** — componentes y hooks con `const Nombre = () => {}`, export explícito, sin nombres abreviados (`error` no `err`, `event` no `e`, `index` no `idx`, `button` no `btn`).
- [ ] **component-architecture** — el módulo vive en `src/modules/<modulo>/`, la lógica está en un `use*ViewModel`, ningún return de JSX supera ~80–100 líneas y se documentaron contratos JSDoc en `models/*.model.*`.
- [ ] **component-standards** — se reusaron los componentes de `src/components/common/`; no hay `<button>`, `<input>`, `<select>`, `<textarea>`, spinners ni modales crudos dentro de `src/modules/`.
- [ ] **constants-standards** — cero strings técnicos o números mágicos en el código; todo en `src/constants/` en `SCREAMING_SNAKE_CASE`, ordenado alfabéticamente A→Z en cada nivel y con `Object.freeze()`. Textos visibles en `src/i18n/locales/`.
- [ ] **dynamic-theming-standards** — uso exclusivo de tokens semánticos (`bg-background`, `text-foreground`, `bg-card`, `border-border`, etc.); ningún color estático de Tailwind. Probado en modo claro y oscuro (RNF-05).
- [ ] **git-workflow** — rama `US-XX` creada desde `develop`, commits atómicos en español e imperativo sin tildes en el asunto, PR apuntando a `develop`.

## Alcance y Fronteras

- [ ] El diff no toca archivos ajenos a esta historia (sin refactors de paso / "drive-by refactors").
- [ ] No se incluyen secretos, credenciales, `.env` ni carpetas temporales (`graphify-out/`).
- [ ] Si el review revela un error de proceso o lección aprendida, se documenta en el registro correspondiente.
