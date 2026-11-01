# Spec técnica — KAN-59: el backend de Vercel verifica quién llama y si tiene permiso

| Campo | Valor |
| --- | --- |
| Historia / Épica | KAN-59 (eliminar servicio) y el resto de acciones de servicios (KAN-54 … KAN-61); `createBooking` |
| Portal | business (servicios) + backend de Vercel (`api/callFunction.ts`) + cliente (`src/services/firebase/`) |
| Fecha | 2026-10-31 |
| Estado | Borrador para revisión |
| SPEC de la feature | `src/modules/business/features/services/specs/SPEC.md` ("Actors and permissions", AC-KAN-61-07) |
| Depende de | PR #63 (KAN-25): trae la infraestructura de tests de `api/` (`tests/api/`) |

---

## 1. Resumen

En producción las acciones de servicios y reservas pasan por el backend de Vercel (`api/callFunction.ts`), que escribe con el Admin SDK y por eso **no pasa por `firestore.rules`**: los controles de acceso tienen que estar en el propio backend.

Las Cloud Functions de `functions/` los tenían (`assertSubscriberOf`, `assertCanManageServices`, sesión obligatoria en `createBooking`), pero en producción no corren (plan Spark) y esos controles no se copiaron al migrar a Vercel. Este PR **devuelve esos controles** al backend de Vercel, siguiendo la misma estructura del archivo (cadena de `if` por `functionName`, constantes espejo dentro del archivo). No se mueve código a otro sistema.

Reglas que se cumplen: `auth-and-roles` ("Security is enforced on the server"), `cloud-functions-standards` §5 ("Who is calling"), AGENTS.md §7 (el `businessId` sale de la sesión) y el SPEC de servicios ("A subscriber never sees or changes another business's services").

## 2. Fuera de alcance

| Tema | Por qué |
| --- | --- |
| Estado del negocio (`active`) en `createService` / `updateService` | Es una precondición de negocio, no de identidad; `deleteService` ya la revisa. Se mantiene el comportamiento actual |
| Acciones públicas (registro, `checkBusinessSlug`, contacto, pago, `verifyRecaptcha`, `requestPasswordReset`, `validateSignUpLink`) | Las usan visitantes sin cuenta; no cambian |
| reCAPTCHA real en el servidor | PR 0 / D2 (necesita la clave secreta en Vercel) |
| `clientFunctionsFallback` (escrituras desde el navegador si `api/` no responde) | Lo protegen las reglas; tema del ticket de hardening |

## 3. Cliente: mandar la credencial

- Nuevo `src/services/firebase/readAuthorizationHeader.ts`: si hay un usuario conectado (`auth.currentUser`), devuelve `{ Authorization: "Bearer <idToken>" }` con `getIdToken()`; si no, `{}`.
- `callFunction.ts` agrega ese encabezado al `fetch("/api/callFunction")`. Un solo cambio, válido para todas las acciones.
- El nombre del encabezado y el prefijo van en `HTTP_AUTHORIZATION` (`src/constants/common/HttpAuthorization.constants.ts`), como pide `constants-standards`.

## 4. Servidor: quién llama y qué puede

### 4.1 Quién llama

`readCaller(request, auth)`: lee `Authorization: Bearer <token>` y lo verifica con `auth.verifyIdToken`. Devuelve `{ userId, claims }` o `null` si falta o no es válido.

### 4.2 Qué puede (mismas condiciones que `functions/` y `firestore.rules`)

| Acción | Permitido a | Espejo de |
| --- | --- | --- |
| `deleteService` | Dueño del negocio | `assertSubscriberOf` |
| `createService`, `updateService`, `updateServiceCollaborators` | Dueño del negocio, o colaborador `active` de ese negocio con `manage_services` | `assertCanManageServices`, regla `services` |
| `createBooking` | Usuario con rol `customer` o `client`, y solo a su nombre (`customerId` igual a su `uid`) | `createBooking` de `functions/` |
| Acciones públicas (§2) | Cualquiera, sin sesión | — |
| Cualquier otra | Nadie (se niega por defecto) | — |

**Dueño** (`ownsBusiness`), igual que `firestore.rules`:

- rol `subscriber` o `business_owner` y el claim `businessId` (o `business_id`) es ese negocio; **o**
- el documento del negocio tiene `ownerUserId` (o `owner_id`) igual al `uid` de quien llama. Es el mismo respaldo de las reglas para dueños sin claims, para no bloquear cuentas que ya existen.

**Colaborador con permiso** (`canManageServices`): rol `collaborator`, claim `businessId` igual al negocio, `collaboratorId` en el token, y su documento `businesses/{id}/collaborators/{collaboratorId}` con `status: "active"` y `permissions` que incluye `manage_services`. Los permisos se leen del documento, nunca del payload (`auth-and-roles` §1).

### 4.3 Dónde se revisa

Un solo control antes de la cadena de `if`, con `checkCallerAccess(functionName, payload, …)`. Si no está permitido, ninguna acción corre:

| Resultado | Respuesta |
| --- | --- |
| Sin token o token inválido | `401`, `error: "unauthenticated"` |
| Sin permiso | `403`, `error: "permission-denied"` |

El cliente ya convierte esas respuestas en `FunctionsError` y la pantalla muestra `common:errors.permissionDenied` (AC-KAN-61-07).

### 4.4 Constantes (al inicio de `api/callFunction.ts`, orden A → Z)

- `HTTP_STATUS.FORBIDDEN: 403`, `HTTP_STATUS.UNAUTHORIZED: 401`.
- Espejos con `// Mirror of … — keep in sync.`: `USER_ROLE` (`src/domain/user/UserRole.constants.ts`), `COLLABORATOR_PERMISSION.MANAGE_SERVICES` y `COLLABORATOR_STATUS.ACTIVE` (`functions/src/shared/constants/`).
- `CALLER_ACCESS` (`allowed`, `permission-denied`, `unauthenticated`) y `PUBLIC_FUNCTION_NAMES`.

## 5. Tests

`tests/api/callerAccess.test.ts`, con `firebase-admin` simulado en memoria como en el PR #63. El simulador pasa a un archivo compartido, `tests/api/firebaseAdminFake.ts` (con `add`, `update`, consultas, `batch` y `verifyIdToken`, que devuelve los claims de un token de prueba), y la llamada al handler a `tests/api/callApiFunction.ts`; el test del registro de #63 los usa sin cambiar lo que prueba.

| Test | Cubre |
| --- | --- |
| Sin token → `401` en las 5 acciones, y no se escribe nada | quién llama |
| Token inválido → `401` | quién llama |
| Dueño por claims crea, edita y elimina servicios de su negocio | camino feliz |
| Dueño sin claims, por `ownerUserId`, puede gestionar sus servicios | respaldo de las reglas |
| Dueño de otro negocio → `403` y el servicio no cambia | aislamiento por negocio |
| Colaborador activo con `manage_services` → permitido; sin el permiso o inactivo → `403` (AC-KAN-61-07) | permisos de colaborador |
| Colaborador intenta eliminar → `403` | `deleteService` solo dueño |
| `createBooking` sin rol de cliente o a nombre de otro → `403` | reservas |
| Acción pública (`checkBusinessSlug`) sin token → funciona | sin regresión |

Y `src/services/firebase/tests/readAuthorizationHeader.test.ts`: con usuario conectado devuelve el encabezado; sin usuario, `{}`.

## 6. Prueba manual (base real)

Con `npm run dev` y la cuenta de prueba (`practica1webcourse`): crear, editar, activar/desactivar y eliminar un servicio del negocio de prueba sigue funcionando. Una llamada a `api/callFunction` sin sesión a `createService` responde `401`.

## 7. Decisiones para revisar

| Id | Decisión | Por qué |
| --- | --- | --- |
| D1 | Un control central antes de la cadena de `if` | Un solo lugar para revisar; una acción nueva queda negada hasta declararla (negar por defecto) |
| D2 | Aceptar al dueño por `ownerUserId` además de por claims | Igual que `firestore.rules`; no deja sin acceso a dueños que hoy no tienen claims |
| D3 | `createBooking` rechaza un `customerId` distinto del `uid` en vez de reemplazarlo | Solo agrega el control, sin cambiar lo que guarda la acción |
| D4 | Constantes espejo dentro de `api/callFunction.ts` | Así lo aisló Randy para que Vercel lo compile como ESM |
