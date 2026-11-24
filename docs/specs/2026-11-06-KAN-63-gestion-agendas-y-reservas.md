# Software Design Document (SDD) — Épica KAN-63
## Gestión de Agendas y Reservas (Portal Business)

| Metadato | Valor |
|---|---|
| **Épica** | KAN-63 ("Gestión Agenda y Reservas") |
| **Historias de Usuario** | KAN-64, KAN-65, KAN-66, KAN-67, KAN-68, KAN-69, KAN-70, KAN-71, KAN-72, KAN-73, KAN-74, KAN-75, KAN-76 |
| **Portal** | Business (`src/modules/business/features/schedule/`) |
| **Fecha de Especificación** | 2026-11-06 |
| **Estado** | Aprobada para Implementación |
| **Spec Funcional (Criterios AC)** | `src/modules/business/features/schedule/specs/SPEC.md` (100 criterios AC exactos) |
| **Arquitectura de Servidor** | **Vercel Serverless Functions (`api/callFunction.ts`)** con Firebase Admin SDK para toda la lógica crítica (Cero Cloud Functions) |
| **Requerimientos Relacionados** | RNF-01 (Rendimiento), RNF-04 (Seguridad y Multitenancy), RNF-05 (Theming Dinámico), RNF-08 (Accesibilidad WCAG 2.1 AA) |

---

### 1. Resumen y Propósito

La épica **KAN-63** dota al suscriptor (`subscriber`) y a sus colaboradores autorizados (`collaborator`) de las capacidades integrales para gobernar el tiempo disponible de su negocio y controlar el ciclo de vida completo de cada reserva.

Permite:
1. Configurar los horarios de atención semanales del negocio (`BusinessHours`), con soporte para turnos partidos y días cerrados (KAN-64).
2. Crear bloqueos de agenda parciales (almuerzos, pausas) y días completos (feriados, vacaciones, bajas médicas), a nivel global de negocio o por colaborador individual (KAN-65, KAN-66).
3. Visualizar la agenda en vista diaria o semanal con actualización en tiempo real, distinguiendo horas libres y ocupadas, filtrando por colaborador y mostrando reservas y bloqueos juntos (KAN-67, KAN-68).
4. Crear reservas de forma manual (llamadas, clientes en persona o sin cuenta) con validación atómica de solapamientos (KAN-69).
5. Seleccionar la modalidad de confirmación de reservas (automática o manual) y confirmar reservas pendientes (KAN-70).
6. Reprogramar reservas futuras sin sobrescribir ni colisionar, conservando el historial de cambios (KAN-71).
7. Cancelar reservas registrando nota aclaratoria obligatoria y penalización (KAN-72).
8. Marcar reservas como completadas o como "no se presentó" (*no-show*) una vez transcurrido su horario (KAN-73, KAN-74).
9. Consultar listados paginados de reservas próximas y un historial filtrable de reservas pasadas con snapshot inmutable de precios y servicios (KAN-75, KAN-76).

#### Principio Clave de Arquitectura: Cero Cloud Functions
Toda la lógica crítica de backend (concurrencia, prevención de doble reserva, transacciones de verificación de solapamiento, generación de snapshots inmutables y cambios de estado con reglas de negocio) se ejecuta **exclusivamente mediante Vercel Serverless Functions** a través del endpoint `/api/callFunction` (`api/callFunction.ts`), utilizando Firebase Admin SDK. **No se utilizan Firebase Cloud Functions**.

---

### 2. Decisiones Técnicas y Supuestos Confirmados

| Id | Tema | Decisión / Supuesto Adoptado | Impacto Arquitectónico |
|---|---|---|---|
| **D-1** | **Backend de Lógica Crítica** | Toda la lógica transaccional de reservas corre en **Vercel Serverless Functions** (`api/callFunction.ts`) vía Firebase Admin SDK en transacciones Firestore. | Cero Cloud Functions en la infraestructura. Resuelve prevención de doble reserva y asegura integridad transaccional. |
| **D-2** | **Disponibilidad y Concurrencia** | La verificación de colisiones en `createBooking` y `rescheduleBooking` se realiza en una transacción atómica `firestore.runTransaction` dentro de la Vercel Function. | Evita colisiones de reservas simultáneas entre cliente y suscriptor (AC-KAN-69-08). |
| **D-3** | **Zonas Horarias** | Todo cálculo de horas, turnos y visualización utiliza `business.timeZone` (identificador IANA, e.g. `America/Costa_Rica`). Nunca se utiliza la zona horaria del navegador. | Consistencia global y cumplimiento de `domain-glossary` §3. |
| **D-4** | **Snapshot Inmutable** | Toda reserva almacena en `serviceSnapshot` los valores congelados (`name`, `priceInCents`, `durationMinutes`, `discounts`). Cambios futuros en el servicio no alteran reservas pasadas. | Cumplimiento estricto de KAN-62 y KAN-76. |
| **D-5** | **Modalidad de Confirmación** | Se almacena el campo `bookingConfirmationMode: "manual" \| "automatic"` en el documento `businesses/{businessId}`. | Por defecto es `"automatic"` (AS-8). Afecta el estado inicial de nuevas reservas (KAN-70). |
| **D-6** | **Colaborador como Recurso Único** | Cada colaborador activo atiende una reserva a la vez. Si el negocio no tiene colaboradores o el servicio no tiene asignados, el negocio opera como un único recurso (`collaboratorId: null`). | Decisión Q1 del equipo y `domain-glossary` §3. |
| **D-7** | **Terminalidad de Estados** | `completed`, `no_show` y `cancelled` son estados terminales en la máquina de estados canónica (`domain-glossary` §4.1). No se permite reversión directa. | La interfaz bloquea transiciones y el servidor las rechaza con error `failed-precondition`. |

---

### 3. Arquitectura del Servidor: Vercel Serverless Functions (`/api/callFunction`)

El archivo `/api/callFunction.ts` centraliza los manejadores serverless que procesan las operaciones críticas de la plataforma. Para la épica KAN-63 se definen los siguientes manejadores y constantes:

#### 3.1. Nuevas Acciones en `FUNCTION_NAME` (`src/constants/firebase/FunctionName.constants.ts`)

```typescript
export const FUNCTION_NAME = Object.freeze({
  CANCEL_BOOKING: "cancelBooking",
  CREATE_BOOKING: "createBooking",
  RESCHEDULE_BOOKING: "rescheduleBooking",
  UPDATE_BOOKING_STATUS: "updateBookingStatus",
  // ...acciones existentes
} as const);
```

#### 3.2. Especificación de Endpoints y Lógica Transaccional

##### A. `CREATE_BOOKING` (KAN-69)
- **Propósito:** Creación atómica de reservas manuales por el suscriptor o colaboradores con `manage_bookings`.
- **Payload:**
  ```typescript
  interface CreateBookingPayload {
    readonly businessId: string;
    readonly serviceId: string;
    readonly customerId: string;
    readonly collaboratorId?: Nullable<string>;
    readonly startsAt: string; // ISO 8601 UTC
    readonly notes?: Nullable<string>;
  }
  ```
- **Flujo Transaccional en Vercel Function:**
  1. Verificar que el negocio existe y tiene `status === "active"`. Si está inactivo/suspendido, retornar `412 Precondition Failed` (`business_not_active`).
  2. Obtener el servicio `businesses/{businessId}/services/{serviceId}` y validar que `status === "active"`.
  3. Si `collaboratorId` está presente, verificar que dicho colaborador existe y tiene `status === "active"`.
  4. Obtener el cliente `businesses/{businessId}/customers/{customerId}` y verificar que su estado no sea `"blocked"` (KAN-93, AS-6).
  5. Calcular `endsAt` sumando `service.durationMinutes` a `startsAt`.
  6. En una transacción `firestore.runTransaction`:
     - Consultar si existe algún bloqueo (`scheduleBlocks`) que solape con `[startsAt, endsAt)` aplicable a todo el negocio o al colaborador elegido.
     - Consultar reservas existentes en `businesses/{businessId}/bookings` con estado en `["pending", "confirmed"]` que solapen el rango para el recurso asignado.
     - Si hay conflicto, lanzar error y responder `409 Conflict` con `{ reason: "slot_taken" }` (AC-KAN-69-03, AC-KAN-69-08).
     - Determinar el estado inicial: si el negocio tiene `bookingConfirmationMode === "manual"`, el estado es `"pending"`; si no, `"confirmed"`.
     - Crear el documento de la reserva con `serviceSnapshot` inmutable:
       ```typescript
       {
         businessId,
         cancellation: null,
         collaboratorId: collaboratorId ?? null,
         collaboratorName,
         customerId,
         customerUserId: customerData.userId ?? null,
         endsAt: endsAtDate,
         id: newBookingRef.id,
         notes: notes ?? null,
         rescheduleHistory: [],
         serviceId,
         serviceSnapshot: {
           durationMinutes: serviceData.durationMinutes,
           name: serviceData.name,
           priceInCents: serviceData.priceInCents,
         },
         startsAt: startsAtDate,
         status: initialStatus,
         createdAt: Timestamp.now(),
         updatedAt: Timestamp.now(),
       }
       ```
- **Respuesta Exitosa (`200 OK`):** `{ bookingId, serviceSnapshot, status }`.

##### B. `RESCHEDULE_BOOKING` (KAN-71)
- **Propósito:** Reasignar fecha y hora a una reserva existente sin sobrescribir ni duplicar.
- **Payload:**
  ```typescript
  interface RescheduleBookingPayload {
    readonly businessId: string;
    readonly bookingId: string;
    readonly newStartsAt: string; // ISO 8601 UTC
  }
  ```
- **Flujo Transaccional:**
  1. Verificar estado del negocio (`active`).
  2. En transacción:
     - Leer la reserva `businesses/{businessId}/bookings/{bookingId}`.
     - Validar que su estado sea `"pending"` o `"confirmed"` y que `startsAt > now` (AC-KAN-71-03).
     - Calcular nuevo `endsAt` basado en `serviceSnapshot.durationMinutes`.
     - Validar que no existan reservas ni bloqueos en el nuevo intervalo (excluyendo la propia reserva en caso de solapamiento parcial, AC-KAN-71-06).
     - Si está ocupado, responder `409 Conflict` (`slot_taken`).
     - Registrar en `rescheduleHistory` la entrada:
       `{ changedAt: Timestamp.now(), previousEndsAt: booking.endsAt, previousStartsAt: booking.startsAt }`.
     - Actualizar `startsAt: newStartsAtDate`, `endsAt: newEndsAtDate`, `updatedAt: Timestamp.now()`.
- **Respuesta Exitosa (`200 OK`):** `{ bookingId, startsAt, endsAt }`.

##### C. `CANCEL_BOOKING` (KAN-72)
- **Propósito:** Cancelar una reserva registrando auditoría, motivo y si aplica penalización.
- **Payload:**
  ```typescript
  interface CancelBookingPayload {
    readonly businessId: string;
    readonly bookingId: string;
    readonly cancelledBy: "business";
    readonly isPenalized: boolean;
    readonly note: string; // 1 a 500 caracteres
  }
  ```
- **Flujo Transaccional:**
  1. Validar que `note` no esté vacía ni exceda 500 caracteres (AC-KAN-72-02, AC-KAN-72-03).
  2. En transacción:
     - Leer la reserva.
     - Validar que su estado actual sea `"pending"` o `"confirmed"`. Si ya está en `"cancelled"`, `"completed"` o `"no_show"`, responder `412 Precondition Failed` (`invalid_transition`).
     - Actualizar `status: "cancelled"` y `cancellation: { cancelledBy, isPenalized, note: note.trim(), cancelledAt: Timestamp.now() }`.
- **Respuesta Exitosa (`200 OK`):** `{ bookingId, status: "cancelled" }`.

##### D. `UPDATE_BOOKING_STATUS` (KAN-70, KAN-73, KAN-74)
- **Propósito:** Cambiar el estado de una reserva (`confirmed`, `completed`, `no_show`) asegurando la máquina de estados de `domain-glossary` §4.1.
- **Payload:**
  ```typescript
  interface UpdateBookingStatusPayload {
    readonly businessId: string;
    readonly bookingId: string;
    readonly targetStatus: "confirmed" | "completed" | "no_show";
  }
  ```
- **Reglas de Transición:**
  - `pending -> confirmed`: Permitido si el suscriptor confirma manualmente una reserva pendiente futura (KAN-70, AC-KAN-70-03).
  - `confirmed -> completed`: Permitido **únicamente si `startsAt <= now`** (KAN-73, AC-KAN-73-01, AC-KAN-73-02).
  - `confirmed -> no_show`: Permitido **únicamente si `startsAt <= now`** (KAN-74, AC-KAN-74-01, AC-KAN-74-02).
  - Cualquier otra transición o intento de modificar un estado terminal genera error `412 Precondition Failed` (`invalid_transition`).
- **Respuesta Exitosa (`200 OK`):** `{ bookingId, status: targetStatus }`.

---

### 4. Modelo de Datos y Colecciones Firestore

#### 4.1. Estructuras de Datos

```text
businesses/{businessId}
  ├── businessHours: {
  │     monday: [{ opensAt: "09:00", closesAt: "13:00" }, { opensAt: "14:00", closesAt: "18:00" }],
  │     ...
  │     sunday: []
  │   }
  ├── bookingConfirmationMode: "manual" | "automatic"
  ├── timeZone: "America/Costa_Rica"
  │
  ├── scheduleBlocks/{scheduleBlockId}
  │     ├── collaboratorId: Nullable<string>   # null = bloqueo general de negocio
  │     ├── isFullDay: boolean
  │     ├── reason: Nullable<string>
  │     ├── startsAt: Timestamp
  │     ├── endsAt: Timestamp
  │     ├── createdAt: Timestamp
  │     └── updatedAt: Timestamp
  │
  └── bookings/{bookingId}
        ├── businessId: string
        ├── cancellation: Nullable<{
        │     cancelledAt: Timestamp,
        │     cancelledBy: "business" | "customer",
        │     isPenalized: boolean,
        │     note: Nullable<string>
        │   }>
        ├── collaboratorId: Nullable<string>
        ├── collaboratorName: Nullable<string>
        ├── customerId: string
        ├── customerUserId: Nullable<string>
        ├── endsAt: Timestamp
        ├── id: string
        ├── rescheduleHistory: Array<{
        │     changedAt: Timestamp,
        │     previousEndsAt: Timestamp,
        │     previousStartsAt: Timestamp
        │   }>
        ├── serviceId: string
        ├── serviceSnapshot: {
        │     durationMinutes: number,
        │     name: string,
        │     priceInCents: number
        │   }
        ├── startsAt: Timestamp
        ├── status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
        ├── createdAt: Timestamp
        └── updatedAt: Timestamp
```

#### 4.2. Índices Requeridos (`firestore.indexes.json`)

Para garantizar consultas eficientes y ordenadas en la subcolección `bookings`:

| Colección | Campos Indexados | Modo | Uso |
|---|---|---|---|
| `bookings` | `startsAt ASC` | Ascendente | Listado de próximas reservas (KAN-75) |
| `bookings` | `startsAt DESC` | Descendente | Historial general de reservas pasadas (KAN-76) |
| `bookings` | `status ASC, startsAt DESC` | Compuesto | Historial filtrado por estado (KAN-76) |
| `bookings` | `serviceId ASC, startsAt DESC` | Compuesto | Historial filtrado por servicio (KAN-76) |
| `bookings` | `collaboratorId ASC, startsAt DESC` | Compuesto | Historial filtrado por colaborador (KAN-76) |
| `scheduleBlocks` | `startsAt ASC, endsAt ASC` | Compuesto | Consulta de bloques por rango de fechas (KAN-67) |

---

### 5. Reglas de Seguridad en Firestore (`firestore.rules`)

1. **Lectura de Agenda y Bloqueos:**
   - Suscriptor y colaboradores activos pueden leer `businesses/{businessId}/scheduleBlocks/{blockId}` y `businesses/{businessId}/bookings/{bookingId}` de su negocio.
2. **Escritura de Bloqueos:**
   - Suscriptor: puede crear, modificar y eliminar `scheduleBlocks` mientras el negocio esté `active`.
   - Colaborador: permitido solo si tiene el permiso `manage_schedule_blocks` (KAN-86) y el negocio está `active`.
3. **Escritura de Horarios y Modo de Confirmación:**
   - Actualizar `businessHours` y `bookingConfirmationMode` en `businesses/{businessId}`: solo permitido al `subscriber` (dueño). Colaboradores no tienen permiso de configuración general.
4. **Escritura de Reservas:**
   - La creación, reprogramación, cancelación y cambios de estado de `bookings` son denegados para escritura directa de clientes que eludan la validación transaccional; se canalizan a través de la Vercel Serverless Function con privilegios de `firebase-admin`.

---

### 6. Arquitectura del Frontend (Portal Business)

Ubicación del módulo: `src/modules/business/features/schedule/`

```text
src/modules/business/features/schedule/
├── api/
│   ├── buildScheduleQuery.ts
│   ├── bookingDocument.schema.ts
│   ├── scheduleBlockDocument.schema.ts
│   ├── scheduleQueryKeys.ts
│   ├── useBusinessHoursQuery.ts
│   ├── useBookingHistoryQuery.ts
│   ├── useBookingListQuery.ts
│   ├── useScheduleRealtime.ts
│   ├── useCreateBookingMutation.ts       # Consume /api/callFunction
│   ├── useRescheduleBookingMutation.ts   # Consume /api/callFunction
│   ├── useCancelBookingMutation.ts       # Consume /api/callFunction
│   ├── useUpdateBookingStatusMutation.ts # Consume /api/callFunction
│   └── useScheduleBlockMutations.ts      # Directo a Firestore con rules
├── components/
│   ├── agenda/
│   │   ├── AgendaCalendarView.tsx        # Vistas día / semana
│   │   ├── AgendaCollaboratorFilter.tsx  # Filtro de colaboradores
│   │   └── AgendaTimeSlotCell.tsx
│   ├── blocks/
│   │   ├── ScheduleBlockDialog.tsx       # Crear/eliminar bloqueos
│   │   └── ScheduleBlockItem.tsx
│   ├── bookings/
│   │   ├── BookingFormDialog.tsx         # Modal crear reserva manual (KAN-69)
│   │   ├── BookingActionMenu.tsx         # Menú de acciones por reserva
│   │   ├── BookingDetailDrawer.tsx       # Detalle lateral completo
│   │   ├── CancelBookingDialog.tsx       # Diálogo con nota y penalización (KAN-72)
│   │   └── RescheduleBookingDialog.tsx   # Diálogo reagendar (KAN-71)
│   ├── history/
│   │   ├── BookingHistoryFilters.tsx     # Filtros en URL (fechas, servicio, estado)
│   │   └── BookingHistoryTable.tsx
│   ├── hours/
│   │   ├── BusinessHoursForm.tsx         # Configuración semanal de horarios (KAN-64)
│   │   └── DayHoursRow.tsx               # Rango doble y toggle cerrado
│   └── list/
│       ├── BookingListTable.tsx          # Lista paginada con cursor (KAN-75)
│       └── BookingListToolbar.tsx
├── constants/
│   └── Schedule.constants.ts             # Constantes A-Z Object.freeze
├── hooks/
│   ├── useAgendaCalendarViewModel.ts
│   ├── useBookingHistoryViewModel.ts
│   ├── useBookingListViewModel.ts
│   ├── useBusinessHoursViewModel.ts
│   └── useScheduleBlockViewModel.ts
├── models/
│   ├── BusinessHours.model.ts
│   ├── ScheduleAgenda.model.ts
│   ├── ScheduleBlock.model.ts
│   └── ScheduleBooking.model.ts
├── pages/
│   ├── BusinessHoursPage.tsx
│   ├── BookingDetailPage.tsx
│   ├── BookingHistoryPage.tsx
│   ├── BookingListPage.tsx
│   └── SchedulePage.tsx                  # Pantalla principal de Agenda
└── tests/
    ├── BookingDetailPage.test.tsx
    ├── BookingForm.test.tsx
    ├── BookingHistoryPage.test.tsx
    ├── BookingListPage.test.tsx
    ├── BusinessHoursPage.test.tsx
    ├── CancelBookingDialog.test.tsx
    ├── RescheduleBookingDialog.test.tsx
    ├── ScheduleBlockForm.test.tsx
    └── SchedulePage.test.tsx
```

#### 6.1. Separación de Responsabilidades (MVVM)
- **Vistas (`pages/`, `components/`):** Componentes puramente presentacionales con retornos escaneables (< 80 líneas). Consumen átomos de `src/components/common/` (`Button`, `Card`, `Badge`, `Modal`, `Input`, `Select`, `Spinner`, `Table`, `CursorPagination`, `BookingStatusLabel`). Prohibido el uso de controles HTML nativos.
- **ViewModels (`hooks/`):** Encapsulan la lógica de estado de UI, orquestan las consultas y mutaciones de TanStack Query, formatean divisas y fechas con `Intl` en el `timeZone` del negocio y aplican validaciones con esquemas Zod.
- **Modelos (`models/`):** Contratos de datos inmutables y schemas Zod con adaptación estricta de `Timestamp` a `Date`.

---

### 7. Estrategia de Pruebas y Trazabilidad

#### 7.1. Pruebas Unitarias del Servidor Vercel (`tests/api/`)
Se prueban en aislamiento con `@vitest-environment node` utilizando el patrón `adminFake` (igual que en `tests/api/completeSubscriberSignUp.test.ts`):
- `tests/api/createBooking.test.ts`:
  - Creación exitosa con snapshot inmutable y estado dependiente del modo de confirmación.
  - Rechazo con `409 Conflict` cuando el horario ya está ocupado por otra reserva o bloqueo.
  - Rechazo si el cliente está bloqueado (`customer_blocked`).
  - Rechazo si el servicio o negocio están inactivos.
- `tests/api/rescheduleBooking.test.ts`:
  - Reagendamiento exitoso y adición a `rescheduleHistory`.
  - Rechazo por solapamiento con reservas de terceros o bloqueos.
  - Permitir solapamiento parcial con el propio horario de la reserva a reagendar (AC-KAN-71-06).
- `tests/api/cancelBooking.test.ts`:
  - Cancelación exitosa registrando nota y penalización.
  - Rechazo por nota vacía o mayor a 500 caracteres.
  - Rechazo si la reserva ya estaba completada o cancelada (transición inválida).
- `tests/api/updateBookingStatus.test.ts`:
  - Transición a `completed` y `no_show` permitida solo si `startsAt <= now`.
  - Confirmación manual de reserva `pending` a `confirmed`.
  - Rechazo de transiciones prohibidas por la máquina de estados.

#### 7.2. Pruebas de Componentes UI (`src/modules/business/features/schedule/tests/`)
Utilizan Vitest, React Testing Library y Page Object Model (POM):
- `BusinessHoursPage.test.tsx`: Configuración de horarios por día, turnos dobles, días cerrados, validaciones de rangos y feedback de guardado.
- `ScheduleBlockForm.test.tsx`: Creación de bloqueos de tiempo parcial y de día completo; bloqueo por colaborador o negocio entero; advertencia de solapamiento con reservas existentes.
- `SchedulePage.test.tsx`: Alternancia entre vista diaria y semanal; navegación de fechas; filtro por colaborador; actualización en tiempo real; indicación de horas libres vs ocupadas.
- `BookingForm.test.tsx`: Creación manual de reservas con validaciones Zod, selección de servicios y colaboradores activos.
- `BookingListPage.test.tsx`: Paginación con cursor de reservas próximas, estados vacíos y badges de estado.
- `BookingHistoryPage.test.tsx`: Filtrado en URL por rango de fechas, estado y servicio; paginación y exportación de trazabilidad.

---

### 8. Matriz de Fronteras y Plan de Entrega en PRs

| Archivo / Carpeta | PR | Estado | Permiso |
|---|---|---|---|
| `docs/specs/2026-11-06-KAN-63-gestion-agendas-y-reservas.md` | PR A | Nuevo | Permitido |
| `src/modules/business/features/schedule/specs/SPEC.md` | PR A | Modificado (Vercel Functions) | Permitido |
| `src/constants/firebase/FunctionName.constants.ts` | PR A | Modificado (acciones de bookings) | Permitido |
| `api/callFunction.ts` | PR A | Modificado (handlers transaccionales de bookings) | Permitido |
| `tests/api/{createBooking,cancelBooking,rescheduleBooking,updateBookingStatus}.test.ts` | PR A | Nuevos | Permitido |
| `firestore.rules`, `firestore.indexes.json` | PR B | Modificados (reglas e índices de schedule) | Permitido |
| `src/modules/business/features/schedule/hours/` (`BusinessHoursPage`, ViewModel, tests) | PR B | Nuevos | Permitido |
| `src/modules/business/features/schedule/blocks/` (`ScheduleBlock`, ViewModel, tests) | PR B | Nuevos | Permitido |
| `src/modules/business/features/schedule/agenda/` (`SchedulePage`, ViewModel, tests) | PR C | Nuevos | Permitido |
| `src/modules/business/features/schedule/bookings/` (`BookingForm`, `Reschedule`, `Cancel`, tests) | PR D | Nuevos | Permitido |
| `src/modules/business/features/schedule/list/`, `history/` (Listados, Historial, Filtros, tests) | PR E | Nuevos | Permitido |
| `src/i18n/locales/{es,en}/business.json` | PR B..E | Modificado bajo `schedule.*` | Permitido (aditivo) |
| Resto del proyecto (`landing`, `customer`, `admin`, `auth`) | - | - | **PROHIBIDO MODIFICAR** |

---

### 9. Verificación de Calidad Previa a Integración

Antes de cualquier pull request o cierre de historias, se deben ejecutar y aprobar con **0 errores y 0 advertencias**:
```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:run
npm run test:rules
```

