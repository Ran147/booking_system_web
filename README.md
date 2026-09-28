# booking_system_web

SaaS multi-tenant de reservas. Cada negocio (suscriptor) publica sus servicios y su agenda, y sus clientes reservan en línea. La aplicación tiene cuatro portales:

| Portal | Ruta | Quién lo usa |
| --- | --- | --- |
| `landing` | `/` | Visitantes: planes, contacto, alta de suscriptores |
| `business` | `/business` | Suscriptor (dueño del negocio), rol `subscriber`; colaboradores del negocio, rol `collaborator`, con los permisos que el suscriptor les habilita (Q1) |
| `customer` | `/<slug-del-negocio>` (por ejemplo `/barberia-centro/...`, Q4) | Clientes del negocio, rol `customer` |
| `admin` | `/admin` | Super administrador, rol `super_admin` |

Cada negocio tiene un `slug` único (minúsculas, apto para URL) y su portal de clientes vive en `/<slug>`. Las rutas fijas (`/business`, `/admin`, `/sign-in`, `/sign-up`, `/contact`, `/password-recovery`) tienen prioridad y son slugs reservados (`RESERVED_BUSINESS_SLUG` en `src/shared/domain`): ningún negocio puede usarlos.

Este repositorio es el **esqueleto base**: configuración, fundamentos compartidos y los cuatro portales como carcasas vacías. Ninguna funcionalidad de las specs está implementada todavía; cada carpeta de feature solo contiene su `specs/SPEC.md`.

**Stack:** React 19 + TypeScript 5.9 (Vite 8, React Router 8) · Firebase 12 (Auth, Firestore, Cloud Functions, App Check, Hosting) · TanStack Query 5 + React Context · Tailwind CSS v4 + shadcn/ui · React Hook Form + Zod · react-i18next (es, en) · Vitest + Testing Library + Firebase Emulator Suite.

## Requisitos

- **Node.js 22** y npm 10 (`node -v`).
- **Java 21 o superior**, solo para el Firebase Emulator Suite (`java -version`).
- Firebase CLI: viene como dependencia de desarrollo (`npx firebase …`); no hace falta instalarla global.
- VS Code con las extensiones recomendadas (`.vscode/extensions.json`): ESLint, Prettier, Tailwind, i18n Ally, Vitest.

## Puesta en marcha

1. Clonar el repositorio y entrar a la carpeta:

   ```bash
   git clone <url-del-repo> booking_system_web
   cd booking_system_web
   ```

2. Instalar dependencias exactamente como están en `package-lock.json`:

   ```bash
   npm ci
   ```

3. Crear el archivo de entorno local (está en `.gitignore`, nunca se sube):

   ```bash
   cp .env.example .env.local
   ```

   Con `VITE_USE_EMULATORS=true` (valor por defecto) la app se conecta a los emuladores y funciona sin llenar nada más: los valores vacíos usan el proyecto `demo-booking-system`, que corre sin conexión.

4. Proyecto de Firebase de desarrollo (cuando haga falta un backend real):
   1. Crear un proyecto en la [consola de Firebase](https://console.firebase.google.com) (por ejemplo `booking-system-dev`).
   2. Activar **Authentication** (correo y contraseña), **Firestore**, **Functions** (requiere plan Blaze) y **App Check** con reCAPTCHA Enterprise.
   3. En *Configuración del proyecto → Tus apps*, registrar una app web y copiar sus valores en las variables `VITE_FIREBASE_*` de `.env.local`. La clave del sitio de reCAPTCHA Enterprise va en `VITE_RECAPTCHA_ENTERPRISE_SITE_KEY`.
   4. Vincular la CLI al proyecto: `npx firebase login` y `npx firebase use --add` (reemplaza el alias `default` de `.firebaserc`, que hoy apunta a `demo-booking-system`).
   5. Poner `VITE_USE_EMULATORS=false` en `.env.local` para hablar con el proyecto real.

5. Levantar los emuladores (Auth, Firestore, Functions, Storage, Hosting; interfaz en http://127.0.0.1:4000):

   ```bash
   npm run emulators
   ```

6. En otra terminal, levantar la app (http://localhost:5173):

   ```bash
   npm run dev
   ```

### Datos de prueba

`npm run seed` (`scripts/seed-emulator.ts`) carga en los emuladores un super admin; un suscriptor dueño del negocio `active` «Barbería Centro» (slug `barberia-centro`, zona horaria, horario de atención, suscripción `active` al plan Pro y tres servicios); un colaborador de ese negocio con permisos `manage_bookings` y `manage_schedule_blocks`; un segundo suscriptor dueño de «Estética Luna» (slug `estetica-luna`), negocio `pending` que pagó y espera la aprobación del super admin (sin suscripción todavía); un cliente y dos planes. Pone los custom claims `role`, `businessId` y, para el colaborador, `collaboratorId`. Se puede correr varias veces: siempre deja los mismos datos. Al terminar imprime las credenciales.

Solo corre contra los emuladores: si faltan `FIRESTORE_EMULATOR_HOST` y `FIREBASE_AUTH_EMULATOR_HOST` se niega a ejecutarse. Dos formas:

```bash
# Con los emuladores ya levantados (npm run emulators) en otra terminal
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 npm run seed

# O todo en un paso (levanta Auth y Firestore, carga los datos y los apaga)
npx firebase emulators:exec --only auth,firestore --project demo-booking-system "npm run seed"
```

Los datos del emulador se borran al apagarlo; con `npm run emulators` hay que volver a correr el seed cada vez. Usuarios (contraseña de prueba `Emulator-Only-123!`, **solo para el emulador**): `admin@demo.test` (super admin), `suscriptor@demo.test` (suscriptor de «Barbería Centro»), `colaborador@demo.test` (colaborador de «Barbería Centro»), `pendiente@demo.test` (suscriptor de «Estética Luna», pendiente de aprobación) y `cliente@demo.test` (cliente).

### Cloud Functions

`functions/` es un paquete aparte (TypeScript, Node 22):

```bash
cd functions
npm ci
npm run build
```

`functions/src/index.ts` todavía no exporta ninguna función. Las carpetas `audit/`, `billing/`, `bookings/`, `exports/`, `notifications/` y `shared/` están listas para sus specs.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `npm run dev` | Servidor de desarrollo de Vite |
| `npm run build` | Chequeo de tipos (`tsc -b`) y build de producción en `dist/` |
| `npm run preview` | Sirve el build de `dist/` |
| `npm run lint` | ESLint (las reglas refuerzan las skills) |
| `npm run format` | Prettier en modo escritura |
| `npm run format:check` | Verifica el formato sin cambiar archivos |
| `npm run typecheck` | `tsc -b --noEmit` sobre el código de la app y los archivos de configuración |
| `npm test` | Vitest en modo watch |
| `npm run test:run` | Tests unitarios y de componentes, una sola vez |
| `npm run test:coverage` | Tests con cobertura (mínimo 70 % de líneas en portales, features y dominio) |
| `npm run test:rules` | Tests de `firestore.rules` contra el emulador (`tests/rules/`); no forman parte de `test:run` |
| `npm run emulators` | Firebase Emulator Suite |
| `npm run seed` | Carga datos de prueba en los emuladores (ver «Datos de prueba») |

Antes de abrir un PR: `npm run lint && npm run format:check && npm run typecheck && npm run test:run` (y `npm run test:rules` si cambió `firestore.rules`). No hay CI por ahora: estos chequeos se corren localmente.

## Estructura

```
.agents/skills/        # skills para agentes de IA y personas (una por tema)
.github/               # plantilla de PR, instrucciones de Copilot (sin CI por ahora)
docs/backlog/          # export de Jira, mapa épica → carpeta, notas de revisión de specs
docs/decisions/        # preguntas abiertas (Q1–Q7) y ADRs
docs/setup/tooling.md  # dependencias y configuración de herramientas
functions/             # Cloud Functions (paquete aparte)
scripts/               # herramientas locales (seed de los emuladores)
src/app/               # App, providers (Query, i18n, Theme, Auth) y router
src/portals/<portal>/  # <portal>.routes.tsx, layout/, placeholder/ y features/
src/features/auth/     # sesión, roles y guards compartidos por los portales
src/shared/            # components, constants, domain, hooks, lib, types, utils, test-utils
src/i18n/              # configuración de i18next y locales/{es,en}
src/styles/tokens.css  # tokens de diseño (claro / oscuro)
tests/rules/           # tests de reglas de Firestore (emulador)
firestore.rules        # la frontera de seguridad multi-tenant
```

La carpeta `placeholder/` de cada portal es temporal: se reemplaza por la primera ruta real del portal y se borra.

Los componentes de shadcn/ui se agregan con `npx shadcn@latest add <componente>` (configuración en `components.json`); quedan en `src/shared/components/ui/` y se exportan desde `src/shared/components/index.ts`. Las features nunca importan `ui/` directamente.

## Skills, specs y decisiones

- **`AGENTS.md`** es el punto de entrada: dice qué skill cargar para cada tarea y cuál gana cuando dos se contradicen. Copilot, Antigravity y Claude Code lo leen.
- **Skills:** `.agents/skills/<nombre>/SKILL.md` (estilo de código, constantes, i18n, theming, componentes, arquitectura, estado, queries, mutations, formularios, auth y roles, tests, glosario del dominio, backlog → spec).
- **Specs:** cada feature tiene `specs/SPEC.md` en su carpeta, con criterios de aceptación citando la clave KAN. El mapa épica → carpeta está en `docs/backlog/epic-map.md`.
- **Decisiones:** `docs/decisions/open-questions.md`. Q1–Q7 están decididas (2026-09-28) y ya están en las specs y en `domain-glossary`: Q1 colaborador como quinto actor, Q2 + Q3 aprobación de negocios nuevos por el super admin y tipos de acción de auditoría, Q4 URL por slug, Q5 sin reintentos de renovación en el MVP, Q6 cuenta de cliente obligatoria, Q7 contratación del plan desde la landing con la pasarela simulada. Si una pregunta nueva queda abierta, lo marcado **BLOCKED** no se implementa ni se inventa.
- **Propuestas:** historias que faltan en Jira están en las specs con claves `PROP-n` («Proposed — not in Jira yet») hasta que se creen en Jira.

## Flujo de trabajo y pull requests

1. **Una rama por historia o épica**, con su clave KAN: `feature/KAN-55-listado-servicios`, `fix/KAN-72-cancelacion`. Nunca se trabaja directo sobre `main`.
2. **Spec primero:** si la feature no tiene `specs/SPEC.md`, se crea con la skill `backlog-to-spec` antes de escribir código.
3. **Commits pequeños** que mencionan la clave KAN.
4. **Pull request contra `main`** usando la plantilla (`.github/pull_request_template.md`): qué cambia, historias KAN y el checklist (spec, tests con clave KAN, textos en `es` y `en`, modo claro y oscuro, reglas e índices, nada BLOCKED).
5. **Chequeos locales antes de cada PR:** no hay CI por ahora (el workflow se quitó en `main`). Quien abre el PR corre `npm run lint`, `npm run format:check`, `npm run typecheck`, `npm run test:run` y `npm run build`, y lo indica en el checklist. El PR necesita al menos una revisión antes de hacer merge. El CI se puede volver a activar más adelante.
6. Si cambian `firestore.rules`, se agregan sus tests en `tests/rules/` y se corre `npm run test:rules` localmente.

## Reglas que no se negocian

- No se suben secretos: la configuración de Firebase vive en `.env.local`.
- No se debilita `firestore.rules` para que algo funcione.
- En el portal de negocio, `businessId` sale de la sesión (custom claim), nunca de la URL ni de un formulario.
- Ningún texto visible en el código: todo va a `src/i18n/locales/{es,en}`.
- No se desactivan reglas de lint en línea; se corrige el código o se propone cambiar la regla y la skill.
