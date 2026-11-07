# Spec técnica — KAN-25: el registro no sobrescribe cuentas ni negocios existentes

| Campo | Valor |
| --- | --- |
| Historia / Épica | KAN-25 / KAN-26 (registro de suscriptor) |
| Portal | landing (registro) + backend de Vercel (`api/callFunction.ts`) |
| Fecha | 2026-10-31 |
| Estado | Borrador para revisión |
| SPEC de la feature | `src/modules/landing/features/subscriber-sign-up/specs/SPEC.md` (AC-KAN-25-09, AC-KAN-25-16, AC-KAN-25-18, AS-5, AS-7) |
| Depende de | Nada. Primer PR de la corrección de seguridad del backend de Vercel |

---

## 1. Resumen

En producción el registro lo atiende la acción `completeSubscriberSignUp` de `api/callFunction.ts` (Vercel + Admin SDK), no la Cloud Function de `functions/`. Hoy esa acción **puede escribir encima de datos que ya existen** en vez de rechazar el registro:

- Con un correo que ya tiene cuenta no responde `accountExists` (incumple AC-KAN-25-09 y AS-5).
- Con un `slug` ocupado no responde `slugTaken` (incumple AC-KAN-25-18).

Este PR hace que la acción **solo cree** y nunca reescriba, siguiendo la misma estructura de `if (functionName === …)` que ya tiene el archivo. La pantalla no cambia: ya sabe mostrar `accountExists` y `slugTaken` (`useSubscriberSignUpFormViewModel.ts`).

## 2. Fuera de alcance (otros PRs)

| Tema | Dónde |
| --- | --- |
| Verificar el token de sesión en las acciones del backend | PR B (seguridad) |
| Verificar que el registro viene de un pago real (`validateSignUpLink` sigue siendo stub) | PR 5 (KAN-24) |
| `emailVerified: true` al crear la cuenta | PR de verificación de correo (corrección 1) |
| Slugs reservados (AC-KAN-25-17) y demás reglas del payload | Sin cambios aquí; la pantalla ya los valida |
| Copiar la lógica completa de `functions/src/billing/completeSubscriberSignUp.ts` | No: solo se corrige lo que sobrescribe datos |

## 3. Cambios en `completeSubscriberSignUp` (`api/callFunction.ts`)

### 3.1 Orden

1. **Crear la cuenta** con `auth.createUser`. Se quita `getUserByEmail` + `updateUser`.
   - Si Firebase responde `auth/email-already-exists` → `409`, `error: "already-exists"`, `details.reason: "accountExists"`. No se toca la cuenta existente (AC-KAN-25-09, AS-5: mensaje neutro).
2. **Reservar el `slug`** con `businessSlugs/<slug>.create(...)`. `create` falla si el documento ya existe, así que dos registros a la vez nunca obtienen el mismo `slug`.
   - Si ya existe → se borra la cuenta del paso 1 y se responde `409`, `error: "already-exists"`, `details.reason: "slugTaken"` (AC-KAN-25-18).
3. Claims y `users/<uid>`: igual que hoy.
4. **Crear el negocio** con `businesses/business-<slug>.create(...)` en vez de `set(..., { merge: true })`. Si un negocio con ese id ya existiera sin su `businessSlugs` (dato viejo), falla en vez de reescribirlo y se trata igual que el paso 2. Después, suscripción, colaborador dueño y servicio por defecto: igual que hoy.
5. **Deshacer si algo falla después del paso 1** (`cloud-functions-standards`, rollback de Auth + Firestore): se borran lo que este registro haya creado (`businesses/<id>` con sus subcolecciones, `users/<uid>`, `businessSlugs/<slug>`) y la cuenta de Auth, y se responde el error. Así el visitante puede reintentar con el mismo correo. Solo se borra lo creado en esta llamada.

### 3.2 Formato de error

El mismo que ya usa el archivo (por ejemplo `paymentDeclined` en `payPlanCheckout`), que `src/services/firebase/callFunction.ts` convierte en `FunctionsError`:

```json
{ "details": { "reason": "accountExists" }, "error": "already-exists", "message": "An account already exists for the checkout email" }
```

### 3.3 Constantes (al inicio de `api/callFunction.ts`, orden A → Z)

- `HTTP_STATUS.CONFLICT: 409`.
- `FIREBASE_ADMIN_ERROR_CODE` (`EMAIL_ALREADY_EXISTS: "auth/email-already-exists"`, `FIRESTORE_ALREADY_EXISTS: 6`, el código gRPC con que falla `create`) y el helper `hasErrorCode`, igual al de `functions/src/shared/hasErrorCode.ts`.
- `SIGN_UP_ERROR_REASON` (`ACCOUNT_EXISTS: "accountExists"`, `SLUG_TAKEN: "slugTaken"`), con la línea `// Mirror of … — keep in sync.` hacia `functions/src/billing/constants/SubscriberSignUp.constants.ts`.
- Los mensajes para desarrolladores, en inglés como el resto del archivo; nunca se muestran al usuario.

## 4. Tests

Hoy `api/` no tiene tests. Se agrega `tests/api/completeSubscriberSignUp.test.ts` (fuera de `api/`, para que Vercel no lo publique como endpoint), con entorno `node` y `firebase-admin` simulado en memoria (`vi.mock`). `vitest.config.ts` incluye `tests/api/**/*.test.ts` en `npm run test:run`, y `eslint.config.js` permite que esos tests importen `api/` por ruta relativa (el alias `@/` solo llega a `src/`, igual que la excepción que ya existe para `functions/`). No usa la base real ni el emulador.

| Test | Cubre |
| --- | --- |
| AC-KAN-25-16 · registro nuevo crea cuenta, `businessSlugs`, negocio y responde `{ email }` | camino feliz sin cambios |
| AC-KAN-25-09 · correo con cuenta → `409 accountExists`, la cuenta existente no cambia y no se crea nada en Firestore | fallo 1 |
| AC-KAN-25-18 · `slug` ocupado → `409 slugTaken`, el negocio existente no cambia y la cuenta nueva se borra | fallo 2 |
| AC-KAN-25-18 · negocio `business-<slug>` existente sin `businessSlugs` → `409 slugTaken`, no se reescribe | dato viejo |
| AC-KAN-25-16 · si falla una escritura posterior, se borra lo creado y la cuenta, y se puede reintentar | rollback |

## 5. Prueba manual (base real)

Con `npm run dev` apuntando a `practica1webcourse` (`.env.local`):

1. Registrar con un correo que ya tiene cuenta (la cuenta secundaria de prueba) → mensaje neutro, y la contraseña anterior sigue funcionando.
2. Registrar con un `slug` ya usado → error en el campo `slug`, y el negocio existente queda igual en la consola.
3. Registro nuevo (`PRUEBA - …`) → entra al portal como hoy.

## 6. Decisiones para revisar

| Id | Decisión | Por qué |
| --- | --- | --- |
| D1 | Se corrige dentro de `api/callFunction.ts` con el mismo estilo, sin mover código a otro archivo | Seguir la línea del backend de Vercel que ya usa el equipo |
| D2 | `create` en Firestore en vez de leer y después escribir | Es atómico: evita que dos registros simultáneos tomen el mismo `slug`, sin transacción aparte |
| D3 | Tests en `tests/api/` con `firebase-admin` simulado | Sin tocar producción y sin depender del emulador en `test:run` |

## 7. Integración de seguridad con KAN-199

El registro no tiene una implementación alternativa en el cliente. Si el
endpoint de Vercel y la Cloud Function no están disponibles, la operación debe
fallar sin crear usuarios, negocios ni documentos parciales. El aprovisionamiento
requiere Admin SDK para emitir los custom claims `role`, `businessId` y
`business_id`, y para poder revertir Auth y Firestore como una sola operación
lógica.

Las cuentas creadas históricamente sin esos claims no se corrigen relajando
`firestore.rules`. Antes de desplegar las reglas estrictas, el equipo debe
inventariarlas y migrarlas con Admin SDK, comprobando que el UID coincida con
`ownerUserId` o `owner_id`, y luego forzar la renovación del token. Esta tarea es
operativa y no autoriza ejecutar cambios contra producción desde pruebas o desde
el cliente.
