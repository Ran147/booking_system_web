# Software Design Document (SDD) — KAN-150
## Mis reservas del cliente (próximas, detalle, historial y filtros)

| Metadato | Valor |
|---|---|
| **Épica / Historias** | KAN-150 (KAN-151 próximas, KAN-152 detalle, KAN-153 historial, KAN-154 filtros) |
| **Portal** | Customer (`src/modules/customer/features/my-bookings/`) |
| **Fecha de Especificación** | 2026-10-16 |
| **Estado** | Aprobada para Implementación (2026-10-16: AS-1 a AS-6 y D-1 a D-4 confirmadas) |
| **Spec funcional (criterios AC)** | `src/modules/customer/features/my-bookings/specs/SPEC.md` (25 criterios; este documento **no** los repite, los implementa) |
| **Preguntas abiertas** | Ninguna `BLOCKED`. Q1 y Q4 decididas el 2026-09-28. |
| **Requerimientos Relacionados** | RNF-05 (Theming), RNF-08 (Accesibilidad), `auth-and-roles` §4 |

---

### 1. Resumen y Propósito
Un `customer` con sesión ve sus reservas en todos los negocios donde reservó: lista de próximas, historial, detalle de una reserva y filtros guardados en la URL. Es solo lectura. Reprogramar y cancelar (KAN-155) quedan fuera; el detalle solo muestra el punto de entrada cuando aplica.

Estado actual del repo (verificado):
- La rama `RequireRole` del cliente en `customer.routes.tsx` tiene `children: []`; no hay ruta ni constante en `ROUTE_PATH.CUSTOMER`.
- `Booking` no tiene `collaboratorId` ni `rescheduleHistory`; la semilla no crea reservas; `firestore.indexes.json` está vacío.
- `firestore.rules` solo permite leer reservas dentro de `businesses/{businessId}/bookings/{bookingId}` (también para el cliente dueño). **No hay regla de collection group**, así que una consulta por `customerUserId` entre negocios hoy se rechaza.
- `businesses/{id}` es de lectura pública (nombre, `slug`, logo; `timeZone` y moneda se leen del mismo documento). `collaborators` no es legible por el cliente.
- Reutilizables: `CursorPagination`, `useCursorPagination`, `Table`, `EmptyState`, `ErrorState`, `StatusBadge`/`BookingStatusLabel`, `formatDateTime`, `formatPrice`, `RequireRole`, `PAGINATION` (20 por página; opciones 10/20/50).

---

### 2. Supuestos a confirmar con producto (AS-1 … AS-6)
Se implementan los de la spec funcional tal cual. Si producto cambia alguno, se ajusta antes de PR B/C.

| Id | Supuesto | Impacto si cambia |
|---|---|---|
| AS-1 | La lista cubre **todos** los negocios del cliente | Alcance de la regla y la consulta (§4.2): pasaría a filtrar por el negocio del slug |
| AS-3 | Próximas = `pending`/`confirmed` con `startsAt` futuro; historial = el resto | Consultas e índices (§4.3) |
| AS-4 | El cliente ve `cancelledBy` e `isPenalized`, no `note` | Solo adaptador y UI |
| AS-5 | Filtros: estado (ambas), rango de fechas (historial), negocio (ambas); sin buscador | Índices (§4.3) y UI |
| AS-2 | Tamaño de página: `PAGINATION.DEFAULT_PAGE_SIZE` (20), total con `getCountFromServer` | Ninguno |

### 3. Decisiones técnicas que necesitan tu OK

| Id | Decisión | Recomendación |
|---|---|---|
| D-1 | **Nombre del colaborador (AS-6).** El cliente no puede leer `collaborators` y la "proyección pública" no existe. | Guardar un snapshot en la reserva: `Booking.collaboratorName: Nullable<string>`, escrito por la función de reserva (KAN-145) igual que `serviceSnapshot`. No abre ninguna lectura nueva, cumple AC-KAN-152-08 (el nombre persiste si el colaborador queda `inactive`) y no expone email/teléfono. Contrapartida: un renombre posterior del colaborador no se refleja en reservas ya hechas. Descartada: abrir `collaborators` al cliente (amplía superficie de datos personales) y colección pública espejo (parte nueva que mantener). |
| D-2 | **URL.** El portal vive en `/:businessSlug/...` (Q4), pero la lista abarca varios negocios (AS-1). | Rutas `/:businessSlug/my-bookings` (lista, pestañas Próximas/Historial) y `/:businessSlug/my-bookings/:bookingId` (detalle). El slug de la lista solo da contexto al layout y no filtra. Cada fila enlaza al detalle bajo el **slug de su propio negocio**; el detalle resuelve `businessId` desde ese slug y lee `businesses/{businessId}/bookings/{bookingId}`, y la regla comprueba `customerUserId`. |
| D-3 | **Historial = `startsAt` pasado OR `cancelled`** es una unión, no una condición simple. | Consulta con `or()` de Firestore, con `orderBy(startsAt, desc)`; el total sale de `getCountFromServer` sobre la misma consulta. Se valida en el emulador en PR A/B; si el emulador o los índices la rechazan, plan B: dos consultas (`status in [completed,no_show,cancelled]` y `status in [pending,confirmed]` + `startsAt <= now`) fusionadas en cliente, lo que complica la paginación — se avisaría antes de adoptarlo. |
| D-4 | **Alcance de PRs.** | A: datos y seguridad · B: lista, historial, detalle · C: filtros. Cada PR cumple el aviso de tamaño de `git-workflow`. |

---

### 4. Diseño

#### 4.1 Dominio (PR A)
- `Booking` añade `collaboratorId: Nullable<string>`, `collaboratorName: Nullable<string>` (D-1) y `rescheduleHistory` (lista de `{ from, to, changedAt }` con `Date`; vacía por defecto). Nombres en inglés sin abreviaturas; claves ordenadas A–Z.
- Sin campos nuevos en `Business`. Moneda y `timeZone` se leen del negocio.

#### 4.2 Seguridad (PR A)
- Nueva regla de collection group solo de lectura, sin tocar las existentes:
  ```
  match /{path=**}/bookings/{bookingId} {
    allow read: if hasRole('customer') && resource.data.customerUserId == request.auth.uid;
  }
  ```
  `write` sigue denegado. La regla por subcolección se mantiene para la lectura del detalle y para los demás roles.
- Tests de reglas (`npm run test:rules`): el cliente lee sus reservas por collection group; **no** lee las de otro cliente; `subscriber`, `collaborator` y visitante no se benefician de la nueva regla; nadie escribe.
- No se debilita ninguna regla existente.

#### 4.3 Datos e índices (PR A y B)
Colección de grupo `bookings`, siempre con `where(customerUserId == uid)` y `orderBy(startsAt)`. Índices compuestos en `firestore.indexes.json`, en el mismo PR que cada consulta (`api-query-standards` §6):

| Consulta | Campos |
|---|---|
| Próximas | `customerUserId`, `status`, `startsAt` ↑ |
| Próximas + negocio | `customerUserId`, `businessId`, `status`, `startsAt` ↑ |
| Historial | `customerUserId`, `status`, `startsAt` ↓ (y variante `startsAt`-pasado) |
| Historial + negocio / rango | `customerUserId`, `businessId`, `status`, `startsAt` ↓ |

La lista exacta se cierra con lo que el emulador exija al ejecutar las consultas de D-3; se commitea tal cual.

#### 4.4 Capa de datos (PR B)
`src/modules/customer/features/my-bookings/api/`:
- `myBookingsKeys.ts` — claves `["customer", "my-bookings", uid, { tab, filters, cursor }]`.
- `bookingDocument.schema.ts` — Zod + adaptador: `Timestamp → Date`, centavos enteros, descarta `cancellation.note` (AS-4).
- `useMyBookingsQuery.ts` — `CursorPage<MyBooking>` (`items`, `nextCursor`, `totalCount`) con `getCountFromServer`.
- `useMyBookingQuery.ts` — detalle por `businessId` + `bookingId`; no encontrada o ajena → `notFound` (AC-KAN-152-04).
- `useBookingBusinessQuery.ts` — nombre, `slug`, `timeZone`, moneda por `businessId`, deduplicado por la caché de TanStack Query.
- `uid` sale de la sesión, nunca de la URL ni de formularios.

#### 4.5 UI (PR B y C)
MVVM según `component-architecture`:
- `MyBookingsPage` + `useMyBookingsViewModel` (pestaña activa, filtros desde `useSearchParams`, paginación con `useCursorPagination([tab, filters])`).
- `BookingDetailPage` + `useBookingDetailViewModel`.
- Subcomponentes en `components/`: `BookingList`, `BookingListItem`, `BookingFilters`, `BookingDetailSummary`, `BookingCollaboratorLine`.
- Tipos en `models/*.model.ts`; constantes de pestañas y claves de filtros en `@/constants` (A–Z). Sin controles HTML crudos: `Button`, `Input`, `Table`, `EmptyState`, `ErrorState`, `Spinner`, `CursorPagination`, `StatusBadge`.
- Fecha/hora con `formatDateTime` en la `timeZone` de cada negocio; precio con `formatPrice` en su moneda.
- Texto en `src/i18n/locales/{es,en}/customer.json` bajo `myBookings.*`; reutiliza `common:errors.network` y `common:errors.notFound`.
- Colores solo con tokens semánticos; badges con texto, no solo color.

#### 4.6 Filtros (PR C)
- Parámetros de URL: `tab`, `status`, `business`, `from`, `to`. Validados con Zod; valores inválidos se ignoran.
- Cambiar un filtro limpia el cursor (la clave de reinicio de `useCursorPagination` incluye los filtros).
- Rango con fin anterior al inicio: no se consulta y se muestra `filters.invalidRangeError` (AC-KAN-154-06).
- Rango de fechas interpretado en la `timeZone` de cada negocio. Si se filtra por varios negocios con zonas distintas, el límite se calcula con la zona del negocio filtrado; sin filtro de negocio se usa la zona del navegador y se documenta en la UI (a validar al implementar).

#### 4.7 Rutas y navegación (PR B)
- `ROUTE_PATH.CUSTOMER` añade `MY_BOOKINGS: "my-bookings"` y el patrón del detalle; rutas dentro de la rama `RequireRole` del cliente, cargadas con `lazy`.
- No se toca la barra de navegación del cliente (KAN-96/108): no existe; la ruta es accesible por URL hasta que llegue su historia. Se anota en el PR.
- Visitante → sign-in; `subscriber`/`super_admin` → su portal (ya lo cubre `RequireRole`).

---

### 5. Matriz de fronteras de archivos

| Archivo / Módulo | PR | Estado |
|---|---|---|
| `docs/specs/2026-10-16-US-150-mis-reservas.md` | A | Nuevo |
| `src/domain/booking/Booking.interface.ts` | A | Modificado |
| `scripts/seed-emulator.ts` (+ constantes de semilla) | A | Modificado — reservas futuras, pasadas y canceladas del cliente de prueba |
| `firestore.rules` | A | Modificado — solo la regla de §4.2 |
| `firestore.indexes.json` | A y B/C | Modificado |
| Tests de reglas | A | Modificado |
| `src/modules/customer/features/my-bookings/{api,components,hooks,models,tests}/` | B, C | Nuevo |
| `src/modules/customer/customer.routes.tsx`, `src/constants/routes/RoutePath.constants.ts` | B | Modificado |
| `src/i18n/locales/{es,en}/customer.json` | B, C | Modificado |
| e2e `e2e/my-bookings.spec.ts` | C | Nuevo |

Sin refactors fuera de esta lista.

### 6. Pruebas y trazabilidad
- Vitest + Testing Library con Page Object; los tests de la lista cubren `AC-KAN-151-*`, `AC-KAN-153-*` y `AC-KAN-154-*` en `tests/MyBookingsPage.test.tsx`; el detalle cubre `AC-KAN-152-*` en `tests/BookingDetailPage.test.tsx`. Cada test nombra su AC. Los criterios del `SPEC.md` se marcan `[x]` en el PR que los entrega.
- Tests de adaptador Zod (fechas, centavos, `note` descartada) y de las claves de consulta.
- `npm run test:rules` para §4.2; un e2e Playwright en PR C (filtro en URL, recarga y paginación).
- Antes de cada PR: `format:check`, `lint`, `typecheck`, `test:run` y, donde aplique, `test:rules` y `test:e2e`.

### 7. Riesgos
- **Consulta `or()` del historial (D-3):** puede exigir índices adicionales; se resuelve en el emulador antes de fijar el diseño de PR B.
- **KAN-145 (crear reservas) no existe:** las pantallas se prueban con la semilla; `collaboratorName` (D-1) deberá escribirlo esa función. Se avisa en el PR para no olvidarlo.
- **Barra de navegación del cliente ausente:** entrada solo por URL hasta KAN-96/108.

### 8. Pasos de implementación
1. Tras el OK de §2 y §3: PR A (§4.1–4.3), primero con los tests de reglas fallando.
2. PR B: capa de datos → lista de próximas (KAN-151) → historial (KAN-153) → detalle (KAN-152).
3. PR C: filtros (KAN-154) y e2e.
Commits atómicos en español, sin tildes: `feat(customer): ... (US-150)`.
