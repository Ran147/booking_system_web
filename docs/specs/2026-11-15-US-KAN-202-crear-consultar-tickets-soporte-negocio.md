# Software Design Document (SDD) — US-KAN-202 (KAN-202)
## [Negocio] Soporte: Creación y Consulta de Tickets de Soporte por el Suscriptor

| Metadato | Valor |
|---|---|
| **Historia de Usuario** | KAN-202 ("Como suscriptor quiero crear un ticket de soporte y ver su estado y respuesta") |
| **Épica** | KAN-197 / KAN-198 ([Negocio] Soporte) |
| **Portal** | Business (`src/modules/business/features/support`) |
| **Fecha de Especificación** | 2026-11-15 |
| **Estado** | Aprobada para Implementación |
| **Requerimientos Relacionados** | RF-04 (Ticketing y Soporte), RNF-04 (Usabilidad), RNF-05 (Tema Dinámico), RNF-08 (Accesibilidad WCAG AA), `auth-and-roles` §4 |

---

### 1. Resumen y Propósito

Proveer en el portal de negocio (`/business/support`) una sección dedicada, accesible y completa para que el suscriptor (dueño del negocio) pueda:
1. Crear un ticket de soporte técnico ante incidencias, consultas comerciales o problemas con la plataforma, especificando un asunto y una descripción detallada.
2. Visualizar el listado histórico de sus tickets con su estado actual (`open`, `in_progress`, `resolved`), ordenados de forma descendente por fecha de creación.
3. Consultar el detalle de cualquier ticket y leer cronológicamente las respuestas enviadas por el equipo de Super Administradores desde el backoffice.

La funcionalidad garantiza aislamiento multi-tenant estricto (`businessId` extraído de la sesión activa, nunca del cliente), integración con Cloud Functions y Firestore, tipado estricto con TypeScript, validación de formularios con React Hook Form + Zod, internacionalización completa (`es` y `en`), y accesibilidad WCAG AA.

---

### 2. Criterios de Aceptación Medibles

* **AC-KAN-202-01 [Happy Path - Creación de Ticket de Soporte]:** Dado un suscriptor autenticado con negocio activo, inactivo o suspendido, cuando completa el formulario con asunto (1–120 caracteres) y mensaje (1–5000 caracteres) y confirma el envío, se invoca la Cloud Function `createSupportTicket` que registra el ticket con estado inicial `open`, fecha actual en UTC, `replies: []`, y muestra un toast de éxito `business:support.create.success`, cerrando el modal y refrescando el listado con el nuevo ticket en primera posición.
* **AC-KAN-202-02 [Happy Path - Listado de Tickets Propios]:** Dado un suscriptor autenticado en el portal de negocio en `/business/support`, cuando carga la vista, se listan los tickets pertenecientes a su `businessId` ordenados por fecha descendente (`createdAt DESC`), mostrando para cada uno el asunto, fecha de creación, fecha de última actualización (en la zona horaria del negocio) y un badge semántico de estado (`open`, `in_progress`, `resolved`).
* **AC-KAN-202-03 [Happy Path - Detalle de Ticket y Consulta de Respuestas]:** Dado un ticket con respuestas emitidas por el super administrador, cuando el suscriptor lo selecciona en el listado, se abre un drawer/modal de detalle accesible que muestra el asunto, estado actual, fecha de creación, mensaje original y el historial cronológico ordenado de respuestas del equipo de soporte con su fecha y texto. Si no tiene respuestas aún, se muestra un mensaje informativo (`business:support.detail.noReplies`).
* **AC-KAN-202-04 [Error - Campos Requeridos Vacíos]:** Dado el formulario de creación de ticket, cuando el suscriptor intenta enviar con asunto o mensaje vacío o que contiene solo espacios en blanco, no se realiza la llamada, los campos se marcan como inválidos y se muestra el mensaje `validation:required`.
* **AC-KAN-202-05 [Error - Longitud Máxima Excedida]:** Dado el formulario de creación de ticket, cuando el suscriptor ingresa más de 120 caracteres en el asunto o más de 5000 en el mensaje, se bloquea el envío y se muestra `validation:tooLong` con el contador de caracteres en tiempo real.
* **AC-KAN-202-06 [Error - Falla de Red / Servidor]:** Dado un fallo de red o error inesperado del servidor durante la creación, el formulario mantiene el texto ingresado sin perder datos, no se crea el ticket y se notifica con toast `common:errors.network`.
* **AC-KAN-202-07 [Seguridad y Aislamiento Multi-Tenant]:** Las reglas de seguridad de Firestore impiden escrituras directas desde el cliente (`allow write: if false;`) y solo permiten leer tickets si el usuario es super administrador o el dueño del `businessId` asociado (`ownsBusiness(resource.data.businessId)`).
* **AC-KAN-202-08 [Edge - Estado Vacío]:** Dado un negocio sin tickets creados previamente, cuando el suscriptor ingresa a la sección de soporte, se muestra una pantalla o tarjeta de estado vacío (`business:support.list.empty`) con un botón de llamada a la acción para crear su primer ticket.
* **AC-KAN-202-09 [Edge - Negocio Inactivo o Suspendido]:** Dado un negocio con estado `inactive` o `suspended`, el suscriptor aún puede acceder a la sección de soporte y crear tickets para solicitar asistencia a la plataforma (excepción a la restricción general de solo lectura de KAN-49).
* **AC-KAN-202-10 [Edge - Prevención de Envío Duplicado]:** Mientras la petición de creación está en curso (`isPending`), el botón de envío se deshabilita para evitar peticiones duplicadas ante doble clic.

---

### 3. Matriz de Fronteras y Modificaciones

| Recurso / Archivo | Tipo de Cambio | Justificación |
|---|---|---|
| `docs/specs/2026-11-15-US-KAN-202-crear-consultar-tickets-soporte-negocio.md` | Nuevo | Especificación canónica SDD (Spec-First Protocol) |
| `src/modules/business/features/support/specs/SPEC.md` | Modificación | Actualización de trazabilidad y mapeo KAN-202 |
| `docs/backlog/epic-map.md` | Modificación | Actualización del mapa de épicas con KAN-197 / KAN-202 |
| `src/domain/support-ticket/SupportTicket.interface.ts` | Nuevo | Contrato canónico de la entidad `SupportTicket` |
| `src/domain/support-ticket/SupportTicketReply.interface.ts` | Nuevo | Contrato de cada respuesta en el historial de ticket |
| `src/domain/index.ts` | Modificación | Re-exportación unificada de tipos del dominio |
| `functions/src/supportTickets/createSupportTicket.ts` | Nuevo | Cloud Function callable para creación segura de tickets |
| `functions/src/supportTickets/models/CreateSupportTicket.mutation.ts` | Nuevo | Contratos de payload y response de la función |
| `functions/src/supportTickets/models/CreateSupportTicket.schema.ts` | Nuevo | Esquema Zod de validación en Cloud Function |
| `functions/src/supportTickets/tests/createSupportTicket.test.ts` | Nuevo | Pruebas unitarias de la Cloud Function |
| `functions/src/index.ts` | Modificación | Registro exportado de `createSupportTicket` |
| `firestore.rules` | Modificación | Reglas de seguridad delegadas a `firestore-rules-author` |
| `firestore.indexes.json` | Modificación | Índice compuesto `businessId` ASC, `createdAt` DESC |
| `tests/rules/supportTickets.rules.test.ts` | Nuevo | Pruebas de reglas de Firestore |
| `src/constants/firebase/FunctionName.constants.ts` | Modificación | Adición ordenada A-Z de `CREATE_SUPPORT_TICKET` |
| `src/constants/routes/RoutePath.constants.ts` | Modificación | Adición ordenada A-Z de `ROUTE_PATH.BUSINESS.SUPPORT` |
| `src/modules/business/business.routes.tsx` | Modificación | Registro de ruta `/business/support` protegida por rol |
| `src/modules/business/layout/hooks/useBusinessSidebarViewModel.ts` | Modificación | Ítem de navegación en la barra lateral para suscriptor |
| `src/modules/business/features/support/**` | Nuevos | Implementación completa de la vista, ViewModel, componentes y tests |
| `src/i18n/locales/{es,en}/business.json` | Modificación | Claves de internacionalización ordenadas A-Z bajo `support.*` |
| `api/callFunction.ts` | Modificación | Simulación fallback de `createSupportTicket` para preview / local |
| `src/services/firebase/clientFunctionsFallback.ts` | Modificación | Handler fallback de `createSupportTicket` en cliente |

---

### 4. Arquitectura de Componentes (MVVM)

```text
src/modules/business/features/support/
├── api/
│   ├── CreateSupportTicket.mutation.ts
│   ├── CreateSupportTicket.schema.ts
│   ├── SupportTicketDocument.schema.ts
│   ├── fetchSupportTickets.ts
│   ├── index.ts
│   ├── supportQueryKeys.ts
│   ├── useCreateSupportTicketMutation.ts
│   └── useSupportTicketsQuery.ts
├── components/
│   ├── CreateSupportTicketModal/
│   │   ├── CreateSupportTicketModal.constants.ts
│   │   ├── CreateSupportTicketModal.tsx
│   │   ├── CreateSupportTicketModal.types.ts
│   │   └── index.ts
│   ├── SupportTicketDetailDrawer/
│   │   ├── SupportTicketDetailDrawer.constants.ts
│   │   ├── SupportTicketDetailDrawer.tsx
│   │   ├── SupportTicketDetailDrawer.types.ts
│   │   └── index.ts
│   ├── SupportTicketList/
│   │   ├── SupportTicketList.constants.ts
│   │   ├── SupportTicketList.tsx
│   │   ├── SupportTicketList.types.ts
│   │   └── index.ts
│   ├── SupportTicketStatusBadge/
│   │   ├── SupportTicketStatusBadge.constants.ts
│   │   ├── SupportTicketStatusBadge.tsx
│   │   ├── SupportTicketStatusBadge.types.ts
│   │   └── index.ts
│   └── index.ts
├── constants/
│   ├── Support.constants.ts
│   └── index.ts
├── hooks/
│   ├── index.ts
│   ├── useCreateSupportTicketFormViewModel.ts
│   └── useSupportTicketsViewModel.ts
├── models/
│   ├── index.ts
│   ├── support.model.ts
│   └── supportViewModel.model.ts
├── specs/
│   └── SPEC.md
├── tests/
│   ├── BusinessSupportPage.page.ts
│   ├── BusinessSupportPage.test.tsx
│   ├── CreateSupportTicketModal.test.tsx
│   └── useSupportTicketsViewModel.test.tsx
├── SupportPage.tsx
└── index.ts
```
