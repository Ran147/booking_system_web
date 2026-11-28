# Spec técnica — KAN-25: el registro del suscriptor real en Vercel y con Google

| Campo | Valor |
| --- | --- |
| Historia / Épica | KAN-25, KAN-27 / KAN-26 (registro del suscriptor); PROP-5 (registro con Google, propuesta) |
| Portal | backend de Vercel (`api/callFunction.ts`) + `functions/src/billing` + `landing/features/subscriber-sign-up` |
| Fecha | 2026-11-27 |
| Estado | Borrador para revisión |
| SPEC de la feature | `src/modules/landing/features/subscriber-sign-up/specs/SPEC.md` (AC-KAN-25-*, AC-KAN-27-*, AC-PROP-5-*) |
| Specs base | `docs/specs/2026-10-31-US-KAN-25-registro-sin-sobrescribir.md` (#63); `docs/specs/2026-10-31-US-KAN-22-pago-real-api.md` (#65, mismo patrón) |
| Decisión | Q8 (`docs/decisions/2026-10-24-Q8-server-functions-on-vercel.md`): `functions/src` es la única fuente de la lógica y Vercel la reutiliza |

---

## 1. Resumen

En producción el registro del suscriptor lo atienden tres ramas de `api/callFunction.ts` que todavía son **stubs**: `validateSignUpLink`, `checkBusinessSlug` y `completeSubscriberSignUp`. No comprueban el enlace del pago, no verifican el reCAPTCHA y crean un negocio que no sigue la SPEC. `checkBusinessSlug`, además, responde con otro contrato (`{ isAvailable }`) que el formulario (`{ availability }`).

La lógica correcta ya existe, con pruebas, en `functions/src/billing/`, pero en el plan Spark no corre. Esta spec hace lo mismo que #65 hizo con el pago y suma lo que pidió la corrección del registro: **crear la cuenta también con Google**.

| PR | Qué hace | Historias |
| --- | --- | --- |
| **4a** | Saca las tres funciones a handlers compartidos y Vercel los corre. Se borran los stubs | KAN-25, KAN-27 (sin criterios nuevos: hace verdaderos en producción los que ya existen) |
| **4b** | El servidor acepta una cuenta de Google en lugar de la contraseña | PROP-5 |
| **4c** | Botón "Continuar con Google" en el formulario | PROP-5 |

Cada PR sale de `develop` y se fusiona en este orden. Ninguno se apila sobre otro.

## 2. Fuera de alcance

| Tema | Dónde |
| --- | --- |
| Crear el enlace de registro y mandarlo por correo | KAN-24, bloqueado hasta que se decida Q11 (#110). Hasta entonces nadie recibe un enlace en producción (§6) |
| Verificar el correo del suscriptor que se registra con contraseña | Otro PR de KAN-25. Puede reutilizar `sendVerificationEmail` de #107 |
| Rellenar nombre y apellido con los datos de Google | No lo pide la corrección; se puede proponer después |
| Registro del cliente con Google (KAN-122) | No está en el backlog de KAN-122 |
| Aprobar el negocio y crear su `Subscription` | PROP-1, KAN-176 (spec de admin businesses) |

## 3. PR 4a — el registro real en Vercel

### 3.1 Handlers compartidos

En `functions/src/billing/handlers/`, sin `firebase-functions`, como `handlePayPlanCheckout`:

| Handler | Entrada | Sale de |
| --- | --- | --- |
| `handleValidateSignUpLink` | `CallableHandlerInput` | `validateSignUpLink.ts` |
| `handleCheckBusinessSlug` | `CallableHandlerInput` | `checkBusinessSlug.ts` |
| `handleCompleteSubscriberSignUp` | `CallableHandlerInput` + `auth`, `assertRecaptcha`, `reportError` | `completeSubscriberSignUp.ts` |

- Las reglas no cambian: el orden, la transacción, el reintento de claims y el deshacer son los de la SPEC ("Order and rollback") y los de #63.
- Los errores pasan de `HttpsError` a `CallableFailure`, con el mismo código y el mismo `details.reason`.
- `findSignUpCheckout` recibe `firestore` y `now` en lugar de leer la instancia del módulo y `Timestamp.now()`, y falla con `CallableFailure`.
- Las fechas que escribe el handler son `Date` (`now`), nunca un `Timestamp` ni un `FieldValue.serverTimestamp()` de `functions/node_modules`: Vercel carga otra copia de `firebase-admin` y Firestore los rechaza (lo que se corrigió en #107). `createdAt` y `signUpCompletedAt` pasan de la hora del servidor de Firestore a `now`.
- `reportError(message, context)` reemplaza a `logger` de `firebase-functions`: la callable pasa `logger.warn` y Vercel escribe una línea JSON en `stderr`, que guardan los logs de Vercel (el lint prohíbe `console` fuera de `scripts/`). Es lo único que el handler registra (claims que fallan, cuenta que no se pudo borrar, deshacer que falla).

### 3.2 Las callables (emulador)

`validateSignUpLink.ts`, `checkBusinessSlug.ts` y `completeSubscriberSignUp.ts` quedan como envoltorios: arman la entrada, pasan `assertRecaptcha` (secreto de Functions) y convierten las fallas con `toHttpsError`. Para el cliente no cambia nada.

### 3.3 Vercel

Las tres ramas del stub se reemplazan por `runSharedHandler`:

```ts
await runSharedHandler(response, () =>
  handleCompleteSubscriberSignUp({
    assertRecaptcha: assertRecaptchaInVercel,
    auth,
    caller: null,
    firestore,
    now: new Date(),
    payload,
    reportError: reportErrorInVercel,
  }),
);
```

- Siguen siendo públicas (`PUBLIC_FUNCTION_NAMES`): el token del enlace es la credencial.
- Sin `RECAPTCHA_SECRET_KEY` el registro responde `503` y no crea nada (igual que el pago, D3 de #65). La clave ya está en Vercel.
- Se borra todo el stub: el negocio `active`, `plan-pro`, el servicio por defecto, el horario, la `subscription` y `emailVerified: true`. El negocio nace `pending` como dice la SPEC (Q2).
- El registro falla con `already-exists` (cuenta o `slug` ya usados), que hoy no existe en los handlers compartidos: `CallableFailureCode` suma `already-exists` y `CALLABLE_FAILURE_HTTP_STATUS` suma `already-exists → 409` (`HTTP_STATUS.CONFLICT`). El cliente ya lo convierte en `FunctionsError("already-exists")`, como responde hoy el stub.

### 3.4 Tests

| Archivo | Qué prueba |
| --- | --- |
| `functions/src/billing/tests/{validateSignUpLink,checkBusinessSlug,completeSubscriberSignUp}.test.ts` (existentes, emulador) | Todas las reglas de KAN-25, ahora a través de los handlers. Sin cambios en los casos |
| `functions/src/billing/tests/completeSubscriberSignUp.test.ts` | Un caso nuevo: el handler escribe con un Firestore de la copia de `firebase-admin` de la raíz, como el despachador (mismo caso que #107) |
| `tests/api/completeSubscriberSignUp.test.ts` (existente, reescrito) | Hoy prueba el stub. Pasa a probar el despachador con el handler simulado, como `tests/api/payPlanCheckout.test.ts`: es público, pasa el payload, responde el `CallableFailure` con su código y `details`, y sin `RECAPTCHA_SECRET_KEY` responde `503` sin llamar al handler |
| `tests/api/signUpLink.test.ts` (nuevo) | `validateSignUpLink` y `checkBusinessSlug` en el despachador con el handler simulado |
| `tests/api/callerAccess.test.ts` (existente) | "KAN-59: a public action still works without a session" usa hoy el contrato del stub de `checkBusinessSlug`. Pasa a usar el handler simulado |

## 4. PR 4b — el servidor acepta Google (PROP-5)

### 4.1 Contrato

`CompleteSubscriberSignUpPayload` lleva **una** de las dos formas de acceso:

| Campo | Cuándo |
| --- | --- |
| `password` | Registro con contraseña (como hoy) |
| `googleIdToken` | Registro con Google: el ID token de Firebase de la cuenta que se conectó con Google |

`completeSubscriberSignUpPayloadSchema` exige exactamente una de las dos. Con las dos o con ninguna → `invalid-argument`.

### 4.2 Reglas del handler

Con `googleIdToken`, en lugar de `createAccount` (después del reCAPTCHA y de comprobar el enlace, como hoy):

1. `auth.verifyIdToken(googleIdToken)`. Token inválido o vencido → `unauthenticated`, reason `googleSessionExpired` (AC-PROP-5-07).
2. El proveedor tiene que ser Google (`firebase.sign_in_provider === "google.com"`) y el correo tiene que estar verificado (`email_verified`). Si no → `failed-precondition`, reason `googleAccountInvalid`.
3. El correo de Google, en minúsculas, tiene que ser el del pago (`planCheckout.email`). Si no → `failed-precondition`, reason `googleEmailMismatch` (AC-PROP-5-02).
4. Si esa cuenta ya tiene rol (claim `role`) o ya tiene `users/{uid}` → `already-exists`, reason `accountExists`. Es la misma respuesta neutra que con contraseña (AS-5, AC-PROP-5-04).
5. Desde aquí sigue igual que con contraseña, usando el `uid` de Google: la transacción, los claims y la respuesta `{ email }`.

**Deshacer (AC-PROP-5-06):** si la transacción o los claims fallan, se borran los documentos y la marca del enlace como hoy, pero **la cuenta de Google no se borra**. No la creó el servidor, y sin rol no da acceso a nada. El visitante puede volver a intentar con el mismo enlace.

No se manda correo de verificación: Google ya verificó el correo.

### 4.3 Tests

| Archivo | Qué prueba |
| --- | --- |
| `functions/src/billing/tests/completeSubscriberSignUpWithGoogle.test.ts` (nuevo, emulador) | El emulador de Auth acepta credenciales de Google falsas (un `id_token` sin firmar con `sub`, `email` y `email_verified`), así que la prueba obtiene un ID token real del emulador con proveedor `google.com` sin llamar a Google. Casos: AC-PROP-5-01 (cuenta, negocio `pending`, claims, enlace usado, sin contraseña), 02 (otro correo), 04 (cuenta con rol o con `users/{uid}`), 06 (claims que fallan: se deshace todo y la cuenta de Google sigue), 07 (token inválido), y que un token de correo y contraseña sea `googleAccountInvalid` |
| `functions/src/billing/tests/subscriberSignUpSchema.test.ts` (nuevo) | Exactamente una forma de acceso |

## 5. PR 4c — el botón en el formulario (PROP-5)

### 5.1 Pantalla

En `AccountSection`, encima de la contraseña:

- **"Continuar con Google"**: `Button` con el `GoogleIcon` que ya usa el inicio de sesión (se exporta desde `@/modules/auth`).
- Al conectarse con el correo del pago se ocultan la contraseña, su confirmación y el medidor. Aparece "Cuenta de Google: `<correo>`" con la acción **"Usar contraseña"**, que cierra la sesión de Google y vuelve a mostrar los campos (AC-PROP-5-05).
- El resto del formulario no cambia: nombre, apellido, teléfono, negocio, `slug` y reCAPTCHA siguen siendo obligatorios.

### 5.2 Flujo

| Paso | Qué hace |
| --- | --- |
| Conectar | `connectGoogleAccount(checkoutEmail)` en `api/`: `signInWithPopup` con `prompt: "select_account"` y `login_hint` = correo del pago |
| Otro correo | Cierra la sesión de Google y muestra `landing:subscriberSignUp.google.emailMismatch` con el correo del pago (AC-PROP-5-02). El servidor lo vuelve a comprobar (§4.2) |
| Ventana cerrada por el visitante (`auth/popup-closed-by-user`) | Nada cambia y no hay mensaje (AC-PROP-5-03) |
| Ventana bloqueada o sin red | `landing:subscriberSignUp.google.popupBlocked` o `common:errors.network` (AC-PROP-5-03) |
| Enviar | Pide un ID token **nuevo** (`getIdToken()`) y lo manda como `googleIdToken` en lugar de `password` |
| Éxito | Igual que con contraseña (AS-6, KAN-27): cierra la sesión y lleva a sign-in con `landing:subscriberSignUp.success`. Ahí la persona entra con "Continuar con Google" |
| `googleSessionExpired` | Cierra la sesión de Google, vuelve a mostrar el botón y `landing:subscriberSignUp.google.sessionExpired` (AC-PROP-5-07) |

Mientras la cuenta de Google está conectada, la sesión de Firebase existe pero no tiene rol. `resolveSession` la trata como `signed-out`, así que `GuestOnly` no redirige y el formulario sigue visible.

### 5.3 Formulario

- `SubscriberSignUpFormValues` suma `accountMethod: "password" | "google"`. El esquema exige `password` y su confirmación solo con `"password"`.
- El ViewModel guarda la cuenta conectada (`googleAccountEmail`) y arma el payload con `buildCompleteSubscriberSignUpPayload`.
- Textos nuevos en `landing.json` (es, en): `subscriberSignUp.google.{continueAction, connectedAccount, usePasswordAction, emailMismatch, popupBlocked, sessionExpired}`.

### 5.4 Tests

| Archivo | Qué prueba |
| --- | --- |
| `subscriber-sign-up/tests/SubscriberSignUpGoogle.test.tsx` (nuevo, con Page Object) | AC-PROP-5-01 … 05 y 07 con `connectGoogleAccount` y la mutación simulados |
| `subscriber-sign-up/tests/buildCompleteSubscriberSignUpPayload.test.ts` (existente) | El payload lleva `googleIdToken` y no `password` cuando la cuenta es de Google |

## 6. Prueba manual

Hasta KAN-24 no hay enlace en producción, así que para probar en un despliegue de Preview hace falta preparar uno:

1. Un script local (fuera del repo, con la cuenta de servicio) crea un token con `createSignUpToken()` y guarda su hash y una fecha de vencimiento en **un `planCheckout` de prueba**. Se le pregunta al equipo antes de escribir en la base real.
2. Se abre `/sign-up?token=<token>` y se prueba el registro con contraseña (4a) y con Google (4c).
3. Al terminar se borran el negocio, el usuario, el `slug` y la marca del enlace de prueba.

Con el emulador, los tests de §3.4 y §4.3 cubren lo mismo sin tocar la base real.

## 7. Decisiones

| Id | Decisión | Por qué |
| --- | --- | --- |
| D1 | Tres handlers compartidos en `functions/src/billing/handlers/` y Vercel los corre con `runSharedHandler` | Q8: una sola fuente. Es el mismo patrón que #65 y #107 |
| D2 | Se borra el stub entero, incluidos los datos de demostración (negocio `active`, servicio por defecto, horario, `subscription`) | La SPEC dice que el negocio nace `pending` (Q2) y lo activa el super admin (PROP-1). **Hay que avisar al equipo**: `/sign-up?token=<correo>` deja de funcionar en producción, y nadie podrá registrarse ahí hasta KAN-24 |
| D3 | `reportError` inyectado en lugar de `logger` | El handler no puede importar `firebase-functions`; cada entorno registra a su manera |
| D4 | El ID token de Google va en el payload (`googleIdToken`) y lo verifica el handler con `auth.verifyIdToken` | La callable del emulador y Vercel lo reciben igual. El handler no depende de cómo cada entorno lee el encabezado `Authorization` |
| D5 | El correo de Google tiene que ser el del pago | Q7: la cuenta se crea con el correo del pago (AC-KAN-25-14). Así nadie usa un enlace ajeno con su propia cuenta de Google |
| D6 | Una cuenta de Google que ya tiene rol o `users/{uid}` recibe la respuesta neutra `accountExists` | AS-5: el registro no revela si un correo ya está registrado, igual que con contraseña |
| D7 | Si algo falla, la cuenta de Google no se borra | No la creó el servidor y puede existir de antes. Sin rol no da acceso a nada |
| D8 | Después del registro con Google se cierra la sesión y se va a sign-in, igual que con contraseña | AS-6 y AC-KAN-27-01/02 no cambian, y sign-in ya tiene "Continuar con Google" |
| D9 | Google se propone como **PROP-5** | No hay historia en Jira. Se suma a `open-questions.md` y a la SPEC de la feature (`backlog-to-spec` §4) |
| D10 | Orden 4a → 4b → 4c, cada uno desde `develop` | 4b cambia el handler de 4a y 4c llama al contrato de 4b. Sin PRs apilados |
