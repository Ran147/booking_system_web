# Software Design Document (SDD) — Épica KAN-77
## Gestión de Colaboradores y Permisos (Portal Business + Activación en Auth)

| Metadato | Valor |
| --- | --- |
| **Épica** | KAN-77 ("Gestión Colaboradores" / "Colaboradores") |
| **Historias de Usuario** | KAN-78, KAN-79, KAN-80, KAN-81, KAN-82, KAN-83, KAN-84, KAN-85, KAN-86 |
| **Portales** | Business (`src/modules/business/features/collaborators/` y `src/modules/business/layout/`), Auth (`src/modules/auth/`, aceptación de invitación) |
| **Fecha de Especificación** | 2026-11-15 |
| **Estado** | Borrador para revisión |
| **Spec Funcional (Criterios AC)** | `src/modules/business/features/collaborators/specs/SPEC.md` (67 criterios AC: `AC-KAN-78-01` … `AC-KAN-86-09`, supuestos `AS-1` … `AS-13`) |
| **Arquitectura de Servidor** | **Vercel Serverless Functions (`api/callFunction.ts`)** con Firebase Admin SDK (`firebase-admin/auth`, `firebase-admin/firestore`) para toda la lógica privilegiada y transaccional (**Cero Firebase Cloud Functions**, Decisión Q8) |
| **Dependencias y Decisiones** | Q1 (colaborador como 5.º actor, decidida 2026-09-28), Q8 (Vercel Functions en lugar de Cloud Functions, decidida 2026-10-24), **Q9 (abierta: envío de correos transaccionales en Spark)**, KAN-180/181 (`Plan.limits.maxCollaborators`), KAN-32 (`upgrade` KAN-44, solo lectura KAN-49), KAN-30 (`serviceIds`, KAN-61), KAN-63 (agenda y bloqueos por colaborador), KAN-28/36/37/38 (reglas de contraseña, recuperación e inactividad) |

---

### 1. Resumen y Propósito

La épica **KAN-77** habilita al suscriptor (`subscriber`) para gestionar de extremo a extremo el equipo de colaboradores (`Collaborator`) que atiende clientes en su negocio:

1. **Registrar colaboradores** indicando nombre completo, correo electrónico, teléfono opcional, servicios asignados (`serviceIds`) y permisos del panel (`permissions`) (KAN-78, KAN-86).
2. **Validar límites del plan** (`Plan.limits.maxCollaborators`) de forma transaccional al registrar o reactivar colaboradores, ofreciendo el flujo de mejora de plan (KAN-44) cuando existan planes superiores activos (KAN-85).
3. **Invitar por correo y activar cuenta**: generar un enlace de invitación de un solo uso con expiración, para que el colaborador configure su contraseña y active su cuenta con rol `collaborator` y claims `{ role: "collaborator", businessId, collaboratorId }` (KAN-79).
4. **Editar datos, servicios y permisos**, manteniendo intactas las reservas futuras asignadas con advertencia al retirar un servicio, y propagando cambios de permisos sin cerrar sesión al colaborador activo (KAN-80, KAN-86).
5. **Desactivar y reactivar colaboradores**, revocando acceso inmediato en reglas y sesiones de Firebase Auth al desactivar, advirtiendo sobre reservas futuras pendientes/confirmadas, y revalidando el límite del plan al reactivar (KAN-81, KAN-82, KAN-85).
6. **Consultar el listado paginado por cursor en servidor** con filtro por estado en URL y vista de perfil individual (KAN-83).
7. **Reenviar invitación o restablecimiento de contraseña** con enfriamiento de seguridad según el estado del colaborador (`invited` vs `active`) (KAN-84).
8. **Aplicar permisos granulares (`CollaboratorPermission`)** en la navegación (`BusinessLayout` / `BusinessSidebar`), en las rutas (`business.routes.tsx`) y en la capa de servidor (`api/callFunction.ts` y `firestore.rules`) (KAN-86).

#### Principio Clave de Arquitectura: Cero Cloud Functions
Debido a que Firebase permanece en el plan gratuito Spark (Decisión Q8), **no se utilizan Firebase Cloud Functions** ni se despliega código en `functions/`. Toda operación que requiera privilegios administrativos (crear usuarios en Auth, asignar `customUserClaims`, habilitar/deshabilitar cuentas y revocar *refresh tokens*, validar `Plan.limits.maxCollaborators` en transacción, manejar tokens de invitación o mutar documentos de `collaborators`) se ejecuta **exclusivamente mediante Vercel Serverless Functions** a través del despachador `POST /api/callFunction` (`api/callFunction.ts`) utilizando `firebase-admin`.

---

### 2. Decisiones Técnicas, Estado Actual del Repo y Relación con Q8 / Q9

| Id | Tema | Decisión / Estado Verificado | Impacto Arquitectónico |
| --- | --- | --- | --- |
| **D-1** | **Backend exclusivo en Vercel (`api/callFunction.ts`)** | Todas las mutaciones de colaboradores y la validación/aceptación de invitaciones corren como acciones en `api/callFunction.ts` invocadas desde `src/services/firebase/callFunction.ts`. | Cero Cloud Functions. Se mantiene la compatibilidad de códigos de error `FunctionsError` (`error`, `message`, `details.reason`). |
| **D-2** | **Envío de correos vs. Q9 (Abierta)** | Según `docs/decisions/open-questions.md` (Q9), Firebase Spark no provee envío de correos personalizados y el equipo aún no elige proveedor transaccional. | **Separación explícita:**<br>1. **KAN-84 (`active`):** El correo de restablecimiento de contraseña utiliza la API REST de Firebase Auth (`sendOobCode` con `requestType: "PASSWORD_RESET"` y cabecera de idioma `User.language`), la cual **sí funciona gratis en Spark** (reutilizando la validación de `FIREBASE_WEB_API_KEY` / `VITE_FIREBASE_API_KEY` de `US-36`).<br>2. **KAN-78 / KAN-79 / KAN-80 / KAN-84 (`invited`):** Mientras Q9 siga abierta y no exista proveedor externo de correos, `registerCollaborator`, `updateCollaborator` (cuando cambia correo en estado `invited`) y `resendCollaboratorEmail` (`invited`) devuelven el `invitationToken` generado para que el portal muestre el enlace de activación (`/accept-invitation?token=...`) al suscriptor con acción de copiado manual, manteniendo la colección `collaboratorInvitations` protegida y el envío automático por correo pendiente de Q9. |
| **D-3** | **Colección privada para tokens de invitación** | Los hashes SHA-256 de tokens de invitación se guardan en `collaboratorInvitations/{tokenHash}` (colección raíz protegida con `allow read, write: if false;` en `firestore.rules`), **no** en `businesses/{businessId}/collaborators/{collaboratorId}`. | Impide que el suscriptor o cualquier cliente lea hashes de invitación y permite buscar invitaciones por `tokenHash` en O(1) sin escanear todos los negocios. |
| **D-4** | **Corrección de regla laxa de Sprint 1 en `collaborators`** | Hoy `firestore.rules` (líneas 190-191) permite `allow create, update: if isSignedIn() && (collaboratorId == request.auth.uid \|\| ownsBusiness(businessId))`. Para KAN-77 se restaura la regla estricta (`allow write: if false;`), manteniendo solo lectura para el dueño y el propio colaborador activo. | Cierra la brecha de escritura directa desde cliente (Q8 / `ERRORES-Y-LECCIONES.md` §5); toda escritura pasa por `api/callFunction.ts`. |
| **D-5** | **Compatibilidad con documento legado del dueño** | `completeSubscriberSignUp` en `api/callFunction.ts` (líneas 1179-1197) crea un documento en `collaborators/{userId}` con `is_owner: true` y `permissions` como mapa booleano. | Las acciones de KAN-77 y la consulta de listado filtran/excluyen registros con `is_owner === true` al contar `maxCollaborators` y en el listado UI (`KAN-83`, `KAN-85`), evitando contar al suscriptor como colaborador empleado ni romper el esquema Zod de `Collaborator`. |
| **D-6** | **Modelo canónico de permisos (`CollaboratorPermission[]`)** | `src/domain/collaborator/CollaboratorPermission.constants.ts` define la lista cerrada `COLLABORATOR_PERMISSION`: `manage_bookings`, `manage_customers`, `manage_schedule_blocks`, `manage_services`, `view_reports`. `firestore.rules` (`collaboratorCan`) usa `permissions.hasAny([permission])` sobre arreglo. | Todas las pantallas y acciones de KAN-77 almacenan y leen `permissions` como `CollaboratorPermission[]`. El adaptador en `api/callFunction.ts` normaliza por seguridad si encuentra datos legados. |
| **D-7** | **Límites de plan y concurrencia (`KAN-85`)** | El conteo de cupos usados suma colaboradores en estado `"invited"` y `"active"` (excluyendo `"inactive"` y registros `is_owner: true`). La verificación contra `Plan.limits.maxCollaborators` ocurre dentro de `firestore.runTransaction`. | Garantiza que registros o reactivaciones simultáneas nunca excedan el cupo del plan (`AC-KAN-85-05`). |
| **D-8** | **Reglas de unicidad de correo (`AS-1`)** | Una cuenta de Firebase Auth tiene exactamente un rol. Al registrar (`KAN-78`) o cambiar el correo de un colaborador `invited` (`KAN-80`), el servidor valida que no exista otro colaborador del mismo negocio con ese correo (cualquier estado) ni una cuenta existente en Firebase Auth (`auth.getUserByEmail`). | Cumple `AC-KAN-78-05`, `AC-KAN-78-06` y `AC-KAN-80-05` sin filtrar datos de otros negocios. |
| **D-9** | **Rollback Auth + Firestore en `acceptCollaboratorInvitation`** | Si `auth.createUser` tiene éxito pero la transacción de Firestore falla, la Vercel Function elimina el usuario recién creado en Auth (`auth.deleteUser`) y relanza el error. Los `customUserClaims` se asignan después de confirmar la transacción. | Garantiza consistencia atómica sin usuarios huérfanos (`AC-KAN-79-07`, `AC-KAN-79-08`). |

---

### 3. Arquitectura del Servidor: Vercel Serverless Functions (`/api/callFunction`)

Todas las operaciones de escritura y consultas sensibles de KAN-77 se registran como acciones dentro de `api/callFunction.ts`.

#### 3.1. Nuevas Acciones en `FUNCTION_NAME` (`src/constants/firebase/FunctionName.constants.ts` y `api/callFunction.ts`)

Siguiendo `constants-standards` (orden alfabético A-Z y `Object.freeze`):

```typescript
export const FUNCTION_NAME = Object.freeze({
  ACCEPT_COLLABORATOR_INVITATION: "acceptCollaboratorInvitation",
  // ... acciones existentes
  REGISTER_COLLABORATOR: "registerCollaborator",
  RESEND_COLLABORATOR_EMAIL: "resendCollaboratorEmail",
  // ...
  UPDATE_COLLABORATOR: "updateCollaborator",
  UPDATE_COLLABORATOR_PERMISSIONS: "updateCollaboratorPermissions",
  UPDATE_COLLABORATOR_STATUS: "updateCollaboratorStatus",
  // ...
  VALIDATE_COLLABORATOR_INVITATION: "validateCollaboratorInvitation",
} as const);
```

#### 3.2. Matriz de Autorización en `checkCallerAccess` (`api/callFunction.ts`)

| Acción (`functionName`) | Acceso en `checkCallerAccess` | Notas de Seguridad |
| --- | --- | --- |
| `registerCollaborator` | Solo dueño (`ownsBusiness(firestore, caller, businessId)`), `collaborator` **denegado** (`403`) | `businessId` debe coincidir con el claim `businessId` del suscriptor (`AC-KAN-78-09`). |
| `updateCollaborator` | Solo dueño (`ownsBusiness`) | Rechaza si el negocio no está `active` (`412`, `business_not_active`). |
| `updateCollaboratorStatus` | Solo dueño (`ownsBusiness`) | Valida transición con `COLLABORATOR_STATUS_TRANSITIONS`. |
| `updateCollaboratorPermissions` | Solo dueño (`ownsBusiness`) | Un colaborador nunca puede modificar permisos propios ni ajenos. |
| `resendCollaboratorEmail` | Solo dueño (`ownsBusiness`) | Verifica cooldown de 60 segundos (`lastEmailSentAt`). |
| `validateCollaboratorInvitation` | Público (`PUBLIC_FUNCTION_NAMES`) | Solo recibe `invitationToken`, no requiere sesión; nunca retorna secretos ni hashes. |
| `acceptCollaboratorInvitation` | Público (`PUBLIC_FUNCTION_NAMES`) + **verificación reCAPTCHA en el servidor** | Requiere `recaptchaToken` válido verificado dentro del handler antes de crear la cuenta. |

> **Nota de aislamiento:** En todas las acciones del portal `business`, `businessId` en el payload debe coincidir con el `businessId` de los claims del token verificado por `auth.verifyIdToken(token)` (con excepción explícita de los fixtures de test `VITEST` ya existentes en `readCaller`). Además, si el negocio tiene estado distinto de `active` (`inactive`, `suspended`, `pending`, `rejected`), las mutaciones del suscriptor responden `412 Precondition Failed` con `{ error: "failed-precondition", details: { reason: "business_not_active" } }`.

---

#### 3.3. Especificación de Cada Manejador en `api/callFunction.ts`

##### A. `REGISTER_COLLABORATOR` (KAN-78, KAN-85, KAN-86)
- **Propósito:** Registrar un nuevo colaborador en estado `invited`, validar límite del plan en transacción y emitir el primer enlace de invitación.
- **Payload (`RegisterCollaboratorPayload`):**
  ```typescript
  interface RegisterCollaboratorPayload {
    readonly businessId: string;
    readonly email: string;
    readonly fullName: string;
    readonly permissions: readonly CollaboratorPermission[];
    readonly phone?: Nullable<string>;
    readonly serviceIds: readonly string[];
  }
  ```
- **Validaciones de entrada (Zod):**
  - `fullName`: trimmed, entre `FULL_NAME_RULE.MIN_LENGTH` (2) y `FULL_NAME_RULE.MAX_LENGTH` (80).
  - `email`: trimmed, lowercase, formato válido de correo.
  - `phone`: opcional (`null` o string válido según `PHONE_RULE`: 7-15 dígitos, máx 20 caracteres, patrón `PHONE_RULE.PATTERN.ALLOWED_CHARACTERS`).
  - `permissions`: arreglo de valores válidos de `COLLABORATOR_PERMISSION` (sin duplicados).
  - `serviceIds`: arreglo de IDs string sin duplicados.
  - Si falla validación → `400 Bad Request` (`invalid-argument`).
- **Flujo en servidor (`api/callFunction.ts`):**
  1. Verificar que el negocio existe y `status === "active"`. Si no, `412` (`details.reason = "business_not_active"`).
  2. Verificar que el correo no exista ya en Firebase Auth (`auth.getUserByEmail(email)`). Si existe → `409 Conflict` con `{ error: "already-exists", details: { reason: "email_in_use" } }` (`AC-KAN-78-06`).
  3. Ejecutar `firestore.runTransaction`:
     - Leer `subscription/current` y el documento `plans/{planId}` correspondiente para obtener `limits.maxCollaborators` (`null` / `-1` / `Infinity` según contrato de `Plan` significa ilimitado; validar el mismo convenio de `KAN-181`).
     - Consultar `businesses/{businessId}/collaborators` dentro de la transacción:
       - Verificar que ningún colaborador existente (excepto `is_owner`) tenga el mismo `email` normalizado (`status` `invited`, `active` o `inactive`). Si existe → `409 Conflict` (`details.reason = "duplicate_email"`, `AC-KAN-78-05`).
       - Contar colaboradores cuyo `status` sea `"invited"` o `"active"` (excluyendo `is_owner: true`). Si `activeOrInvitedCount >= maxCollaborators` → `412 Precondition Failed` (`details.reason = "collaborator_limit_reached"`, `AC-KAN-78-11`, `AC-KAN-85-01`, `AC-KAN-85-05`).
     - Si `serviceIds.length > 0`, verificar que todos los `serviceIds` pertenezcan al negocio y estén en estado `"active"`.
     - Generar nuevo documento `collaborators/{collaboratorId}` con:
       - `businessId`, `email`, `fullName`, `phone: phone ?? null`, `status: "invited"`, `permissions`, `serviceIds`, `userId: null`, `lastEmailSentAt: Timestamp.now()`, `createdAt: Timestamp.now()`, `updatedAt: Timestamp.now()`.
     - Generar `invitationToken` (32 bytes aleatorios `crypto.randomBytes(32).toString("base64url")`), calcular `tokenHash = sha256(invitationToken)`, y crear `collaboratorInvitations/{tokenHash}` con:
       - `businessId`, `businessName`, `collaboratorId`, `email`, `expiresAt: now + 7 days`, `usedAt: null`, `language` (idioma del suscriptor desde `users/{caller.userId}.language ?? "es"`), `createdAt: Timestamp.now()`.
  4. Despachar invitación vía adaptador de correo (sujeto a resolución de Q9).
- **Respuesta Exitosa (`200 OK`):** `{ collaboratorId, status: "invited" }`.

---

##### B. `VALIDATE_COLLABORATOR_INVITATION` (KAN-79)
- **Propósito:** Validar si un enlace `/accept-invitation?token=<token>` sigue vigente antes de mostrar el formulario de contraseña.
- **Payload (`ValidateCollaboratorInvitationPayload`):** `{ readonly invitationToken: string }`.
- **Flujo en servidor:**
  1. Calcular `tokenHash = sha256(invitationToken.trim())`.
  2. Leer `collaboratorInvitations/{tokenHash}`.
  3. Verificar: existe, `usedAt === null`, `expiresAt.toMillis() > Date.now()`, y el `Collaborator` asociado en `businesses/{businessId}/collaborators/{collaboratorId}` existe y tiene `status === "invited"`.
  4. Si cualquier verificación falla → `412 Precondition Failed` (`details.reason = "invitation_invalid"`, `AC-KAN-79-05`).
- **Respuesta Exitosa (`200 OK`):** `{ businessName, email }` (solo datos públicos mínimos de la invitación, nunca `businessId` interno ni hashes, `AC-KAN-79-02`).

---

##### C. `ACCEPT_COLLABORATOR_INVITATION` (KAN-79)
- **Propósito:** Activar la cuenta del colaborador cuando define su contraseña desde el enlace de invitación.
- **Payload (`AcceptCollaboratorInvitationPayload`):**
  ```typescript
  interface AcceptCollaboratorInvitationPayload {
    readonly invitationToken: string;
    readonly password: string;
    readonly recaptchaToken: string;
  }
  ```
- **Flujo en servidor (con Rollback Auth + Firestore):**
  1. Validar `invitationToken` no vacío, `password` cumple todas las reglas de `PASSWORD_RULE` (mínimo 8 caracteres, mayúscula, minúscula, dígito, símbolo), y `recaptchaToken` presente.
  2. Verificar `recaptchaToken` en el servidor (misma lógica de verificación real que `verifyRecaptcha`, respetando emulador/test). Si falla → `403 Forbidden` (`permission-denied`).
  3. Leer `collaboratorInvitations/{tokenHash}` y `Collaborator` para prevalidar estado (`invited`, no expirada, no usada).
  4. Verificar que el negocio sigue `active` (o permitir activación? No restringido si el negocio existía, pero si el correo ya tiene cuenta en Auth → `409 Conflict` / `412` con `details.reason = "cannot_accept_invitation"` según `AC-KAN-79-08`).
  5. Crear usuario en Firebase Auth: `auth.createUser({ displayName: collaborator.fullName, email: collaborator.email, emailVerified: true, password })`. Si Firebase retorna `auth/email-already-exists` → `412 Precondition Failed` (`details.reason = "cannot_accept_invitation"`, `AC-KAN-79-08`).
  6. Dentro de `firestore.runTransaction`:
     - Re-leer `collaboratorInvitations/{tokenHash}` y `businesses/{businessId}/collaborators/{collaboratorId}`.
     - Revalidar que `usedAt === null`, `expiresAt > now` y `collaborator.status === "invited"`. Si falló por carrera o uso previo → lanzar error para ejecutar rollback y responder `412` (`invitation_invalid`).
     - Marcar invitación usada: `usedAt = Timestamp.now()`.
     - Actualizar colaborador: `status: "active"`, `userId: newUser.uid`, `updatedAt: Timestamp.now()`.
     - Crear documento `users/{newUser.uid}` con `{ email: collaborator.email, fullName: collaborator.fullName, language: invitation.language, phone: collaborator.phone ?? null, role: "collaborator", businessId, collaboratorId, theme: "system", uid: newUser.uid }`.
  7. **Si la transacción falla:** en el bloque `catch`, ejecutar `await auth.deleteUser(newUser.uid)` (rollback) y retornar el error correspondiente (`AC-KAN-79-07`, `AC-KAN-79-08`).
  8. **Tras confirmar la transacción:** asignar `await auth.setCustomUserClaims(newUser.uid, { businessId, collaboratorId, role: "collaborator" })`.
- **Respuesta Exitosa (`200 OK`):** `{ email: collaborator.email }`.

---

##### D. `UPDATE_COLLABORATOR` (KAN-80, KAN-86)
- **Propósito:** Actualizar nombre, teléfono, servicios asignados, permisos y (solo si está `invited`) correo electrónico.
- **Payload (`UpdateCollaboratorPayload`):**
  ```typescript
  interface UpdateCollaboratorPayload {
    readonly businessId: string;
    readonly collaboratorId: string;
    readonly email?: string;
    readonly expectedUpdatedAt: string; // ISO 8601 para control de concurrencia optimista (AC-KAN-80-07)
    readonly fullName: string;
    readonly permissions: readonly CollaboratorPermission[];
    readonly phone?: Nullable<string>;
    readonly serviceIds: readonly string[];
  }
  ```
- **Flujo en servidor:**
  1. Validar payload con Zod (`FULL_NAME_RULE`, `PHONE_RULE`, `COLLABORATOR_PERMISSION`).
  2. Verificar negocio `active`.
  3. En `firestore.runTransaction`:
     - Leer `businesses/{businessId}/collaborators/{collaboratorId}`. Si no existe → `404 Not Found`.
     - **Control de conflicto optimista (`AC-KAN-80-07`):** comparar `collaborator.updatedAt.toMillis()` con `new Date(expectedUpdatedAt).getTime()`. Si difieren → `409 Conflict` (`details.reason = "edit_conflict"`).
     - Si el correo enviado difiere del actual:
       - Si `collaborator.status !== "invited"` → rechazar con `412 Precondition Failed` (`details.reason = "email_locked"`, `AS-7`, `AC-KAN-80-03`).
       - Si `collaborator.status === "invited"` → validar que el nuevo correo no esté en otro colaborador del negocio (`duplicate_email`) ni en Firebase Auth (`email_in_use`), invalidar todos los documentos activos previos en `collaboratorInvitations` para ese `collaboratorId` (marcando `usedAt = Timestamp.now()` o `invalidatedAt`), y crear un nuevo documento `collaboratorInvitations/{newTokenHash}` + actualizar `lastEmailSentAt` (`AC-KAN-80-03`).
     - Consultar reservas futuras `pending` o `confirmed` asignadas a `collaboratorId` cuyo `serviceId` haya sido removido de `serviceIds` — **no cancelar ni modificar esas reservas** (`AS-8`), y devolver su conteo (`removedServicesUpcomingBookingsCount`) para mostrar la advertencia `AC-KAN-80-04` (o confirmarlo).
     - Actualizar `fullName`, `phone`, `serviceIds`, `permissions`, `email` (si aplica) y `updatedAt: Timestamp.now()`.
- **Respuesta Exitosa (`200 OK`):** `{ collaboratorId, emailChanged: boolean, removedServicesBookingsCount: number, updatedAt: string }`.

---

##### E. `UPDATE_COLLABORATOR_STATUS` (KAN-81, KAN-82, KAN-85)
- **Propósito:** Desactivar un colaborador `active` → `inactive` (KAN-81) o reactivar un colaborador `inactive` → `active` (KAN-82).
- **Payload (`UpdateCollaboratorStatusPayload`):**
  ```typescript
  interface UpdateCollaboratorStatusPayload {
    readonly businessId: string;
    readonly collaboratorId: string;
    readonly targetStatus: "active" | "inactive";
  }
  ```
- **Flujo en servidor:**
  1. Verificar negocio `active` (`412`, `business_not_active`).
  2. En `firestore.runTransaction`:
     - Leer `businesses/{businessId}/collaborators/{collaboratorId}`. Si no existe → `404`.
     - Validar la máquina de estados `COLLABORATOR_STATUS_TRANSITIONS`:
       - `invited` → `inactive`: **prohibido** (`412`, `details.reason = "invalid_transition"`, `AC-KAN-81-04`).
       - `active` → `active` o `inactive` → `inactive` (p. ej. por otra sesión): **prohibido** (`412`, `details.reason = "invalid_transition"`, `AC-KAN-82-03`).
     - Si `targetStatus === "active"` (`inactive -> active`, reactivación):
       - Revalidar `Plan.limits.maxCollaborators` contando los colaboradores `invited` + `active`. Si `count >= maxCollaborators` → `412` (`details.reason = "collaborator_limit_reached"`, `AC-KAN-82-02`, `AC-KAN-85-01`).
     - Actualizar `status: targetStatus` y `updatedAt: Timestamp.now()`.
  3. **Sincronización con Firebase Auth (fuera de la transacción, si `collaborator.userId` existe):**
     - Si `targetStatus === "inactive"` (`KAN-81`, `AC-KAN-81-02`):
       - `await auth.updateUser(collaborator.userId, { disabled: true })`
       - `await auth.revokeRefreshTokens(collaborator.userId)`
       - Nota: Como `firestore.rules` verifica `collaboratorRecord(businessId).status == 'active'`, cualquier lectura/escritura queda bloqueada al instante, y el siguiente refresh de token cierra sesión devolviendo `auth/user-disabled` (`common:auth.signIn.accountDisabled`).
     - Si `targetStatus === "active"` (`KAN-82`, `AC-KAN-82-01`):
       - `await auth.updateUser(collaborator.userId, { disabled: false })`
- **Respuesta Exitosa (`200 OK`):** `{ collaboratorId, status: targetStatus }`.

---

##### F. `UPDATE_COLLABORATOR_PERMISSIONS` (KAN-86)
- **Propósito:** Guardar explícitamente el conjunto de permisos `CollaboratorPermission[]` desde la vista de permisos/perfil del colaborador.
- **Payload:** `{ readonly businessId: string; readonly collaboratorId: string; readonly permissions: readonly CollaboratorPermission[] }`.
- **Flujo en servidor:**
  1. Verificar dueño del negocio (`ownsBusiness`) y negocio `active`.
  2. Validar que cada elemento pertenezca a `Object.values(COLLABORATOR_PERMISSION)`.
  3. Actualizar `businesses/{businessId}/collaborators/{collaboratorId}` (`permissions`, `updatedAt`) — sin revocar tokens ni cerrar sesión (`AC-KAN-80-02`, `AC-KAN-86-01`).
- **Respuesta Exitosa (`200 OK`):** `{ collaboratorId, permissions }`.

---

##### G. `RESEND_COLLABORATOR_EMAIL` (KAN-84)
- **Propósito:** Reenviar el correo de invitación (si está `invited`) o el correo de restablecimiento de contraseña (si está `active`).
- **Payload:** `{ readonly businessId: string; readonly collaboratorId: string }`.
- **Flujo en servidor:**
  1. Verificar dueño del negocio (`ownsBusiness`) y negocio `active`.
  2. Leer `businesses/{businessId}/collaborators/{collaboratorId}`. Si no existe → `404`.
  3. Si `collaborator.status === "inactive"` → `412 Precondition Failed` (`details.reason = "invalid_transition"`, `AC-KAN-84-04`).
  4. **Enfriamiento (rate limit, `AC-KAN-84-03`):** verificar `lastEmailSentAt`. Si `(Date.now() - lastEmailSentAt.toMillis()) < 60_000` → `429 Too Many Requests` / `resource-exhausted` (`details.reason = "cooldown_active"`, incluyendo `retryAfterSeconds`).
  5. **Si `status === "invited"`:**
     - En transacción: invalidar invitaciones previas del `collaboratorId`, generar nuevo `invitationToken`, guardar `collaboratorInvitations/{newTokenHash}` con nueva expiración (7 días) y actualizar `lastEmailSentAt = Timestamp.now()` (`AC-KAN-84-01`).
     - Enviar correo vía adaptador (sujeto a Q9; si falla la red/proveedor, revertir/no invalidar la invitación previa si se despacha antes, o mantener intacta la previa en caso de error antes de confirmar el reemplazo, `AC-KAN-84-05`).
  6. **Si `status === "active"`:**
     - Leer `users/{collaborator.userId}.language` (fallback `"es"`).
     - Llamar a Firebase Identity Toolkit `sendOobCode` (`requestType: "PASSWORD_RESET"`) con la cabecera `X-Firebase-Locale` (mismo mecanismo de `functions/src/auth/requestPasswordReset.ts`, funcional en Spark sin proveedor externo, `AC-KAN-84-02`).
     - Actualizar `lastEmailSentAt = Timestamp.now()`.
- **Respuesta Exitosa (`200 OK`):** `{ collaboratorId, emailType: "invitation" | "password_reset", sentAt: string }`.

---

### 4. Modelo de Datos y Colecciones Firestore

#### 4.1. Estructura de Documentos

```text
businesses/{businessId}
  ├── collaborators/{collaboratorId}
  │     ├── businessId: string
  │     ├── createdAt: Timestamp
  │     ├── email: string                         # Lowercase, trimmed. Editable solo en "invited"
  │     ├── fullName: string                      # 2..80 caracteres
  │     ├── lastEmailSentAt: Nullable<Timestamp>  # Control de cooldown de 60s (KAN-84)
  │     ├── permissions: CollaboratorPermission[] # [] | subset de COLLABORATOR_PERMISSION
  │     ├── phone: Nullable<string>               # Opcional, PHONE_RULE
  │     ├── serviceIds: string[]                  # IDs de servicios asignados (KAN-78, KAN-61)
  │     ├── status: "invited" | "active" | "inactive"
  │     ├── updatedAt: Timestamp
  │     └── userId: Nullable<string>              # Asignado al aceptar invitacion (KAN-79)
  │
  ├── bookings/{bookingId}                        # Solo lectura de conteo futuro por collaboratorId/serviceId
  ├── services/{serviceId}                        # Lectura de servicios activos para selector (KAN-78)
  └── subscription/current                        # Lectura de planId para limite maxCollaborators (KAN-85)

collaboratorInvitations/{tokenHash}               # Coleccion raiz privada (solo Admin SDK)
  ├── businessId: string
  ├── businessName: string
  ├── collaboratorId: string
  ├── createdAt: Timestamp
  ├── email: string
  ├── expiresAt: Timestamp                        # createdAt + 7 dias (AS-2)
  ├── invalidatedAt: Nullable<Timestamp>
  ├── language: "es" | "en"
  └── usedAt: Nullable<Timestamp>

plans/{planId}                                    # Lectura de limits.maxCollaborators (KAN-181, KAN-85)
users/{userId}                                    # Creado al aceptar invitacion con role: "collaborator"
```

#### 4.2. Índices Requeridos (`firestore.indexes.json`)

El listado paginado del suscriptor (`KAN-83`, `AC-KAN-83-01`, `AC-KAN-83-02`) ordena por `fullName ASC` y filtra opcionalmente por `status == <status>`:

| Colección | Campos Indexados | Scope | Uso |
| --- | --- | --- | --- |
| `collaborators` | `status ASC`, `fullName ASC` | `COLLECTION` | Listado paginado filtrado por estado (`active` / `inactive` / `invited`) ordenado alfabéticamente (`KAN-83`). |

*(Nota: la consulta sin filtro de estado `orderBy("fullName", "asc")` utiliza el índice automático de campo único).*

---

### 5. Reglas de Seguridad en Firestore (`firestore.rules`)

Se alinean las reglas con `auth-and-roles` §4 y la Decisión Q8:

1. **Subcolección `businesses/{businessId}/collaborators/{collaboratorId}`:**
   - `allow read`: únicamente `ownsBusiness(businessId)` o `(isCollaboratorOf(businessId) && collaboratorId == request.auth.token.collaboratorId)` (`AC-KAN-83-07`, `AC-KAN-86-04`).
   - `allow write`: **`if false;`** — se elimina la excepción temporal de Sprint 1; toda creación, edición, cambio de estado y cambio de permisos ocurre exclusivamente en `api/callFunction.ts` mediante Firebase Admin SDK.
2. **Colección `collaboratorInvitations/{tokenHash}`:**
   - `allow read, write: if false;` — exclusivamente accesible por el servidor (`firebase-admin`) en `api/callFunction.ts`.
3. **Aplicación transversal de `CollaboratorPermission` (`KAN-86`) en `firestore.rules`:**
   - `isCollaboratorOf(businessId)` exige `hasRole('collaborator')`, coincidencia de `businessId`, `collaboratorId is string`, y `collaboratorRecord(businessId).status == 'active'` (así un colaborador desactivado pierde lectura inmediata).
   - Sin permisos extra: lee sus propias reservas (`resource.data.collaboratorId == request.auth.token.collaboratorId`), `services` del negocio, `scheduleBlocks` del negocio y su propio documento de `collaborators`.
   - `manage_bookings`: habilita lectura de todas las reservas del negocio; mutaciones de reservas pasan por `/api/callFunction`.
   - `manage_schedule_blocks`: habilita escritura en `scheduleBlocks` mientras `businessIsWritable(businessId)`.
   - `manage_services`: habilita escritura en `services` mientras `businessIsWritable(businessId)`.
   - `manage_customers`: habilita lectura (y escritura cuando se implemente `KAN-87`) en `customers` mientras `businessIsWritable(businessId)`.
   - Áreas prohibidas para cualquier colaborador (`subscription`, `payments`, `businesses/{id}` update de perfil/horarios/configuración, `collaborators` de otros o escritura): denegadas para el rol `collaborator` (`AC-KAN-86-05`).
4. **Plan y suscripción (`KAN-85`):**
   - El suscriptor ya puede leer su `subscription/current` y `plans/{planId}` (reglas existentes `isSubscribedToPlan` y `plans` activos) para mostrar el uso actual `"usados / permitidos"` (`AC-KAN-85-03`) y comprobar si existe un plan superior activo (`AC-KAN-85-04`).

---

### 6. Arquitectura del Frontend (Portal Business y Auth)

#### 6.1. Feature `src/modules/business/features/collaborators/` (MVVM)

```text
src/modules/business/features/collaborators/
├── api/
│   ├── CollaboratorDocument.schema.ts         # Zod adapter: Firestore -> modelo Collaborator (Date)
│   ├── collaboratorQueryKeys.ts               # Factory: all, list, detail, usage, activeServices
│   ├── fetchCollaboratorDetail.ts             # Lee 1 colaborador + conteo de reservas futuras
│   ├── fetchCollaboratorListPage.ts           # Paginacion por cursor + getCountFromServer (KAN-83)
│   ├── fetchCollaboratorUsage.ts              # Lee limite de plan + conteo invited/active (KAN-85)
│   ├── mapCollaboratorMutationError.ts        # Mapea FunctionsError/reason a keys i18n
│   ├── useCollaboratorDetailQuery.ts
│   ├── useCollaboratorListQuery.ts
│   ├── useCollaboratorUsageQuery.ts
│   ├── useRegisterCollaboratorMutation.ts     # Llama FUNCTION_NAME.REGISTER_COLLABORATOR
│   ├── useResendCollaboratorEmailMutation.ts  # Llama FUNCTION_NAME.RESEND_COLLABORATOR_EMAIL
│   ├── useUpdateCollaboratorMutation.ts       # Llama FUNCTION_NAME.UPDATE_COLLABORATOR
│   ├── useUpdateCollaboratorPermissionsMutation.ts
│   ├── useUpdateCollaboratorStatusMutation.ts # Llama FUNCTION_NAME.UPDATE_COLLABORATOR_STATUS
│   └── index.ts
├── components/
│   ├── CollaboratorDeactivateDialog.tsx       # Confirmacion con alerta de reservas futuras (KAN-81)
│   ├── CollaboratorEmptyState.tsx             # Vacio inicial vs filtro sin resultados (KAN-83)
│   ├── CollaboratorForm.tsx                   # React Hook Form + Zod (KAN-78, KAN-80)
│   ├── CollaboratorLimitDialog.tsx            # Aviso de limite + enlace upgrade KAN-44 (KAN-85)
│   ├── CollaboratorListTable.tsx              # Tabla con Badge de estado, servicios y acciones
│   ├── CollaboratorListToolbar.tsx            # Filtro de estado (en URL) + indicador uso/limite
│   ├── CollaboratorPermissionsGroup.tsx       # Grupo accesible de checkboxes (KAN-86)
│   ├── CollaboratorProfileCard.tsx            # Detalle completo y acciones por estado (KAN-83, 84)
│   ├── CollaboratorServicePicker.tsx          # Selector multi-servicio solo activos (KAN-78)
│   └── index.ts
├── constants/
│   └── CollaboratorFeature.constants.ts       # Claves URL, cooldowns, defaults (A-Z, Object.freeze)
├── hooks/
│   ├── useCollaboratorFormViewModel.ts        # Alta (KAN-78) y edicion (KAN-80) + limite (KAN-85)
│   ├── useCollaboratorListViewModel.ts        # Cursor pagination, URL filter, uso del plan (KAN-83, 85)
│   ├── useCollaboratorPermissionsViewModel.ts # Gestion dedicada de permisos (KAN-86)
│   ├── useCollaboratorProfileViewModel.ts     # Perfil, activar/desactivar, reenvio con cooldown (KAN-81, 82, 84)
│   └── index.ts
├── models/
│   ├── Collaborator.model.ts                  # JSDoc @typedef + TS interfaces (CollaboratorListItem, Detail, Usage)
│   ├── CollaboratorForm.schema.ts             # Zod schema compartido (FULL_NAME_RULE, PHONE_RULE)
│   ├── CollaboratorMutations.model.ts         # *Payload y *Response interfaces
│   └── index.ts
├── pages/
│   ├── CollaboratorFormPage.tsx               # /business/collaborators/new y /:collaboratorId/edit
│   ├── CollaboratorListPage.tsx               # /business/collaborators
│   ├── CollaboratorPermissionsPage.tsx        # /business/collaborators/:collaboratorId/permissions (o integrado en perfil)
│   ├── CollaboratorProfilePage.tsx            # /business/collaborators/:collaboratorId
│   └── index.ts
├── specs/
│   └── SPEC.md                                # Spec funcional existente (67 criterios AC)
├── tests/
│   ├── CollaboratorFormPage.page.ts / .test.tsx
│   ├── CollaboratorListPage.page.ts / .test.tsx
│   ├── CollaboratorPermissionsPage.page.ts / .test.tsx
│   └── CollaboratorProfilePage.page.ts / .test.tsx
└── index.ts
```

#### 6.2. Aceptación de Invitación en `src/modules/auth/` (KAN-79)

- Nueva ruta pública/invitado en `src/modules/auth/auth.routes.tsx` bajo `GuestOnly`:
  - `ROUTE_PATH.AUTH.ACCEPT_INVITATION = "/accept-invitation"`
  - Agregar `"accept-invitation"` a `RESERVED_BUSINESS_SLUG` en `src/domain/business/BusinessSlug.constants.ts` en el mismo PR (verificado por `isReservedBusinessSlug.test.ts`).
- Componentes y hooks en `src/modules/auth/`:
  - `AcceptInvitationPage.tsx` + `useAcceptInvitationViewModel.ts`
  - Consulta inicial `validateCollaboratorInvitation` (muestra `businessName` y `email` solo lectura si válido, o `common:auth.invitation.linkInvalid` sin formulario si inválido/expirado/usado, `AC-KAN-79-02`, `AC-KAN-79-05`).
  - Formulario con `PasswordInput` (mostrar/ocultar), medidor de fortaleza reutilizando `evaluatePasswordStrength` y `PASSWORD_RULE` (KAN-37), confirmación de contraseña y `RecaptchaField`.
  - Al enviar, llama `acceptCollaboratorInvitation`; al completar, redirige a `ROUTE_PATH.AUTH.SIGN_IN` con el correo prellenado y aviso `common:auth.invitation.accepted` (`AC-KAN-79-03`).

#### 6.3. Navegación, Rutas y Permisos en Portal Business (`src/modules/business/`)

1. **`ROUTE_PATH.BUSINESS` (`src/constants/routes/RoutePath.constants.ts`):**
   - `COLLABORATORS: "collaborators"`
   - `COLLABORATOR_NEW: "collaborators/new"`
   - `COLLABORATOR_DETAIL: "collaborators/:collaboratorId"`
   - `COLLABORATOR_EDIT: "collaborators/:collaboratorId/edit"`
   - `COLLABORATOR_PERMISSIONS: "collaborators/:collaboratorId/permissions"`
2. **Protección de rutas (`src/modules/business/business.routes.tsx`):**
   - Las rutas de `collaborators/*` viven dentro de `<RequireRole allowedRoles={[USER_ROLE.BUSINESS_OWNER, USER_ROLE.SUBSCRIBER]} />` (igual que `BUSINESS_PROFILE`), impidiendo acceso directo por URL a cualquier `collaborator` incluso si tiene todos los permisos (`AC-KAN-78-09`, `AC-KAN-86-05`).
   - Las rutas con permiso granular (`services/*`, `customers/*`, `reports/*`, etc.) se protegen con un guard de permiso de colaborador (p. ej. `RequireCollaboratorPermission`) que lee `Collaborator.permissions` del colaborador autenticado y redirige a `ROUTE_PATH.BUSINESS.ROOT` cuando falta el permiso requerido (`AC-KAN-86-04`), mostrando `common:errors.permissionDenied` si el permiso fue retirado en vivo (`AC-KAN-86-08`).
3. **Sidebar (`src/modules/business/layout/hooks/useBusinessSidebarViewModel.ts`):**
   - Habilitar el ítem `collaborators` con `isAvailable: true` y `href: /business/${ROUTE_PATH.BUSINESS.COLLABORATORS}` (solo visible para `isSubscriber`).
   - Para `isCollaborator`, leer `collaboratorProfileQuery.data?.permissions` en `fetchCollaboratorProfile.ts` y filtrar dinámicamente `navItems` según `COLLABORATOR_PERMISSION`:
     - Siempre visible: `dashboard` (home) y `schedule` (su propia agenda en solo lectura sin `manage_bookings`, `AS-4`, `AC-KAN-86-02`).
     - Visible solo con permiso: `services` (`manage_services`), `customers` (`manage_customers`), `reports` (`view_reports`).
     - Nunca visible para `collaborator`: `collaborators`, `profile`, `settings` de negocio, `subscription` (`AC-KAN-86-05`).
4. **Reglas de UI y Diseño:**
   - Prohibidos controles HTML crudos (`<button>`, `<input>`, `<select>`): usar exclusivamente átomos de `src/components/common/` (`Button`, `InputField`, `PasswordInput`, `SelectField`, `Modal`, `Badge`, `StatusBadge`, `Table`, `CursorPagination`, `Spinner`, `Alert`).
   - Colores exclusivamente mediante tokens semánticos Tailwind v4 (`bg-background`, `bg-card`, `text-foreground`, `border-border`, etc.) para cumplir `RNF-05` (Dark/Light).
   - Todos los textos visibles en `src/i18n/locales/{es,en}/{business,common,validation}.json` (sin literales en código).
   - Negocios `inactive` o `suspended`: modo solo lectura con `business:errors.readOnly` y acciones de escritura deshabilitadas tanto para suscriptor como para colaborador (`KAN-49`, `AC-KAN-86-09`).

---

### 7. Estrategia de Pruebas y Trazabilidad

#### 7.1. Pruebas Unitarias del Servidor Vercel (`tests/api/`, entorno `node`)
Siguiendo el patrón de `tests/api/completeSubscriberSignUp.test.ts` (mock en memoria de `firebase-admin` sin red ni emulador):

- `tests/api/registerCollaborator.test.ts`:
  - `KAN-78`: creación en estado `invited`, generación de hash de invitación en `collaboratorInvitations`, rechazo por correo duplicado en el negocio (`duplicate_email`), rechazo por cuenta existente en Auth (`email_in_use`), rechazo cuando llama un `collaborator` (`403`), rechazo si el negocio no está `active` (`412`).
  - `KAN-85`: conteo exacto de `invited + active` (excluyendo `inactive` y `is_owner`), rechazo por límite alcanzado (`collaborator_limit_reached`) y prueba de **concurrencia** con dos registros paralelos compitiendo por el último cupo (uno crea, el otro falla con `412`).
- `tests/api/collaboratorInvitation.test.ts`:
  - `KAN-79`: validación exitosa de token, rechazo de token expirado/usado/malformado, aceptación creando Auth user + `users/{uid}` + claims `{ role: "collaborator", businessId, collaboratorId }` + transición `invited -> active`, rechazo si el correo ya existe en Auth, y prueba de **rollback** (`auth.deleteUser` ejecutado si falla la transacción de Firestore).
- `tests/api/collaboratorLifecycle.test.ts`:
  - `KAN-80`: edición de datos, bloqueo de edición de correo en `active`/`inactive`, invalidación de invitación previa al cambiar correo en `invited`, conflicto optimista (`409 edit_conflict`), conteo de reservas futuras al quitar un servicio sin cancelarlas.
  - `KAN-81` / `KAN-82`: desactivación (`active -> inactive`) deshabilitando usuario Auth y revocando *refresh tokens*; rechazo de `invited -> inactive`; reactivación (`inactive -> active`) habilitando Auth y revalidando `maxCollaborators`.
  - `KAN-84`: reenvío de invitación invalidando enlace anterior; envío de reset de contraseña en idioma del colaborador vía `sendOobCode` cuando está `active`; rechazo en `inactive`; cooldown de 60 s.
  - `KAN-86`: actualización de permisos y rechazo ante valores inválidos o llamadas no autorizadas.

#### 7.2. Pruebas de Reglas Firestore (`tests/rules/collaborators.rules.test.ts`)
Ampliar la suite existente contra emulador para probar:
- `KAN-78`..`KAN-86`: denegación estricta (`allow write: if false`) de creación, actualización y borrado directo desde cliente en `collaborators` (incluso para el dueño `subscriber` y para el propio `collaborator`).
- `KAN-79`: denegación total de lectura y escritura en `collaboratorInvitations` para cualquier usuario o visitante.
- `KAN-81`, `KAN-83`, `KAN-86`: mantener y ampliar verificaciones de lectura aislada por `businessId`, bloqueo inmediato al cambiar `status` a `inactive`, y acceso condicional por `permissions`.

#### 7.3. Pruebas de Componentes UI y ViewModels (`tests/` en `collaborators`, `auth`, `business/layout`)
Con Vitest, Testing Library, `renderWithProviders`, `testI18n` (`LANGUAGE.ES`) y Page Objects (`*.page.ts`), nombrando cada prueba con el prefijo `KAN-78:` … `KAN-86:`:
- `CollaboratorListPage.test.tsx`: listado paginado por cursor, filtro por estado en URL, estados vacíos (`empty` / `emptyFiltered`), error de red con reintento, indicador de uso vs límite del plan (`KAN-83`, `KAN-85`).
- `CollaboratorFormPage.test.tsx`: creación, selector de servicios activos, selector de permisos, validaciones Zod (`validation:required`, `emailInvalid`, `tooShort`, `tooLong`), errores del servidor (`duplicateEmailError`, `emailInUseError`, `conflictError`), modal de límite alcanzado con enlace a upgrade (`KAN-78`, `KAN-80`, `KAN-85`).
- `CollaboratorProfilePage.test.tsx`: detalle de colaborador, confirmación de desactivación con conteo de reservas futuras, reactivación, reenvío con contador regresivo de 60 s, modo solo lectura (`KAN-81`, `KAN-82`, `KAN-83`, `KAN-84`).
- `CollaboratorPermissionsPage.test.tsx`: guardado de checkboxes accesibles de `CollaboratorPermission`, manejo de errores y estado solo lectura (`KAN-86`).
- `AcceptInvitationPage.test.tsx` (en `src/modules/auth/tests/`): validación de enlace válido vs inválido/expirado, medidor de fortaleza de contraseña, reCAPTCHA, redirección a login con correo prellenado (`KAN-79`).
- `BusinessSidebar.test.tsx` y `BusinessLayout.test.tsx`: visibilidad dinámica de navegación por permisos, redirección cuando un colaborador navega a rutas sin permiso o exclusivas de suscriptor (`KAN-86`).

---

### 8. Matriz de Fronteras y Plan de Entrega en PRs

Para evitar colisiones y respetar `AGENTS.md` §2 (PRs atómicos y acotados a la épica):

| PR | Alcance / Archivos | Estado |
| --- | --- | --- |
| **PR 1 (Spec)** | `docs/specs/2026-11-15-KAN-77-gestion-colaboradores.md` | Nuevo |
| **PR 2 (Backend Vercel + Rules)** | `src/constants/firebase/FunctionName.constants.ts`, `api/callFunction.ts` (handlers `KAN-78`..`KAN-86`), `firestore.rules` (regla estricta en `collaborators` y `collaboratorInvitations`), `firestore.indexes.json`, `tests/api/*`, `tests/rules/collaborators.rules.test.ts` | Nuevos / Modificados |
| **PR 3 (Auth: Aceptar Invitación - KAN-79)** | `src/domain/business/BusinessSlug.constants.ts`, `src/constants/routes/RoutePath.constants.ts`, `src/modules/auth/` (`AcceptInvitationPage`, ViewModel, `auth.routes.tsx`, tests), `src/i18n/locales/{es,en}/common.json` | Nuevos / Modificados |
| **PR 4 (Business UI: Lista, Alta, Edición, Perfil, Límites - KAN-78, 80..85)** | `src/modules/business/features/collaborators/` (MVVM completo, POM, tests), `src/modules/business/business.routes.tsx`, `src/i18n/locales/{es,en}/business.json` | Nuevos / Modificados |
| **PR 5 (Business RBAC y Permisos - KAN-86)** | `src/modules/business/layout/` (`fetchCollaboratorProfile.ts`, `useBusinessSidebarViewModel.ts`, guard de permisos, tests), `src/modules/business/business.routes.tsx` | Modificados |
| **Resto del proyecto** | `landing/`, `customer/`, `admin/`, `functions/` | **PROHIBIDO MODIFICAR** |

---

### 9. Verificación de Calidad Previa a Integración

Antes de abrir o fusionar cada PR de implementación, deben ejecutarse y aprobar con **0 errores y 0 advertencias**:

```bash
npm run format:check
npm run lint
npm run typecheck
npm run test:run
npm run test:rules
```
