# Spec técnica — KAN-59: el backend de Vercel verifica quién llama y si tiene permiso

| Campo | Valor |
| --- | --- |
| Historia / Épica | KAN-59 (eliminar servicio) y el resto de acciones de servicios (KAN-54 … KAN-61); `createBooking` |
| Portal | business (servicios) + backend de Vercel (`api/callFunction.ts`) + cliente (`src/services/firebase/`) |
| Fecha | 2026-10-31 (actualizada 2026-11-24 tras la revisión del PR #64) |
| Estado | Borrador para revisión |
| SPEC de la feature | `src/modules/business/features/services/specs/SPEC.md` ("Actors and permissions", AC-KAN-61-07) |
| Depende de | PR #63 (KAN-25, fusionado): infraestructura de tests de `api/` (`tests/api/`) |

---

## 1. Resumen

En producción las acciones de servicios, agenda y reservas pasan por el backend de Vercel (`api/callFunction.ts`), que escribe con el Admin SDK y por eso **no pasa por `firestore.rules`**: los controles de acceso tienen que estar en el propio backend.

Este PR propuso ese control (verificar el token y los permisos antes de ejecutar cualquier acción, negando por defecto). El diseño llegó a `develop` con el #76 (KAN-63, `checkCallerAccess`), que además cubre las acciones de agenda y reservas. **Tras la revisión, este PR ya no trae su propio control**: usa el de `develop` y aporta lo que faltaba, las **pruebas automáticas del control de acceso** y esta spec como registro de las reglas.

Reglas que se cumplen: `auth-and-roles` ("Security is enforced on the server"), `cloud-functions-standards` §5 ("Who is calling"), AGENTS.md §7 (el `businessId` sale de la sesión) y el SPEC de servicios ("A subscriber never sees or changes another business's services").

## 2. Fuera de alcance

| Tema | Por qué |
| --- | --- |
| Cambiar el control de acceso de `api/callFunction.ts` | Ya está en `develop` (#76). Este PR solo lo prueba |
| Mover el control a `functions/src/shared` (Q8, punto 3) | Pospuesto, ver D5 |
| Estado del negocio (`active`) en `createService` / `updateService` | Es una precondición de negocio, no de identidad |
| reCAPTCHA real en el servidor | Necesita la clave secreta en Vercel; `verifyRecaptcha` sigue simulado |
| `clientFunctionsFallback` (escrituras desde el navegador si `api/` no responde) | Lo protegen las reglas; tema del ticket de hardening |

## 3. Cliente: mandar la credencial

Ya en `develop`: `src/services/firebase/readAuthorizationHeader.ts` agrega `Authorization: Bearer <idToken>` si hay sesión, y `callFunction.ts` lo envía en cada llamada (`HTTP_AUTHORIZATION` en `src/constants/common/`). Este PR no cambia el cliente.

## 4. Servidor: quién llama y qué puede

### 4.1 Quién llama

`readCaller(request, auth)` lee `Authorization: Bearer <token>` y lo verifica con `auth.verifyIdToken`. Devuelve `{ userId, claims }` o `null` si falta o no es válido.

### 4.2 Qué puede (`checkCallerAccess` en `develop`)

| Grupo | Acciones | Permitido a |
| --- | --- | --- |
| Configuración del negocio | `updateBusinessHours`, `updateConfirmationMode`, `deleteService` | Solo el dueño |
| Servicios | `createService`, `updateService`, `updateServiceCollaborators` | Dueño, o colaborador `active` con `manage_services` |
| Bloqueos de agenda | `createScheduleBlock`, `deleteScheduleBlock` | Dueño, o colaborador `active` con `manage_schedule_blocks` |
| Lectura de bloqueos | `fetchScheduleBlocks` | Dueño, o cualquier colaborador `active` del negocio |
| Reservas del negocio | `updateBookingStatus`, `fetchBookingHistory` | Dueño, o colaborador `active` con `manage_bookings` |
| Cancelar y reprogramar | `cancelBooking`, `rescheduleBooking` | Dueño o colaborador con `manage_bookings`, o el cliente dueño de la reserva |
| Disponibilidad | `getAvailability` | Solo clientes (`customer` / `client`) |
| Nueva reserva | `createBooking` | Un cliente, siempre a su nombre (el handler toma el `uid` del token e ignora `customerId`); o dueño / colaborador con `manage_bookings` |
| Públicas | registro, `checkBusinessSlug`, contacto, pago, `verifyRecaptcha`, `requestPasswordReset`, `validateSignUpLink` | Cualquiera, sin sesión |
| Cualquier otra | — | Nadie (se niega por defecto) |

**Dueño** (`ownsBusiness`), igual que `firestore.rules` en `develop` hoy: rol `subscriber` / `business_owner` con el claim `businessId` de ese negocio, **o** el documento del negocio tiene `ownerUserId` igual al `uid` de quien llama (respaldo para dueños sin claims). El #54 (KAN-199) endurece las reglas a rol **y** claim **y** `ownerUserId`; cuando entre, el backend queda más permisivo que las reglas (ver D6).

**Colaborador** (`getActiveCollaborator`): rol `collaborator`, claim `businessId` igual al negocio y su documento `businesses/{id}/collaborators/{id}` con `status: "active"`. Los permisos se leen del documento, nunca del payload (`auth-and-roles` §1).

### 4.3 Respuestas

| Resultado | Respuesta |
| --- | --- |
| Sin token o token inválido | `401`, `error: "unauthenticated"` |
| Sin permiso | `403`, `error: "permission-denied"` |

El cliente convierte esas respuestas en `FunctionsError` y la pantalla muestra `common:errors.permissionDenied` (AC-KAN-61-07).

## 5. Tests

`tests/api/callerAccess.test.ts` llama al handler real de `api/callFunction.ts` con `firebase-admin` simulado en memoria (`tests/api/firebaseAdminFake.ts`: Firestore con consultas y `verifyIdToken`, que devuelve los claims de un token de prueba). Los handlers compartidos de `functions/src` (`handleCreateBooking`, `handleGetAvailability`) se reemplazan, como en `sharedBookingHandlers.test.ts`, porque tienen sus propias pruebas: aquí solo importa quién llega a ellos. La llamada al handler vive en `tests/api/callApiFunction.ts`, y el test del registro (#63) usa el mismo simulador sin cambiar lo que prueba.

| Test | Cubre |
| --- | --- |
| Sin token → `401` en las 15 acciones protegidas, y no se escribe nada | quién llama |
| Token inválido → `401` | quién llama |
| Servicios: dueño (con y sin claims) y colaborador con `manage_services` permitidos; dueño de otro negocio, colaborador sin permiso o inactivo, y colaborador que elimina → `403` | servicios |
| Configuración: el dueño cambia el horario y el modo de confirmación; un colaborador con todos los permisos → `403` en horario y modo, y el negocio no cambia | solo dueño |
| Bloqueos: colaborador con `manage_schedule_blocks` crea y elimina; sin el permiso no crea (AC-KAN-66-09) ni elimina → `403`; cualquier colaborador activo lee; colaborador inactivo, colaborador con claim de otro negocio y dueño de otro negocio → `403` | agenda |
| Reservas del negocio: colaborador con `manage_bookings` lee el historial y confirma; sin el permiso → `403` y la reserva no cambia | reservas |
| Cancelar / reprogramar: el dueño cancela (KAN-72) y un colaborador con `manage_bookings` reprograma (KAN-71); el cliente de la reserva cancela; otro cliente → `403` en ambas; colaborador sin permiso → `403` | reservas del cliente |
| `createBooking`: el cliente llega al handler con el `uid` de su token aunque el payload traiga otro `customerId` (que lo ignore lo prueba el handler en `functions/`); dueño de otro negocio → `403` | nueva reserva |
| `getAvailability`: cliente permitido; dueño → `403` | disponibilidad |
| Acción pública sin token funciona; acción no declarada → `403` | sin regresión, negar por defecto |

Cada test cita la historia que cubre (KAN-64 a KAN-76 de agenda, KAN-158/KAN-159 del cliente). Con el control desactivado (todo permitido), fallan 35 de los 49 tests.

## 6. Prueba manual (base real)

Hecha el 2026-10-31 con el control original: crear, editar, activar/desactivar y eliminar un servicio funciona, y una llamada sin sesión a `createService` responde `401`. El control de `develop` sigue el mismo diseño.

## 7. Decisiones

| Id | Decisión | Por qué |
| --- | --- | --- |
| D1 | Un control central antes de la cadena de `if`, negando por defecto | Un solo lugar para revisar; una acción nueva queda negada hasta declararla. Implementado en `develop` (#76) |
| D2 | Aceptar al dueño por `ownerUserId` además de por claims | Igual que `firestore.rules` de `develop` hoy; no deja sin acceso a dueños que hoy no tienen claims |
| D3 | `createBooking` de un cliente usa el `uid` del token e ignora `customerId` | Es como lo resolvió `develop` (KAN-139, D-4); reemplaza la propuesta original de rechazar un `customerId` distinto |
| D4 | Este PR no trae un segundo control | Revisión del #64: un solo control de acceso, el de `develop` |
| D5 | Mover el control a `functions/src/shared` (Q8, punto 3) queda **pospuesto** | Las Cloud Functions ya revisan permisos con sus propios helpers (`assertSubscriberOf`, `assertCanManageServices`); unificarlos cambia código de varias historias y no cabe en este PR. Se retoma cuando las acciones de servicios se muevan a handlers compartidos, como ya pasó con `createBooking` y `getAvailability`. Estas pruebas sirven de red para ese cambio |
| D6 | Si el backend sigue el criterio estricto del #54 (KAN-199) queda **por decidir con el autor del #54** | Hoy no es un riesgo: el `ownerUserId` sigue siendo del dueño real. Alinear el backend cambia `api/callFunction.ts`, fuera del alcance de este PR (D4); si se decide, se cambia `ownsBusiness` y la prueba del dueño sin claims pasa a esperar `403` |
