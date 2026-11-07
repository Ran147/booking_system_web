# Software Design Document (SDD) — KAN-193
## [Admin] Auditoría y Trazabilidad de Acciones (Historial y Filtros)

| Metadato | Valor |
|---|---|
| **Épica / Historias** | KAN-193 (KAN-194 historial de acciones críticas, KAN-195 filtros por fecha y tipo de acción) |
| **Portal** | Admin (`src/modules/admin/features/audit-log/`) |
| **Fecha de Especificación** | 2026-11-07 |
| **Estado** | Aprobada para Implementación |
| **Spec funcional (criterios AC)** | `src/modules/admin/features/audit-log/specs/SPEC.md` (23 criterios funcionales) |
| **Preguntas abiertas** | Ninguna `BLOCKED`. Q3 decidida el 2026-09-28 (`AUDIT_LOG_ACTION_TYPE`). |
| **Requerimientos Relacionados** | RNF-05 (Theming), RNF-08 (Accesibilidad), `auth-and-roles` §4 |

---

### 1. Resumen y Propósito
El Super Administrador requiere consultar y auditar el historial de eventos críticos ejecutados en la plataforma (aprobación y rechazo de negocios, suspensiones y reactivaciones, creación y cambios de planes, cambios de precios y ajustes en los parámetros de la plataforma).
El registro es estrictamente de solo lectura desde el cliente: ningún usuario ni super administrador puede editar o eliminar entradas de auditoría. Las entradas son generadas en transacciones atómicas por las Cloud Functions del backend.

Estado actual del repositorio:
- `firestore.rules` ya protege `match /auditLog/{auditLogEntryId}` permitiendo lectura únicamente a `isSuperAdmin()` y bloqueando escrituras directas desde cualquier cliente (`allow write: if false;`).
- `AUDIT_LOG_ACTION_TYPE` está definido en `src/domain/audit-log/AuditLogActionType.constants.ts`.
- `ROUTE_PATH.ADMIN.AUDIT_LOG` está registrado como `"audit-log"` bajo `ROUTE_PATH.ADMIN.ROOT` (`/admin`).
- Componentes reutilizables disponibles: `Table`, `CursorPagination`, `useCursorPagination`, `Modal`, `Button`, `Badge`, `StatusBadge`, `EmptyState`, `ErrorState`, `Spinner`, `formatDateTime`.

---

### 2. Decisiones Técnicas y Arquitectura

| Id | Decisión | Justificación / Implementación |
|---|---|---|
| **D-1** | **Estrategia de PRs en dos fases** | Se divide en 2 historias atómicas: <br>1. **US-194 (KAN-194):** Vista principal de auditoría, query con paginación por cursor, tabla de logs, modal de detalle con valores anteriores/nuevos (`before`/`after`), estados de carga, vacío y error. <br>2. **US-195 (KAN-195):** Filtros avanzados por rango de fechas (con cálculo en la zona horaria del navegador) y tipo de acción (`actionType`), con sincronización en los parámetros de búsqueda de la URL (`URLSearchParams`). |
| **D-2** | **Modelo de Datos de Entrada de Auditoría (`AuditLogEntry`)** | Documentos en `auditLog/{auditLogEntryId}` con tipado estricto: `id`, `actionType` (`AuditLogActionType`), `actorEmail`, `actorUserId`, `createdAt` (`Date`), `targetType` (`business` \| `plan` \| `platform_settings`), `targetId`, `targetName`, `before` (`Nullable<Record<string, unknown>>`), `after` (`Nullable<Record<string, unknown>>`), `reason` (`Nullable<string>`). |
| **D-3** | **Adaptador Zod y Acceso a Datos** | `AuditLogDocument.schema.ts` valida y transforma `Timestamp` de Firestore a `Date`. `fetchAuditLogPage.ts` implementa consulta con `orderBy("createdAt", "desc")`, `limit(PAGINATION.DEFAULT_PAGE_SIZE)` y cursores con `startAfter`. `getCountFromServer` provee el conteo total. |
| **D-4** | **Separación de Responsabilidades (MVVM)** | `AuditLogPage.tsx` actúa como vista declarativa scannable (< 80 líneas). `useAuditLogViewModel.ts` orquesta el estado de paginación, selección de log para detalle y comunicación con TanStack Query (`useAuditLogEntriesQuery`). |
| **D-5** | **Accesibilidad e Internacionalización (i18n)** | Cumplimiento RNF-08 con encabezados semánticos de tabla (`th scope="col"`), botón de cierre accesible en modal, etiquetas traducidas en `admin:auditLog.*` con paridad 100% en español e inglés (`es/admin.json` y `en/admin.json`). |

---

### 3. Estructura de Archivos

```text
src/modules/admin/features/audit-log/
├── api/
│   ├── auditLogQueryKeys.ts
│   ├── AuditLogDocument.schema.ts
│   ├── fetchAuditLogPage.ts
│   ├── index.ts
│   └── useAuditLogEntriesQuery.ts
├── components/
│   ├── AuditLogDetailModal.tsx
│   ├── AuditLogTable.tsx
│   └── index.ts
├── constants/
│   ├── auditLog.constants.ts
│   └── index.ts
├── hooks/
│   ├── index.ts
│   └── useAuditLogViewModel.ts
├── models/
│   ├── auditLog.model.ts
│   └── index.ts
├── specs/
│   └── SPEC.md
├── tests/
│   ├── AuditLogPage.page.ts
│   └── AuditLogPage.test.tsx
├── AuditLogPage.tsx
└── index.ts
```

---

### 4. Trazabilidad de Criterios (Fase 1: KAN-194)

| Criterio | Descripción | Cobertura en Tests |
|---|---|---|
| **AC-KAN-194-01** | Lista paginada ordenada por fecha descendente con actor, acción, elemento afectado y paginador | `AuditLogPage.test.tsx` |
| **AC-KAN-194-02** | Apertura de modal de detalle mostrando valores antes/después y motivo | `AuditLogPage.test.tsx` |
| **AC-KAN-194-03** | Registro estrictamente de solo lectura (sin opciones de edición ni borrado) | `AuditLogPage.test.tsx` |
| **AC-KAN-194-04** | Estado vacío (`admin:auditLog.list.empty`) cuando no existen registros | `AuditLogPage.test.tsx` |
| **AC-KAN-194-05** | Fallback a texto crudo o `unknownAction` para tipos de acción no reconocidos | `AuditLogPage.test.tsx` |
| **AC-KAN-194-06** | Estado de error (`common:errors.network`) con reintento ante fallos de conexión | `AuditLogPage.test.tsx` |
| **AC-KAN-194-07** | Control de acceso: solo accesible para rol `super_admin` | `AuditLogPage.test.tsx` y `firestore.rules` |
| **AC-KAN-194-10** | Etiquetas localizadas para cada uno de los tipos de acción `AUDIT_LOG_ACTION_TYPE` | `AuditLogPage.test.tsx` |
| **AC-KAN-194-12** | Nombre del elemento registrado en el momento de la acción (`targetName`) | `AuditLogPage.test.tsx` |
