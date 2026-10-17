# Spec técnica — KAN-22: pagar el plan con la pasarela simulada

| Campo | Valor |
| --- | --- |
| Historia / Épica | KAN-22 / KAN-20 (contratación de planes) |
| Portal | landing (`src/modules/landing/features/plan-checkout/`) + `functions/src/billing/` |
| Fecha | 2026-10-17 |
| Estado | Borrador para revisión |
| SPEC de la feature | `src/modules/landing/features/plan-checkout/specs/SPEC.md` (AC-KAN-22-01 … 11, AS-9, AS-12, AS-13) |
| Depende de | Q7, Q5 y Q2 (decididas 2026-09-28); KAN-21 (PR #18, botón "Contratar"); KAN-25 (lee el `PlanCheckout`, ya en `develop`) |

---

## 1. Resumen

Un visitante sin sesión paga un plan activo con la pasarela simulada. Si el pago sale bien, una Cloud Function guarda un `PlanCheckout` (el "recibo" del pago antes de tener cuenta). Con ese recibo, el correo de KAN-24 manda el link para crear la cuenta y el negocio (KAN-25).

No se crea `User`, `Business`, `Subscription` ni `Payment`: eso lo hace KAN-25 al registrarse.

## 2. Reparto en dos PRs (guía de ~2000 líneas)

| PR | Rama | Contenido | ACs |
| --- | --- | --- | --- |
| 1 | `KAN-22-checkout-backend` (sale de `develop`) | Esta spec, la función `payPlanCheckout`, sus constantes y modelos, el registro en `index.ts` y `FUNCTION_NAME`, el ajuste de `PlanCheckoutDocument`, los tests de la función y de reglas | Parte de servidor de 02, 04, 06, 07, 08, 09 y 11 |
| 2 | `KAN-22-checkout-page` (sale de `develop` cuando #18 y el PR 1 estén fusionados) | Ruta `/plans/:planId/checkout` (solo visitantes), página, formulario, confirmación, aviso del email, i18n es/en, tests con Page Object y conexión del botón "Contratar" (cierra AC-KAN-21-09) | 01, 03, 05, 10 y la parte visual del resto |

## 3. Función `payPlanCheckout` (PR 1)

Callable pública (sin sesión), en `functions/src/billing/payPlanCheckout.ts`. Sigue el orden de `cloud-functions-standards` §2.

### 3.1 Payload (`models/PayPlanCheckout.mutation.ts`, esquema Zod en `models/PayPlanCheckout.schema.ts`)

| Campo | Regla |
| --- | --- |
| `attemptId` | UUID que genera el cliente por intento de pago (ver §3.4) |
| `planId` | texto no vacío |
| `expectedPriceInCents` | entero ≥ 0: el precio que el visitante vio en pantalla (AC-KAN-22-08) |
| `email` | email válido; se guarda con `trim()` y en minúsculas (AC-KAN-22-11) |
| `cardholderName`, `cardNumber`, `cardExpiry`, `cardCvc` | formato de tarjeta (AS-9); **nunca se guardan ni se registran en logs** |
| `termsAccepted` | debe ser `true` (AC-KAN-23-03, parte de servidor) |
| `language` | `es` o `en` (idioma del correo de KAN-24) |
| `recaptchaToken` | texto no vacío |

Cualquier fallo de formato → `invalid-argument`.

### 3.2 Orden

1. Leer y normalizar el payload (§3.1).
2. `await assertRecaptcha(recaptchaToken)` → `permission-denied` / `unavailable` (AC-KAN-22-06).
3. Comprobar en una transacción:
   - si ya existe `planCheckouts/{attemptId}` → devolver la misma respuesta, sin cobrar de nuevo (AC-KAN-22-09);
   - si el plan no existe o no está `active` → `failed-precondition`, reason `planUnavailable` (AC-KAN-22-07);
   - si `priceInCents` ≠ `expectedPriceInCents` → `failed-precondition`, reason `priceChanged`, con `currentPriceInCents` en `details` (AC-KAN-22-08).
4. Pasarela simulada (§3.3). Si rechaza → `failed-precondition`, reason `paymentDeclined`, y no se guarda nada (AC-KAN-22-04).
5. Si aprueba → crear `planCheckouts/{attemptId}` en la misma transacción (§3.5).
6. Responder `{ email }` (el email normalizado, para la página de confirmación).

### 3.3 Pasarela simulada (AS-9, Q5)

- Función privada `chargeSimulatedCard` en el mismo archivo. No llama a nada externo.
- **Tarjeta de rechazo:** `4000000000000002` (la misma convención que usan las pasarelas de prueba). Cualquier otra tarjeta válida se aprueba. Constante `SIMULATED_GATEWAY.DECLINED_CARD_NUMBER`.
- La validación de tarjeta solo pide 16 dígitos, vencimiento `MM/AA` no vencido y CVC de 3 o 4 dígitos. No se usa algoritmo de Luhn: es una simulación.
- Devuelve una referencia `sim_<id aleatorio>` que se guarda en `paymentReference`. Los datos de la tarjeta no salen de esta función.

### 3.4 Idempotencia: sin cobro doble

- El cliente genera un `attemptId` (UUID) al enviar y lo **reutiliza** si reintenta por error de red o doble clic. Solo genera uno nuevo después de un rechazo o si cambia los datos.
- El `PlanCheckout` se guarda con `attemptId` como id del documento. Si un reintento llega después de un pago aprobado, la transacción ve que el documento ya existe y responde lo mismo sin cobrar (un `PlanCheckout` por intento, AC-KAN-22-09).
- Si llegan dos llamadas a la vez con el mismo `attemptId`, la transacción deja pasar solo una (test de concurrencia).

### 3.5 Documento `planCheckouts/{attemptId}`

| Campo | Valor |
| --- | --- |
| `planId`, `email`, `language` | del payload normalizado |
| `amountInCents` | `priceInCents` del plan leído en la transacción |
| `paidAt` | `Timestamp.now()` |
| `paymentReference` | referencia de §3.3 |
| `termsAcceptedAt` | igual a `paidAt` |
| `termsVersion` | constante provisional (ver §6, D4) |
| `signUpCompletedAt` | `null` |
| `signUpTokenHash`, `signUpLinkExpiresAt` | `null`: los llena KAN-24 al mandar el correo (SPEC "Data") |

Por eso `PlanCheckoutDocument` pasa a tener `signUpTokenHash` y `signUpLinkExpiresAt` como `NullableRef`, y `findSignUpCheckout` trata un `signUpLinkExpiresAt` nulo como link inválido. Ya hoy no lo encontraría, porque busca por hash; es solo para el tipo.

### 3.6 Errores (`constants/PlanCheckout.constants.ts`)

`PLAN_CHECKOUT_ERROR` (mensajes para desarrolladores) y `PLAN_CHECKOUT_ERROR_REASON` (`paymentDeclined`, `planUnavailable`, `priceChanged`), que el cliente replica en el PR 2. Ningún error revela si el email ya tiene cuenta (AS-5 de sign-up, AS-12).

### 3.7 Registro (`cloud-functions-standards` §8)

- `functions/src/index.ts`: `export { payPlanCheckout } …` (orden A → Z).
- `FUNCTION_NAME.PAY_PLAN_CHECKOUT` en `src/constants/firebase/FunctionName.constants.ts`.
- Espejo `PLAN_STATUS` en `functions/src/shared/constants/PlanStatus.constants.ts`, con la línea `// Mirror of …`.
- `firestore.rules`: `planCheckouts` ya está denegado a todos los clientes (regla por defecto). Se agrega un test de reglas: un visitante no puede crear un `PlanCheckout`.

## 4. Pantalla (PR 2, resumen)

- Ruta `/plans/:planId/checkout` dentro de `GuestOnly`. Con sesión no se entra (AS-8, igual que AC-KAN-21-11).
- Formulario con React Hook Form + Zod: email, datos de tarjeta, aceptación de términos y reCAPTCHA. El botón "Pagar" se desactiva sin reCAPTCHA, sin términos o mientras se procesa (AC-KAN-22-06, AC-KAN-22-10).
- **Aviso fijo bajo el email** (`landing:planCheckout.payment.emailHint`, AS-13): pide usar un correo que no esté registrado, porque será el de la cuenta del negocio. Es igual para todos y no revela nada.
- Errores: `declinedError` (conserva todo menos la tarjeta), `planUnavailableError` (link al catálogo), `priceChangedError` (muestra el precio nuevo y pide confirmar), `common:errors.network`.
- Confirmación: `payment.success` con el email y `payment.reviewNotice` (AC-KAN-22-02, AC-KAN-22-03).

## 5. Tests

| Archivo | Cubre |
| --- | --- |
| `functions/src/billing/tests/payPlanCheckout.test.ts` | Pago aprobado y documento guardado, email normalizado, rechazo sin documento, plan inactivo o inexistente, precio cambiado, reCAPTCHA rechazado, payload inválido, términos no aceptados, reintento con el mismo `attemptId` sin cobro doble, dos llamadas a la vez, tarjeta no guardada |
| `tests/rules/planCheckouts.rules.test.ts` | KAN-22: un visitante no puede crear un `PlanCheckout` |
| `src/modules/landing/features/plan-checkout/tests/PlanCheckoutPage.test.tsx` (PR 2) | ACs de pantalla con Page Object |

Cada test empieza con su clave (`AC-KAN-22-xx`).

## 6. Decisiones para revisar

| Id | Decisión | Por qué |
| --- | --- | --- |
| D1 | `payPlanCheckout` **no** crea el token del link; deja `signUpTokenHash` y `signUpLinkExpiresAt` en `null` para KAN-24 | El SPEC dice que el token lo crea la función que manda el correo. Un token sin correo no le sirve a nadie, y el link no debe volver al navegador (probaría un email que la persona quizá no controla) |
| D2 | Tarjeta de rechazo `4000000000000002`; las demás válidas se aprueban | AS-9 dejaba la tarjeta para cuando se hiciera la función |
| D3 | `attemptId` del cliente como id del `PlanCheckout` | La forma más simple de "un `PlanCheckout` por intento" sin una colección de bloqueos aparte |
| D4 | `termsVersion` sale de una constante provisional hasta que exista la página de términos (KAN-9, PR #24) | AS-10 usa la fecha de la página de KAN-9, que aún no está en `develop` |

## 7. Dependencias que quedan abiertas

- **KAN-24 (correo con el link):** bloqueada por las notificaciones (KAN-163). Hasta entonces, un pago real no llega al registro. La demo con emuladores usa el checkout sembrado (`scripts/seedSignUpCheckout.ts`). AC-KAN-22-02 queda a medias ("se manda el correo de KAN-24").
- **KAN-23 (términos):** la casilla y el `termsAccepted` sí van en KAN-22. El link al texto de términos depende de KAN-9 (PR #24).
