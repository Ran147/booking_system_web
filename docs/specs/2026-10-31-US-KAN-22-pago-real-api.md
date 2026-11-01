# Spec técnica — KAN-22: el pago del plan con la lógica real en el backend de Vercel

| Campo | Valor |
| --- | --- |
| Historia / Épica | KAN-22 / KAN-20 (contratación de planes) |
| Portal | backend de Vercel (`api/callFunction.ts`) |
| Fecha | 2026-10-31 |
| Estado | Borrador para revisión |
| SPEC de la feature | `src/modules/landing/features/plan-checkout/specs/SPEC.md` (AC-KAN-22-02, 04, 06 … 11, AS-9) |
| Spec base | `docs/specs/2026-10-17-US-KAN-22-pago-del-plan.md` (la función `payPlanCheckout` de `functions/`, §3) |
| Depende de | PR #64 (KAN-59): mismo archivo y la infraestructura de `tests/api/` |

---

## 1. Resumen

En producción el pago lo atiende la acción `payPlanCheckout` de `api/callFunction.ts`, que hoy es un **stub**: guarda un `PlanCheckout` con el precio que manda el cliente, sin revisar el plan, sin reCAPTCHA y sin evitar el cobro doble. La lógica correcta ya existe y tiene tests en `functions/src/billing/payPlanCheckout.ts` (spec del 2026-10-17, §3), pero en el plan Spark no corre.

Este PR **reemplaza el stub por esa misma lógica**, dentro del mismo `if (functionName === FUNCTION_NAME.PAY_PLAN_CHECKOUT)` y con el estilo del archivo (constantes espejo al inicio, `firestore` de `getAdminServices()`, errores con `sendJsonResponse`). Las reglas no cambian: son las de la spec del 2026-10-17.

La pantalla todavía no llama a esta acción (simula el pago en el navegador). Conectarla es el PR siguiente (KAN-22, pantalla).

## 2. Fuera de alcance

| Tema | Dónde |
| --- | --- |
| Conectar `PlanCheckoutPage` con `payPlanCheckout`, `attemptId` en el cliente, errores en pantalla, quitar el botón de atajo a `/sign-up` | PR siguiente (KAN-22, pantalla) |
| `TERMS_VERSION` real | KAN-23 |
| Token del enlace y correo | KAN-24 |
| reCAPTCHA real en `verifyRecaptcha` y en las otras acciones públicas | Otros PRs; aquí solo el pago |

## 3. Orden de la acción (igual que `functions/`, spec base §3.2)

1. **Payload** con `payPlanCheckoutPayloadSchema` (Zod, espejo de `functions/src/billing/models/PayPlanCheckout.schema.ts`): `attemptId` UUID, `planId`, `expectedPriceInCents`, `email` (`trim` + minúsculas), tarjeta (16 dígitos, `MM/AA` no vencido, CVC de 3 o 4), `cardholderName` (2–60), `termsAccepted: true`, `language` (`es`/`en`), `recaptchaToken`. Falla → `400 invalid-argument`.
2. **reCAPTCHA** dentro de la misma acción (`cloud-functions-standards` §5), con `RECAPTCHA_SECRET_KEY` de las variables de entorno contra `https://www.google.com/recaptcha/api/siteverify`:
   - Google lo rechaza → `403 permission-denied` (AC-KAN-22-06).
   - Google no responde, o falta `RECAPTCHA_SECRET_KEY` → `503 unavailable`. **Sin clave no se cobra nada**: el pago queda cerrado, nunca abierto.
3. **Transacción** (`firestore.runTransaction`), con `planCheckouts/{attemptId}`:
   - Ya existe con el mismo `planId` y `email` → responde lo mismo, sin cobrar de nuevo (AC-KAN-22-09). Con otro `planId` u otro `email` → `412 failed-precondition`, reason `attemptReused`.
   - El plan no existe, no está `active` o no tiene la forma esperada → `412`, reason `planUnavailable` (AC-KAN-22-07).
   - `priceInCents` ≠ `expectedPriceInCents` → `412`, reason `priceChanged`, con `currentPriceInCents` en `details` (AC-KAN-22-08).
   - Pasarela simulada: la tarjeta `4000000000000002` → `412`, reason `paymentDeclined`, y no se guarda nada (AC-KAN-22-04). Las demás se aprueban con una referencia `sim_<hex>`.
   - Aprobado → `transaction.create` de `planCheckouts/{attemptId}` con `planId`, `email`, `language`, `amountInCents` (el del plan), `paidAt`, `paymentReference`, `termsAcceptedAt`, `termsVersion`, y `signUpCompletedAt`, `signUpTokenHash`, `signUpLinkExpiresAt` en `null`. **Los datos de la tarjeta nunca se guardan** (AS-9).
4. Responde `{ email }` con el email normalizado.

Igual que en `functions/`, no se crea ninguna cuenta, negocio ni pago (AC-KAN-22-03).

## 4. Constantes (al inicio de `api/callFunction.ts`, orden A → Z)

Espejos con `// Mirror of … — keep in sync.` de `functions/src/billing/constants/PlanCheckout.constants.ts` y `functions/src/shared/constants/`: `PLAN_CHECKOUT_ERROR_REASON`, `PLAN_CHECKOUT_FIELD_LIMIT`, `PLAN_CHECKOUT_PATTERN`, `CARD_EXPIRY`, `SIMULATED_GATEWAY`, `TERMS_VERSION`, `RECAPTCHA_VERIFICATION`, `LANGUAGE` y `PLAN_STATUS.ACTIVE`. `HTTP_STATUS.SERVICE_UNAVAILABLE: 503`. `CHECKOUT_SIMULATION` (del stub) se reemplaza por `SIMULATED_GATEWAY`.

## 5. Tests

`tests/api/payPlanCheckout.test.ts`, con el simulador de `firebase-admin` de #64 (al que se le agrega `runTransaction`, que corre las transacciones una por una como hace Firestore ante dos escrituras del mismo documento) y `fetch` simulado para Google. Los mismos casos que `functions/src/billing/tests/payPlanCheckout.test.ts`:

| Test | Cubre |
| --- | --- |
| Pago aprobado guarda un `PlanCheckout` con plan, email, monto del plan, fecha y términos | AC-KAN-22-02 |
| Deja `signUpTokenHash` y `signUpLinkExpiresAt` en `null` | spec base D1 |
| No crea cuenta, negocio ni pago | AC-KAN-22-03 |
| No guarda los datos de la tarjeta | AS-9 |
| Tarjeta de rechazo → `paymentDeclined`, nada guardado | AC-KAN-22-04 |
| reCAPTCHA rechazado → `403`; sin clave o sin Google → `503`; en ambos casos nada guardado | AC-KAN-22-06 |
| Plan inactivo, inexistente o mal formado → `planUnavailable` | AC-KAN-22-07 |
| Precio cambiado → `priceChanged` con el precio nuevo | AC-KAN-22-08 |
| Reintento del mismo `attemptId` → misma respuesta, un solo `PlanCheckout`, también si el plan se desactivó después o el email cambia solo en mayúsculas o espacios | AC-KAN-22-09, AC-KAN-22-11 |
| Mismo `attemptId` con otro plan u otro email → `attemptReused` | spec base §3.4 |
| Dos llamadas a la vez con el mismo `attemptId` → un solo `PlanCheckout` | AC-KAN-22-10 |
| Email guardado sin espacios y en minúsculas; tarjeta con espacios aceptada | AC-KAN-22-11, AS-9 |
| Payload inválido (sin términos, tarjeta vencida, `attemptId` no UUID) → `400` | spec base §3.1 |

## 6. Prueba manual (base real)

Con `npm run dev` contra `practica1webcourse` y la clave secreta **pública de prueba** de Google en la terminal (`RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe npm run dev`; hace pareja con la clave de sitio de prueba de `.env.local` y aprueba todo token):

1. Llamar a `payPlanCheckout` con un plan activo y su precio → se crea `planCheckouts/<attemptId>` en la consola, sin datos de tarjeta.
2. Repetir la misma llamada → misma respuesta y un solo documento.
3. Tarjeta `4000000000000002` → `paymentDeclined` y nada nuevo.
4. Precio distinto → `priceChanged`.

## 7. Decisiones para revisar

| Id | Decisión | Por qué |
| --- | --- | --- |
| D1 | Se reemplaza el stub dentro del mismo `if`, con el estilo de `api/callFunction.ts` | Seguir la línea del backend de Vercel del equipo |
| D2 | El payload se valida con Zod, con el mismo esquema que `functions/` | Las reglas (UUID, email, vencimiento, CVC) son las de la spec base; Zod ya es dependencia del proyecto y evita reescribirlas a mano |
| D3 | El pago falla cerrado (`503`) si falta `RECAPTCHA_SECRET_KEY` | Un pago no puede quedar abierto a scripts. Hoy no afecta a nadie: la pantalla todavía no llama a esta acción |
| D4 | **Antes de conectar la pantalla (PR siguiente), la variable `RECAPTCHA_SECRET_KEY` tiene que estar en Vercel** con la clave secreta real | Sin ella, el pago en producción responde `503` |
