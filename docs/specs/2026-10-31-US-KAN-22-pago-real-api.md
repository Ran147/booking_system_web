# Spec técnica — KAN-22: el pago del plan con la lógica real en el backend de Vercel

| Campo | Valor |
| --- | --- |
| Historia / Épica | KAN-22 / KAN-20 (contratación de planes) |
| Portal | backend de Vercel (`api/callFunction.ts`) + `functions/src/billing` |
| Fecha | 2026-10-31 (rehecha 2026-11-24 tras la revisión del PR #65) |
| Estado | Borrador para revisión |
| SPEC de la feature | `src/modules/landing/features/plan-checkout/specs/SPEC.md` (AC-KAN-22-02, 04, 06 … 11, AS-9) |
| Spec base | `docs/specs/2026-10-17-US-KAN-22-pago-del-plan.md` (la callable `payPlanCheckout`, §3) |
| Decisión | Q8 (`docs/decisions/2026-10-24-Q8-server-functions-on-vercel.md`): `functions/src` es la única fuente de la lógica y Vercel la reutiliza |

---

## 1. Resumen

En producción el pago lo atiende `payPlanCheckout` de `api/callFunction.ts`, que hoy es un **stub**: guarda un `PlanCheckout` con el precio que manda el cliente, sin revisar el plan, sin reCAPTCHA y sin evitar el cobro doble. La lógica correcta existe, con pruebas, en `functions/src/billing/payPlanCheckout.ts`, pero en el plan Spark no corre.

Este PR **saca esa lógica a un handler compartido** y Vercel lo ejecuta con `runSharedHandler`, igual que ya hace con `createBooking` y `getAvailability`. No se copia la lógica: la callable y Vercel corren el mismo código. Las reglas del pago no cambian; son las de la spec base.

La primera versión del PR copiaba la lógica dentro de `api/callFunction.ts`. La revisión pidió reutilizarla (Q8), y esta versión lo hace.

## 2. Fuera de alcance

| Tema | Dónde |
| --- | --- |
| Conectar `PlanCheckoutPage` con `payPlanCheckout` y mostrar sus errores | PR #66 (KAN-22, pantalla) |
| `TERMS_VERSION` real | PR #67 (KAN-23). Al cambiarla en `functions/` llega sola a Vercel |
| Token del enlace y correo | KAN-24 (bloqueado por Q9) |
| reCAPTCHA real en las demás acciones públicas de Vercel (`verifyRecaptcha`, registro, contacto) | Otros PRs; aquí solo el pago. El verificador compartido queda listo para reutilizarse |

## 3. Diseño

### 3.1 Handler compartido

`functions/src/billing/handlers/handlePayPlanCheckout.ts`, sin `firebase-functions`, como `handleCreateBooking`:

```ts
handlePayPlanCheckout({ payload, firestore, now, assertRecaptcha }): Promise<PayPlanCheckoutResponse>
```

- Recibe `CallableHandlerInput` (`payload`, `firestore`, `now`; `caller` no se usa porque el pago es público) más `assertRecaptcha`, la verificación del token que aporta quien lo llama.
- Orden, igual que la spec base §3.2:
  1. Payload con `payPlanCheckoutPayloadSchema` mediante `parseCallablePayload` → `invalid-argument`.
  2. `assertRecaptcha(recaptchaToken)`, antes de leer o cobrar nada (AC-KAN-22-06).
  3. Transacción sobre `planCheckouts/{attemptId}`: reintento con el mismo plan y email → responde lo mismo sin cobrar (AC-KAN-22-09); con otro plan o email → `attemptReused`; plan inactivo, inexistente o mal formado → `planUnavailable` (AC-KAN-22-07); precio distinto → `priceChanged` con `currentPriceInCents` (AC-KAN-22-08); tarjeta de rechazo → `paymentDeclined` y nada guardado (AC-KAN-22-04); aprobado → `transaction.create` del `PlanCheckout`, sin datos de tarjeta (AS-9).
- Los errores son `CallableFailure` (código y `details.reason` iguales a los de hoy). `paidAt` y `termsAcceptedAt` salen de `now`.

### 3.2 La callable (emulador)

`functions/src/billing/payPlanCheckout.ts` queda como envoltorio de `createBooking.ts`: arma la entrada, pasa su `assertRecaptcha` (secreto de Functions) y convierte las fallas con `toHttpsError`. Para el cliente no cambia nada.

### 3.3 Vercel

En `api/callFunction.ts` el bloque `PAY_PLAN_CHECKOUT` del stub se reemplaza por:

```ts
await runSharedHandler(response, () =>
  handlePayPlanCheckout({ assertRecaptcha: assertRecaptchaInVercel, caller: null, firestore, now: new Date(), payload }),
);
```

`assertRecaptchaInVercel` lee `RECAPTCHA_SECRET_KEY` de las variables de entorno y llama al verificador compartido (§3.4). **Si la clave falta, falla con `unavailable` (503) y no se cobra nada**: el pago queda cerrado, nunca abierto (D3). Se borra la constante `CHECKOUT_SIMULATION` del stub.

`runSharedHandler` suma el código `unavailable` → `503` (`HTTP_STATUS.SERVICE_UNAVAILABLE`). El cliente (`src/services/firebase/callFunction.ts`) ya convierte esa respuesta en `FunctionsError("unavailable")` y no cae en la simulación del navegador.

### 3.4 Verificador de reCAPTCHA compartido

`functions/src/auth/verifyRecaptchaToken.ts`, sin `firebase-functions`: `verifyRecaptchaToken(recaptchaToken, secretKey)` pregunta a Google y falla con `CallableFailure`: `permission-denied` si Google rechaza el token, `unavailable` si no responde. `assertRecaptcha` (callables) pasa a usarlo con su secreto y `toHttpsError`, así la verificación tiene una sola fuente. `CallableFailureCode` suma `unavailable`.

## 4. Tests

| Archivo | Qué prueba |
| --- | --- |
| `functions/src/billing/tests/payPlanCheckout.test.ts` (existente, emulador) | Todas las reglas del pago (AC-KAN-22-02 … 11, AS-9), ahora a través del handler compartido. Sin cambios en los casos |
| `functions/src/auth/tests/assertRecaptcha.test.ts` (existente) | Aprobado, rechazado (`permission-denied`) y Google caído (`unavailable`), ahora a través del verificador compartido |
| `tests/api/payPlanCheckout.test.ts` (nuevo) | El despachador de Vercel con el handler simulado, como `sharedBookingHandlers.test.ts`: es público (sin sesión), pasa el payload, responde un `CallableFailure` con su código y `details`; y su `assertRecaptcha`: sin `RECAPTCHA_SECRET_KEY` → `503` sin preguntar a Google, con la clave la manda a Google, token rechazado → `403` |

## 5. Prueba manual (base real)

Con `npm run dev` contra `practica1webcourse`:

1. Sin `RECAPTCHA_SECRET_KEY`: `payPlanCheckout` responde `503 unavailable` y no aparece ningún `planCheckouts/<attemptId>`.
2. Con la clave secreta **pública de prueba** de Google (`RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe npm run dev`, pareja de la clave de sitio de prueba de `.env.local`): plan activo y su precio → se crea `planCheckouts/<attemptId>` sin datos de tarjeta; repetir → misma respuesta y un solo documento; tarjeta `4000000000000002` → `paymentDeclined`; precio distinto → `priceChanged`.

## 6. Decisiones

| Id | Decisión | Por qué |
| --- | --- | --- |
| D1 | Handler compartido en `functions/src/billing/handlers/` y Vercel lo corre con `runSharedHandler` | Q8: una sola fuente. Es el mismo patrón que `createBooking` |
| D2 | El handler recibe `assertRecaptcha` en vez de leer el secreto | Cada entorno guarda la clave a su manera (Secret Manager en Functions, variable de entorno en Vercel); la regla "verificar antes de cobrar" queda en el handler |
| D3 | Sin `RECAPTCHA_SECRET_KEY`, el pago en Vercel responde `503` y no cobra | Un pago no puede quedar abierto a scripts. Hoy no afecta a nadie: la pantalla todavía no llama a esta acción |
| D4 | **Antes de fusionar el #66 (pantalla), `RECAPTCHA_SECRET_KEY` tiene que estar en Vercel** (Production y Preview) con la clave secreta real | Sin ella, el pago en producción responde `503` |
| D5 | El verificador de reCAPTCHA también pasa a ser compartido | La verificación de Vercel no copia la de Functions, y las demás acciones públicas podrán usarlo después |
