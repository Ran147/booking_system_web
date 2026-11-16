# Software Design Document (SDD) — KAN-189
## [Admin] Gestión de Soporte y Consultas (Ticketing)

| Metadato | Valor |
|---|---|
| **Épica** | KAN-189 ([Admin] Gestión de Soporte y Consultas (Ticketing)) |
| **Historias de Usuario** | KAN-190 (Listado paginado de tickets y estados), KAN-191 (Responder consulta y envío por correo), KAN-192 (Cerrar o marcar como resuelto) |
| **Portal** | Admin (`src/modules/admin/features/support-tickets/`) |
| **Fecha de Especificación** | 2026-11-10 |
| **Estado** | Aprobada para Implementación |
| **Spec funcional (criterios AC)** | `src/modules/admin/features/support-tickets/specs/SPEC.md` (22 criterios funcionales) |
| **Preguntas abiertas** | Ninguna `BLOCKED`. Dependencia de PROP-3 (lado suscriptor) aislada en backend/admin. |
| **Requerimientos Relacionados** | RF-04 (Ticketing y Soporte), RNF-04 (Usabilidad), RNF-05 (Theming), RNF-08 (Accesibilidad WCAG AA), `auth-and-roles` §4 |

---

### 1. Resumen y Propósito

El Super Administrador de Booking System requiere un módulo integral dentro del panel administrativo (`/admin/support-tickets`) para gestionar de punta a punta las incidencias, consultas técnicas y dudas operativas registradas por los dueños de negocios suscritos a la plataforma.

El módulo provee:
1. **Listado paginado y filtrable (KAN-190):** Consulta en tiempo real con paginación por cursores (`useCursorPagination`), ordenamiento cronológico descendente (`newest first`), filtros por estado (`open`, `in_progress`, `resolved`) sincronizados en la URL (`URLSearchParams`), conteo total, badges semánticos de estado y apertura de vista de detalle (drawer/modal).
2. **Respuesta a tickets con notificación por correo (KAN-191):** Formulario accesible de respuesta con contador de caracteres (1 a 5,000 caracteres según AS-3), mutación segura mediante Cloud Function invocable (`replyToSupportTicket`) que valida permisos de `super_admin`, persiste la respuesta en el historial cronológico del ticket, transiciona el estado de `open` a `in_progress`, y despacha notificación por correo al dueño del negocio (`Business.ownerUserId` $\rightarrow$ `User.email` en su idioma preferido). Si el envío de correo falla, la respuesta se preserva marcada como `emailFailed: true` y permite reintento (AS-4).
3. **Cierre y resolución de incidencias (KAN-192):** Acción explícita para marcar un ticket como `resolved`, registrando la marca de tiempo `resolvedAt` mediante Cloud Function (`resolveSupportTicket`) bajo máquina de estados canónica (`open` $\rightarrow$ `resolved`, `in_progress` $\rightarrow$ `resolved`), bloqueando respuestas posteriores al alcanzar estado terminal (AS-2) y actualizando la interfaz con retroalimentación inmediata.

---

### 2. Decisiones Técnicas y Arquitectura

| Id | Decisión | Justificación / Implementación |
|---|---|---|
| **D-1** | **Estrategia de PRs en tres fases atómicas** | Para mantener diffs pequeños (< 1000–2000 líneas), revisión rigurosa y alineación con Git Workflow:<br>1. **US-190 (KAN-190):** Modelo de dominio, adaptador Zod, reglas de seguridad en Firestore, listado paginado con cursor, filtro por estado en URL, vista de detalle/historial y estados de carga/vacío/error.<br>2. **US-191 (KAN-191):** Cloud Function `replyToSupportTicket`, simulación en `callFunction`, mutación TanStack Query, formulario de respuesta con validación Zod (1-5000 chars), actualización de estado a `in_progress` y feedback de correo.<br>3. **US-192 (KAN-192):** Cloud Function `resolveSupportTicket`, transición de máquina de estados a `resolved`, diálogo de confirmación, inhabilitación de respuestas en tickets resueltos y tests de integración. |
| **D-2** | **Modelo de Datos de Ticket (`SupportTicket`)** | Documentos en la colección raíz `supportTickets/{supportTicketId}`:<br>- `id`: string<br>- `businessId`: string<br>- `businessName`: string (desnormalizado para rendimiento en listado)<br>- `createdByUserId`: string<br>- `ownerEmail`: string (desnormalizado para lectura rápida y fallback si el usuario cambia)<br>- `subject`: string (asunto de la consulta)<br>- `message`: string (mensaje inicial del suscriptor)<br>- `status`: `SupportTicketStatus` (`open` \| `in_progress` \| `resolved`)<br>- `createdAt`: `Date`<br>- `updatedAt`: `Date`<br>- `resolvedAt`: `Nullable<Date>`<br>- `replies`: array de `SupportTicketReply` (`id`, `body`, `sentAt`, `sentByUserId`, `sentByEmail`, `emailFailed?: boolean`) |
| **D-3** | **Seguridad en Firestore (`firestore.rules`)** | Delegación mandatoria al subagente `firestore-rules-author`:<br>- Lectura (`read`): Permitida a `isSuperAdmin()` o al suscriptor dueño del negocio (`ownsBusiness(resource.data.businessId)`). Rechaza acceso a otros usuarios (`AC-KAN-190-07`).<br>- Escritura directa (`write`): `false` desde clientes. Todas las mutaciones (respuestas y cambios de estado) se ejecutan a través de Cloud Functions validadas con contexto de autenticación de `super_admin` (`AC-KAN-192-06`). |
| **D-4** | **Índices Compuestos de Firestore** | Declaración en `firestore.indexes.json` para dar soporte a la consulta filtrada por estado y ordenada por fecha descendente:<br>- `collectionGroup`: `"supportTickets"`, campos: `status` ASCENDING, `createdAt` DESCENDING. |
| **D-5** | **Separación MVVM y Componentes Atómicos** | - Vista: `SupportTicketsPage.tsx` scannable (< 80 líneas).<br>- ViewModel: `useSupportTicketsViewModel.ts` para orquestar filtros en URL, paginación con cursores y selección de ticket.<br>- Componentes: `SupportTicketTable`, `SupportTicketFilterBar`, `SupportTicketDetailDrawer`, `SupportTicketReplyForm`, `SupportTicketStatusBadge`. Todos consumen `@/components/common/`. Cero HTML crudo. |
| **D-6** | **Internacionalización y Accesibilidad (RNF-05, RNF-08)** | Claves completas bajo `admin:supportTickets.*` en `src/i18n/locales/{es,en}/admin.json`. Etiquetas semánticas en tablas (`scope="col"`), botones con `aria-label`, campo de respuesta con `aria-describedby` para contador de caracteres y anuncio de errores. |

---

### 3. Estructura de Archivos del Módulo

```text
src/modules/admin/features/support-tickets/
├── api/
│   ├── fetchSupportTicketsPage.ts
│   ├── index.ts
│   ├── SupportTicketDocument.schema.ts
│   ├── supportTicketsQueryKeys.ts
│   ├── useReplyToSupportTicketMutation.ts
│   ├── useResolveSupportTicketMutation.ts
│   └── useSupportTicketsQuery.ts
├── components/
│   ├── index.ts
│   ├── SupportTicketDetailDrawer.tsx
│   ├── SupportTicketFilterBar.tsx
│   ├── SupportTicketReplyForm.tsx
│   ├── SupportTicketStatusBadge.tsx
│   └── SupportTicketTable.tsx
├── constants/
│   ├── index.ts
│   └── supportTickets.constants.ts
├── hooks/
│   ├── index.ts
│   └── useSupportTicketsViewModel.ts
├── models/
│   ├── index.ts
│   ├── supportTicketForm.schema.ts
│   └── supportTickets.model.ts
├── specs/
│   └── SPEC.md
├── tests/
│   ├── fetchSupportTicketsPage.test.ts
│   ├── SupportTicketDocument.schema.test.ts
│   ├── SupportTicketsPage.page.ts
│   └── SupportTicketsPage.test.tsx
├── index.ts
└── SupportTicketsPage.tsx
```

---

### 4. Trazabilidad de Criterios de Aceptación

| Historia | Criterio | Descripción | Archivo de Prueba |
|---|---|---|---|
| **KAN-190** | **AC-KAN-190-01** | Listado paginado de tickets, orden descendente, asunto, negocio, fechas y estado | `SupportTicketsPage.test.tsx` |
| **KAN-190** | **AC-KAN-190-02** | Filtro por estado (`status`), reinicio a página 1 y persistencia en URL | `SupportTicketsPage.test.tsx` |
| **KAN-190** | **AC-KAN-190-03** | Apertura de detalle de ticket con mensaje original, negocio, email y respuestas en orden | `SupportTicketsPage.test.tsx` |
| **KAN-190** | **AC-KAN-190-04** | Estado vacío (`admin:supportTickets.list.empty`) cuando no hay coincidencias | `SupportTicketsPage.test.tsx` |
| **KAN-190** | **AC-KAN-190-05** | Fallback cuando el correo del negocio no está disponible (`ownerUnavailable`) | `SupportTicketsPage.test.tsx` |
| **KAN-190** | **AC-KAN-190-06** | Manejo de error de red con reintento (`common:errors.network`) | `SupportTicketsPage.test.tsx` |
| **KAN-190** | **AC-KAN-190-07** | Aislamiento y control de permisos en Firestore (solo `super_admin` o propio suscriptor) | `supportTickets.rules.test.ts` |
| **KAN-191** | **AC-KAN-191-01** | Envío de respuesta en ticket `open`, agrega a historial, notifica por email y pasa a `in_progress` | `SupportTicketsPage.test.tsx`, `replyToSupportTicket.test.ts` |
| **KAN-191** | **AC-KAN-191-02** | Respuesta en ticket `in_progress`, persiste historial y mantiene estado | `SupportTicketsPage.test.tsx`, `replyToSupportTicket.test.ts` |
| **KAN-191** | **AC-KAN-191-03** | Ticket `resolved` oculta/inhabilita formulario de respuesta (sin reapertura) | `SupportTicketsPage.test.tsx` |
| **KAN-191** | **AC-KAN-191-04** | Validación de respuesta obligatoria / no vacía (`validation:required`) | `SupportTicketsPage.test.tsx` |
| **KAN-191** | **AC-KAN-191-05** | Validación de longitud máxima (5,000 caracteres) (`validation:tooLong`) | `SupportTicketsPage.test.tsx` |
| **KAN-191** | **AC-KAN-191-06** | Manejo de colisión si el ticket fue resuelto en otra sesión | `SupportTicketsPage.test.tsx`, `replyToSupportTicket.test.ts` |
| **KAN-191** | **AC-KAN-191-07** | Error de red conserva texto digitado y no altera estado | `SupportTicketsPage.test.tsx` |
| **KAN-191** | **AC-KAN-191-08** | Marcado de `emailFailed` en la respuesta si falla el despacho de correo | `SupportTicketsPage.test.tsx`, `replyToSupportTicket.test.ts` |
| **KAN-191** | **AC-KAN-191-09** | Prevención de doble clic y despacho duplicado al enviar respuesta | `SupportTicketsPage.test.tsx` |
| **KAN-192** | **AC-KAN-192-01** | Marcar ticket como resuelto (`resolved`), registra `resolvedAt` y muestra badge | `SupportTicketsPage.test.tsx`, `resolveSupportTicket.test.ts` |
| **KAN-192** | **AC-KAN-192-02** | Ticket resuelto mantiene lectura de historial pero bloquea nuevas acciones | `SupportTicketsPage.test.tsx` |
| **KAN-192** | **AC-KAN-192-03** | Cierre directo de ticket `open` a `resolved` sin respuestas intermedias | `SupportTicketsPage.test.tsx`, `resolveSupportTicket.test.ts` |
| **KAN-192** | **AC-KAN-192-04** | Detección de ticket ya resuelto concurrentemente | `SupportTicketsPage.test.tsx`, `resolveSupportTicket.test.ts` |
| **KAN-192** | **AC-KAN-192-05** | Error de red conserva estado anterior del ticket | `SupportTicketsPage.test.tsx` |
| **KAN-192** | **AC-KAN-192-06** | Rechazo de actualización de estado si el usuario no es `super_admin` | `resolveSupportTicket.test.ts` |
