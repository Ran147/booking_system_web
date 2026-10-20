# Software Design Document (SDD) — US-33 (AC-KAN-33-09 … 12, AC-KAN-39-07)

## Pantallas de negocio "en revisión" y "rechazado"

| Metadato | Valor |
| --- | --- |
| **Historia** | KAN-33 (épica KAN-28). Criterios que el PR #8 dejó fuera: AC-KAN-33-09 … 12. También cierra AC-KAN-39-07 (KAN-29) y el lado del dueño de AC-KAN-27-06, AC-KAN-176-03 y AC-PROP-1-08 |
| **Portal** | Business (`src/modules/business/layout/`) |
| **Spec funcional** | `src/modules/auth/specs/SPEC.md` y `src/modules/business/layout/specs/SPEC.md` |
| **Rama** | `US-33-estado-negocio`, desde `develop` |
| **Fecha de Especificación** | 2026-10-17 |
| **Estado** | Aprobada (2026-10-17) |
| **Fuera de alcance** | Aprobar o rechazar desde el admin (KAN-208, KAN-176); nombre y logo reales en el sidebar (KAN-39) y botón de cerrar sesión del sidebar (KAN-42), que son del PR de KAN-29; el modo solo lectura de `inactive`/`suspended` (KAN-49) |

---

### 1. Resumen y Propósito

Q2 decidió que un negocio `pending` ya pagó y espera la aprobación del super admin, y que su dueño ve **solo** una pantalla de "en revisión". Si el super admin lo rechaza, ve **solo** la pantalla de "rechazado" con el motivo.

El PR #8 (US-33) dejó estas pantallas para el PR de KAN-29, y ese PR no las incluyó. Hoy un dueño `pending` entra al portal completo y ve el aviso rojo de "Tu negocio está inactivo o suspendido", que es el de KAN-49 (falta de pago), y la tarjeta "Estado del negocio" muestra la palabra cruda `pending`.

---

### 2. Estado actual del código

- `business.routes.tsx`: `RequireRole` (suscriptor o colaborador) → `BusinessLayout` → páginas. Nada revisa el estado del negocio antes de mostrar el portal.
- `useBusinessHomeViewModel` y `useServiceListViewModel` leen el estado por su cuenta y tratan todo lo que no es `active` como solo lectura. Si la lectura falla o el documento no existe, asumen `active`.
- La tarjeta "Estado del negocio" del home muestra el valor crudo (`pending`, `inactive`, `suspended`).
- `useSignOut` (US-38) ya existe y cierra la sesión de verdad.
- El registro (`completeSubscriberSignUp`) escribe en `businesses/{id}`: `name`, `status: "pending"`, `createdAt`, `timeZone`, `slug`, `ownerUserId` y `planCheckoutId`. **No escribe `planId`.**
- `firestore.rules` no abre `plans`, `planCheckouts` ni `businesses/{id}/payments` al cliente.
- La semilla ya tiene un dueño `pending` (`pendiente@demo.test`).

---

### 3. Criterios de Aceptación

| Id | Criterio (resumen) | Cobertura |
| --- | --- | --- |
| AC-KAN-33-09 | Un dueño de un negocio `pending` ve solo la pantalla "en revisión" (`business:pendingApproval.*`) con el nombre del negocio, el plan, la fecha de registro y la acción de cerrar sesión; ninguna otra pantalla del portal es accesible | Completa, salvo el **plan** (ver D-4) |
| AC-KAN-33-10 | Con la pantalla abierta, cuando el super admin aprueba, la siguiente revisión (al recargar o al volver a la pestaña) muestra el portal sin volver a iniciar sesión | Completa |
| AC-KAN-33-11 | Un dueño de un negocio `rejected` ve solo la pantalla "rechazado" (`business:rejected.*`) con el motivo, el contacto de la plataforma y la acción de cerrar sesión | Completa |
| AC-KAN-33-12 | Si el estado no se puede leer (red), no se muestra ningún dato del negocio; se muestra `common:errors.network` con una acción de reintentar | Completa |
| AC-KAN-39-07 | Con el negocio `pending` o `rejected`, cualquier URL del portal muestra la pantalla de estado y no el sidebar | Completa |

---

### 4. Decisiones de Arquitectura

#### 4.1 Estructura de archivos

```text
src/modules/business/
├── business.routes.tsx                         # editado: BusinessStatusGate antes de BusinessLayout
├── layout/
│   ├── api/
│   │   ├── BusinessGateDocument.schema.ts      # nuevo: Zod de los campos que necesita el portero
│   │   ├── businessLayoutQueryKeys.ts          # nuevo
│   │   ├── fetchBusinessGate.ts                # nuevo
│   │   ├── useBusinessGateQuery.ts             # nuevo: refetchOnWindowFocus
│   │   └── index.ts
│   ├── components/
│   │   ├── BusinessStatusGate/                 # nuevo: decide portal, revisión, rechazo, error o carga
│   │   ├── BusinessStatusScreen/               # nuevo: marco de página completa con cerrar sesión
│   │   ├── PendingApprovalScreen/              # nuevo (AC-KAN-33-09)
│   │   └── RejectedScreen/                     # nuevo (AC-KAN-33-11)
│   ├── constants/BusinessGateState.constants.ts  # nuevo
│   ├── hooks/useBusinessStatusGateViewModel.ts   # nuevo
│   ├── models/businessStatusGate.model.ts        # nuevo: contratos JSDoc
│   └── tests/BusinessStatusGate.test.tsx (+ .page.ts)  # nuevo
└── features/home/hooks/useBusinessHomeViewModel.ts  # editado: estado traducido en la tarjeta
src/i18n/locales/{es,en}/business.json            # pendingApproval.*, rejected.*, businessStatus.*, layout.statusGate.*
e2e/business-status.spec.ts                       # nuevo: el dueño pending de la semilla
```

Se rescatan y adaptan las pantallas del commit `5629d6e` (rama `US-39` que no se publicó).

#### 4.2 Decisiones

- **D-1. Un "portero" como elemento de ruta.** `BusinessStatusGate` va entre `RequireRole` y `BusinessLayout` en `business.routes.tsx` y renderiza `<Outlet />` solo cuando el negocio es `active`, `inactive` o `suspended`. Así `BusinessLayout` (KAN-29) no se toca y ninguna página del portal se monta para `pending` o `rejected`.
- **D-2. Lectura propia con Zod.** `fetchBusinessGate` lee `businesses/{businessId}` (el `businessId` sale de la sesión) y valida `name`, `status`, `createdAt?`, `rejectionReason?` y `timeZone?`. Si el documento no existe, es un error, no `active`.
- **D-3. Revisión al volver a la pestaña** (AS-9 de auth): `refetchOnWindowFocus: true` y sin listener en tiempo real. Si en la revisión el negocio pasó a `active`, se muestra el portal sin cerrar sesión (AC-KAN-33-10).
- **D-4. El plan no se muestra todavía.** `Business` no tiene `planId` y las reglas no dejan leer `planCheckouts`, `payments` ni `plans`. La fila del plan queda para cuando exista una lectura permitida (KAN-181, PR #18). La fecha de registro se muestra solo si existe `createdAt`.
- **D-5. Contacto de la plataforma** en la pantalla de rechazo: enlace `mailto:` al correo del footer de la landing (`DEFAULT_LANDING_FOOTER_CONFIG.EMAIL`). La página `/contact` (KAN-14) todavía no existe.
- **D-6. Error de lectura** (AC-KAN-33-12): página completa con el mensaje de `mapFirebaseError` y "Reintentar", sin sidebar ni datos del negocio. Mientras se lee, un `Spinner`.
- **D-7. Tarjeta del home.** "Estado del negocio" muestra `business:businessStatus.<estado>` en vez del valor crudo. No se cambia nada más del home ni de servicios: con el portero, `pending` y `rejected` ya no llegan a esas pantallas.

#### 4.3 Claves i18n nuevas (`business.json`, es y en)

`businessStatus.{active,inactive,pending,rejected,suspended}`, `pendingApproval.{businessLabel,description,signUpDateLabel,title}`, `rejected.{businessLabel,contactLabel,description,reasonLabel,title}`, `layout.statusGate.{retryAction,signOutAction}`. Se elimina `home.metrics.businessStatus.value`, que queda reemplazada por `businessStatus.active` (D-7). Sin motivo de rechazo, la fila del motivo no se muestra.

---

### 5. Plan de Pruebas

`BusinessStatusGate.test.tsx` con Page Object (`BusinessStatusGate.page.ts`), mockeando `fetchBusinessGate`:

| Test | Criterio |
| --- | --- |
| `pending` muestra "en revisión" con nombre y fecha, sin sidebar ni contenido del portal | AC-KAN-33-09, AC-KAN-39-07 |
| `pending` y luego `active` al recuperar el foco muestra el portal | AC-KAN-33-10 |
| `rejected` muestra el motivo y el contacto, sin sidebar | AC-KAN-33-11, AC-KAN-39-07 |
| Error de red muestra `common:errors.network` y "Reintentar" vuelve a leer | AC-KAN-33-12 |
| Documento inexistente se trata como error, no como `active` | AC-KAN-33-12 |
| `active`, `inactive` y `suspended` muestran el portal | D-1 |
| "Cerrar sesión" llama a `useSignOut` | AC-KAN-33-09, 11 |

E2E (`e2e/business-status.spec.ts`): `pendiente@demo.test` inicia sesión, ve "en revisión" en `/business` y en `/business/services`, y cierra sesión.

---

### 6. Verificación

`format:check`, `lint`, `typecheck`, `test:run` y `test:e2e`. `firestore.rules` no cambia.

---

### 7. Commits previstos

1. `docs(specs): especificacion de las pantallas de estado del negocio (US-33)`
2. `feat(business): pantallas de negocio en revision y rechazado (US-33)`
3. `fix(business): mostrar el estado del negocio traducido en el inicio (US-33)`
4. `test(e2e): dueno de negocio pendiente ve la pantalla de revision (US-33)`
