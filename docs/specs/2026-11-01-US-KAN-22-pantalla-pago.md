# Spec técnica — KAN-22: la pantalla de pago llama al pago real

| Campo | Valor |
| --- | --- |
| Historia / Épica | KAN-22 / KAN-20 (contratación de planes) |
| Portal | landing (`src/modules/landing/features/plan-checkout/`) |
| Fecha | 2026-11-01 |
| Estado | Borrador para revisión |
| SPEC de la feature | `src/modules/landing/features/plan-checkout/specs/SPEC.md` (AC-KAN-22-01 … 11, AS-9, AS-13) |
| Specs base | `docs/specs/2026-10-17-US-KAN-22-pago-del-plan.md` (§4, pantalla) y `docs/specs/2026-10-31-US-KAN-22-pago-real-api.md` (la acción `payPlanCheckout` de `api/`) |
| Depende de | PR #65 (pago real en `api/`), que a su vez depende de #64 |

---

## 1. Resumen

La pantalla `/plans/:planId/checkout` ya existe (Sprint_1): formulario, resumen del plan y confirmación, con el patrón vista + `usePlanCheckoutViewModel`. Pero **el pago es de mentira**: `handleSubmit` espera 600 ms con un `setTimeout` y decide en el navegador si la tarjeta se aprueba. Nunca llama al servidor, así que no se guarda ningún `PlanCheckout`, no hay reCAPTCHA ni protección contra el cobro doble, y el botón de la confirmación lleva a `/sign-up?token=<email>`, un atajo que permite registrarse sin pagar.

Este PR **conecta la pantalla con `payPlanCheckout`** (el backend de #65) y muestra en pantalla cada respuesta del servidor. Se queda el diseño de la pantalla; cambia la lógica del ViewModel y lo mínimo de las vistas.

## 2. Fuera de alcance

| Tema | Dónde |
| --- | --- |
| Pagar desactivado mientras no se aceptan los términos, abrir los términos antes de aceptar (AS-11), `TERMS_VERSION` real | PR 2 (KAN-23) |
| Correo con el enlace de registro, reenvío, token del enlace | PR 5 (KAN-24) |
| Cambiar el diseño visual de la pantalla | No se toca |

## 3. Cambios por archivo

Todo dentro de `src/modules/landing/features/plan-checkout/`.

### 3.1 Datos (`api/`)

| Archivo | Cambio |
| --- | --- |
| `api/usePayPlanCheckoutMutation.ts` (nuevo) | `useMutation` que llama a `callFunction(FUNCTION_NAME.PAY_PLAN_CHECKOUT, payload)`. Mismo modelo que `useCompleteSubscriberSignUpMutation`. No invalida nada: un visitante no tiene nada en caché que dependa del pago |
| `api/mapPlanCheckoutFunctionError.ts` (nuevo) | Convierte el error una sola vez (`api-mutation-standards` §3): `mapFirebaseError` + `reason` y `currentPriceInCents` de `details`. Sin conexión o `unavailable` (503: Google no respondió o falta la clave) → `ERROR_MESSAGE_KEY.NETWORK` |

### 3.2 Modelos y constantes

| Archivo | Cambio |
| --- | --- |
| `models/PayPlanCheckout.mutation.ts` (nuevo) | `PayPlanCheckoutPayload` y `PayPlanCheckoutResponse` (`{ email }`), con los campos del esquema de `api/` (spec base §3) |
| `models/PlanCheckoutFunctionError.interface.ts` (nuevo) | `MutationError` + `reason: Nullable<PlanCheckoutErrorReason>` + `currentPriceInCents: Nullable<number>` |
| `models/PlanCheckout.model.ts` | El esquema del formulario sigue **las mismas reglas que el servidor**, para que nada que pase en pantalla vuelva con un `400`: `MM/AA` con barra y no vencido, CVC de 3 o 4 dígitos, nombre de 2 a 60, email de hasta 254. Los mensajes dejan de estar escritos en el código (`"MM/AA"`, `"16 dígitos"`) y pasan a claves: `validation:required`, `validation:emailInvalid`, `landing:planCheckout.payment.cardInvalid` (AC-KAN-22-05). Se quita `recaptchaToken` del esquema: el token vive en el ViewModel, como en el registro |
| `constants/PlanCheckout.constants.ts` | Se quita `CHECKOUT_SIMULATION` (la pasarela la decide el servidor). Se agregan `PLAN_CHECKOUT_ERROR_REASON` (espejo de `api/`: `attemptReused`, `paymentDeclined`, `planUnavailable`, `priceChanged`) y los límites y patrones que faltan en `CHECKOUT_FIELD_LIMIT`. Orden A → Z |
| `utils/buildPayPlanCheckoutPayload.ts` (nuevo) | Función pura: valores del formulario + `attemptId`, `planId`, precio esperado, idioma activo (solo `es`/`en`; otro → el de por defecto) y token del reCAPTCHA → payload |

### 3.3 ViewModel (`hooks/usePlanCheckoutViewModel.ts`)

1. **`attemptId`**: un `crypto.randomUUID()` por visita a la pantalla (`useState` con inicializador). Se mantiene en todos los reintentos: si la red falla después de que el servidor cobró, el reintento recibe la misma respuesta y no cobra de nuevo (AC-KAN-22-09).
2. **`handleSubmit`**: sin token de reCAPTCHA no hace nada. Con token, llama a la mutación con `buildPayPlanCheckoutPayload`. Se quita el `setTimeout`.
3. **Ocupado**: `PROCESSING` sale de `mutation.isPending`. El botón se desactiva y muestra `paying` mientras dura, así que un doble clic no envía dos pagos (AC-KAN-22-10).
4. **Éxito**: guarda el `email` **que devuelve el servidor** (ya en minúsculas y sin espacios, AC-KAN-22-11) y pasa a `SUCCESS`.
5. **Errores**: el token de reCAPTCHA ya se usó, así que **todo error reinicia el reCAPTCHA** (`resetSignal`, como en el registro). Después, según la respuesta:

| Respuesta | En pantalla | Formulario | AC |
| --- | --- | --- | --- |
| `412 paymentDeclined` | `planCheckout.checkout.declinedError` | Se vacían titular, número, vencimiento y CVC; se conservan el email y los términos | 04 |
| `403 permission-denied` | `validation:recaptchaRequired` | Se conserva todo | 06 |
| `412 planUnavailable` | `planCheckout.payment.planUnavailableError` con el enlace al catálogo (se reutiliza `ContractErrorAlert`) | Se conserva todo | 07 |
| `412 priceChanged` | `planCheckout.payment.priceChangedError` con el precio nuevo; el resumen pasa a mostrar ese precio y el siguiente "Pagar" lo envía como `expectedPriceInCents` (pagar otra vez es la confirmación) | Se conserva todo | 08 |
| `412 attemptReused` | `planCheckout.payment.attemptReusedError`: ese pago ya se hizo con otros datos; recargar para uno nuevo | Se conserva todo | 09 |
| Red, `503` | `common:errors.network` | Se conserva todo; el reintento usa el mismo `attemptId` | 09 |
| Cualquier otro | `common:errors.unknown` | Se conserva todo | — |

6. **Se quita `handleProceedToSignUp`** y el atajo a `/sign-up?token=<email>`.

### 3.4 Vistas

| Archivo | Cambio |
| --- | --- |
| `components/PlanCheckoutForm.tsx` | `RecaptchaField` de `@/components/common` antes del botón, con `planCheckout.checkout.recaptchaLabel` (la clave ya existe). "Pagar" desactivado sin reCAPTCHA o mientras se procesa (AC-KAN-22-06, 10). El error de `planUnavailable` se muestra con `ContractErrorAlert` |
| `components/PlanCheckoutSuccess.tsx` | Se quita el botón `successAction`. En su lugar, el texto de `payment.success` con el email al que llegará el enlace y `payment.reviewNotice`: el negocio se revisa antes de activarse (AC-KAN-22-02, 03, Q2) |
| `components/PlanCheckoutPage.tsx` | Pasa las props nuevas; sin lógica |

### 3.5 Textos (`src/i18n/locales/{es,en}/landing.json`)

Se reutilizan las claves existentes de `planCheckout.checkout.*`. Las nuevas van en `planCheckout.payment.*`, con los nombres que da el SPEC:

| Clave | Cambio |
| --- | --- |
| `payment.cardInvalid`, `payment.priceChangedError` (con `{{price}}`), `payment.attemptReusedError`, `payment.success` (con `{{email}}`), `payment.reviewNotice` | Nuevas |
| `checkout.emailHint` | Texto de AS-13: usar un correo que todavía no tenga cuenta, porque será el de la cuenta del negocio |
| `checkout.cardNumberHint` | Corrige la tarjeta de rechazo: hoy dice "terminada en 2", pero el servidor solo rechaza `4000 0000 0000 0002` |
| `checkout.successDescription` | Ya no dice "completa los datos de tu negocio ahora" |
| `checkout.successAction` | Se borra (ya no hay botón) |

## 4. Tests

| Archivo | Cubre |
| --- | --- |
| `tests/PlanCheckoutPage.page.ts` (nuevo) | Page Object: campos, reCAPTCHA, botón Pagar, mensajes, confirmación |
| `tests/PlanCheckoutPage.test.tsx` (nuevo) | Con `renderWithProviders`, `callFunction` simulado y el doble de reCAPTCHA que ya usa el registro. Cada test empieza con su clave: |
| | AC-KAN-22-01 la pantalla muestra plan, precio con periodo, email con su pista, campos de tarjeta, términos y reCAPTCHA |
| | AC-KAN-22-02 pago aprobado → confirmación con el email que devolvió el servidor; el payload lleva `attemptId`, `planId`, precio, idioma y token |
| | AC-KAN-22-03 la confirmación muestra `reviewNotice` y **no** hay botón ni enlace a `/sign-up` |
| | AC-KAN-22-04 rechazo → `declinedError`, campos de tarjeta vacíos, email conservado |
| | AC-KAN-22-05 campos vacíos o inválidos → mensaje traducido en el campo y ninguna llamada al servidor |
| | AC-KAN-22-06 sin reCAPTCHA, Pagar desactivado; token rechazado → `recaptchaRequired` y reCAPTCHA reiniciado |
| | AC-KAN-22-07 plan no disponible → mensaje con enlace al catálogo |
| | AC-KAN-22-08 precio cambiado → precio nuevo en pantalla y el siguiente pago lo envía |
| | AC-KAN-22-09 error de red → `errors.network`; el reintento envía el **mismo** `attemptId` |
| | AC-KAN-22-10 mientras se procesa, el botón está desactivado y un segundo clic no llama de nuevo |
| `tests/buildPayPlanCheckoutPayload.test.ts` (nuevo) | Idioma no soportado → el de por defecto; payload completo |
| `tests/planCheckoutSchema.test.ts` (nuevo) | Mismas reglas que el servidor: fecha sin barra o vencida, CVC con letras, nombre de 61 caracteres → inválidos |

AC-KAN-22-11 (email en minúsculas al guardarse) ya está probado en el servidor (#65). Aquí se prueba que la confirmación muestra el email que devolvió el servidor.

## 5. Prueba manual (base real)

Con `RECAPTCHA_SECRET_KEY=6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe npm run dev` (clave pública de prueba de Google, la misma de #65) y sin sesión:

1. Pagar un plan activo → confirmación sin botón de registro; aparece `planCheckouts/<attemptId>` en la consola, sin datos de tarjeta.
2. Tarjeta `4000 0000 0000 0002` → rechazo, campos de tarjeta vacíos, nada nuevo en la consola.
3. Cortar la red con las herramientas del navegador, pagar, volver a conectar y reintentar → un solo documento.

## 6. Decisiones para revisar

| Id | Decisión | Por qué |
| --- | --- | --- |
| D1 | Un `attemptId` por visita a la pantalla, que no se renueva con los errores | Solo un pago aprobado guarda documento, y después de aprobarse la pantalla cambia a la confirmación. Así cualquier reintento es seguro |
| D2 | Pagar otra vez después de `priceChanged` cuenta como la confirmación del precio nuevo | Es la forma más simple de "debe confirmar de nuevo" (AC-KAN-22-08). El precio nuevo ya está en pantalla junto al botón |
| D3 | Se quita el botón de la confirmación (decidido 2026-10-31, opción A) | Era un atajo que permitía registrarse sin pagar |
| D4 | **Mientras no exista KAN-24 (PR 5), en producción no hay forma de llegar al registro después de pagar**: la confirmación pide revisar el correo, pero el correo todavía no se envía | Es la consecuencia de D3. Para una demo antes del PR 5 se puede usar el checkout sembrado en el emulador |
| D5 | **Antes de fusionar este PR, la variable `RECAPTCHA_SECRET_KEY` tiene que estar en Vercel** (spec de #65, D4) | Sin ella, todo pago en producción responde `503` y la pantalla muestra `errors.network` |
| D6 | `mapPlanCheckoutFunctionError` es propio de esta feature y no reutiliza `mapSignUpFunctionError` | Una feature no importa de otra (`component-architecture`); las razones son distintas |
| D7 | Las claves nuevas van en `planCheckout.payment.*` (nombres del SPEC) y las existentes en `planCheckout.checkout.*` se reutilizan sin renombrar | No hacer refactors fuera de la historia |
