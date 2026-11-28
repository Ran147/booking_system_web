# Spec técnica — KAN-122: registro del cliente

| Campo | Valor |
| --- | --- |
| Épica / Historias | KAN-122 / KAN-123, KAN-124, KAN-125, KAN-126, KAN-127 |
| Portal | customer (`src/modules/customer/features/customer-sign-up/`) + `src/modules/auth/` + `functions/src/auth/` + `api/callFunction.ts` |
| Fecha | 2026-11-26 |
| Estado | Borrador para revisión |
| SPEC de la feature | `src/modules/customer/features/customer-sign-up/specs/SPEC.md` (AC-KAN-123-01 … AC-KAN-127-06, AS-1 … AS-10) |
| Depende de | Q4 y Q6 (decididas el 2026-09-28), Q8 (funciones de servidor en Vercel) y Q10 (rol `customer`). El PR 2 se fusiona **después de #65**, porque usa la verificación real de reCAPTCHA que agrega #65 |

---

## 1. Resumen

Hoy un cliente **no puede crear su cuenta**. El flujo de reserva exige una cuenta (Q6, `RequireRole`), pero no hay formulario de registro, ni enlace desde el inicio de sesión, ni nada en el servidor que cree una cuenta con el rol `customer`.

Esta épica agrega:

1. **El formulario de registro** en `/<businessSlug>/sign-up`, con nombre completo, teléfono, correo, contraseña y reCAPTCHA (KAN-123). Reutiliza el medidor de seguridad (KAN-124) y el campo mostrar / ocultar (KAN-125) que ya existen en `src/components/common/`.
2. **La creación de la cuenta en el servidor**: un handler compartido que corre en Vercel (Q8), crea la cuenta de Auth, el documento `users/{uid}` y el claim `role: "customer"`, y pide a Firebase el correo de verificación (KAN-126).
3. **La página que abre el enlace del correo**: una ruta común `/auth/action` que lee el tipo de enlace. La verificación de correo se resuelve ahí mismo, y la recuperación de contraseña se envía a la página que ya existe (`/password-reset`, US-36).
4. **El paso al inicio de sesión** con el correo ya escrito, volviendo después a las páginas del negocio (KAN-127).

**No se necesita proveedor de correo (Q9 sigue abierta, no bloquea):** el correo de verificación lo manda Firebase Authentication con su plantilla, gratis en el plan Spark, igual que el de recuperar contraseña.

## 2. Fuera de alcance

| Tema | Dónde |
| --- | --- |
| Vincular la cuenta nueva con un `Customer` que el negocio ya creó | KAN-88 / KAN-97 (SPEC, *Backlog issues*) |
| Registro del cliente con Google | No está en el backlog de KAN-122 |
| Verificación de correo del **suscriptor** | Paso 3 de KAN-25, en un PR aparte. Reutiliza la ruta `/auth/action` y la página de este trabajo |
| Que una cuenta sin verificar pueda o no confirmar una reserva | KAN-148 (SPEC AS-7) |
| Cambiar el texto de las plantillas de Firebase | No se puede: el cuerpo de la plantilla de verificación no es editable |

## 3. Diseño

### 3.1 Flujo

```text
/<slug>/sign-up  --(completeCustomerSignUp)-->  Vercel api/callFunction.ts
                                                  └─ handleCompleteCustomerSignUp (functions/src/auth/handlers)
                                                       1. reCAPTCHA (verifyRecaptchaToken, de #65)
                                                       2. createUser (Admin SDK, emailVerified: false)
                                                       3. claims { role: "customer" } + users/{uid}
                                                       4. correo de verificación (Identity Toolkit REST)
                     <-- { verificationEmail: "sent" | "sendFailed" }
navigate(/sign-in?redirectTo=…, state: { signUpEmail, signUpRole: "customer" })

Correo de Firebase --> /auth/action?mode=verifyEmail&oobCode=…&continueUrl=…
                         └─ applyActionCode → "verificado" + botón "Iniciar sesión"
                    --> /auth/action?mode=resetPassword&oobCode=…
                         └─ <Navigate replace to="/password-reset?…"> (página de US-36, sin cambios)
```

### 3.2 Servidor (PR 2)

| Archivo | Cambio |
| --- | --- |
| `functions/src/auth/handlers/handleCompleteCustomerSignUp.ts` (nuevo) | Handler compartido (`CallableHandlerInput`, igual que `handleGetAvailability`). Valida el payload con Zod, verifica el reCAPTCHA, crea la cuenta, escribe `users/{uid}`, pone el claim y pide el correo. Lanza `CallableFailure` |
| `functions/src/auth/completeCustomerSignUp.ts` (nuevo) | Envoltorio `onCall` para el emulador, como `getAvailability.ts` |
| `functions/src/auth/models/CompleteCustomerSignUp.schema.ts` / `.mutation.ts` (nuevos) | Payload `{ fullName, phone, email, password, recaptchaToken, language, continueUrl }`, con las mismas reglas de nombre, teléfono y contraseña que el cliente (AS-3, AS-5). Respuesta `{ verificationEmail }` |
| `functions/src/auth/sendVerificationEmail.ts` (nuevo) | `createCustomToken(uid)` → `accounts:signInWithCustomToken` → `idToken` → `accounts:sendOobCode` con `requestType: "VERIFY_EMAIL"`, `continueUrl` y la cabecera `X-Firebase-Locale`. Usa la misma clave web y la misma URL del emulador que `requestPasswordReset.ts` |
| `functions/src/auth/constants/CustomerSignUp.constants.ts` (nuevo) | Resultado `VERIFICATION_EMAIL` (`sent`, `sendFailed`) y textos técnicos |
| `functions/src/index.ts` | Exporta `completeCustomerSignUp` |
| `api/callFunction.ts` | `COMPLETE_CUSTOMER_SIGN_UP` en `PUBLIC_FUNCTION_NAMES` y una rama que lo ejecuta con `runSharedHandler`, sin copiar la lógica (Q8) |
| `src/constants/firebase/FunctionName.constants.ts` | `COMPLETE_CUSTOMER_SIGN_UP: "completeCustomerSignUp"` |

**Datos que se escriben** (Q10, glosario §3):
- Auth: `email` normalizado (AS-5), `password`, `displayName = fullName`, `emailVerified: false`.
- Claims: `{ role: "customer" }`, sin `businessId`.
- `users/{uid}`: `uid`, `email`, `fullName`, `phone`, `role: "customer"`, `language`, `theme: "system"` y `createdAt`. **No** se crea ningún `Customer` dentro de un negocio (AS-2).

**Errores y casos borde:**

| Caso | Respuesta |
| --- | --- |
| Payload inválido | `invalid-argument` |
| reCAPTCHA inválido o ausente | `permission-denied` (sin cuenta, AC-KAN-123-05) |
| Falta `RECAPTCHA_SECRET_KEY` | `unavailable` (503), igual que #65 |
| El correo ya tiene cuenta | **La misma respuesta que un registro correcto**, `{ verificationEmail: "sent" }`. No se toca esa cuenta ni se le manda correo (AC-KAN-123-06, AS-4) |
| Falla escribir los claims o `users/{uid}` | Se borra la cuenta de Auth recién creada y se responde `internal` (rollback, `cloud-functions-standards`) |
| Falla el envío del correo | La cuenta **se queda** y se responde `{ verificationEmail: "sendFailed" }` (AC-KAN-126-04) |
| `continueUrl` de un dominio no autorizado | Firebase lo rechaza: se trata como `sendFailed` y se registra en el log |

### 3.3 Página del enlace de correo (PR 1)

| Archivo | Cambio |
| --- | --- |
| `src/constants/routes/RoutePath.constants.ts` | `AUTH.ACTION: "/auth/action"` |
| `src/domain/business/BusinessSlug.constants.ts` + espejo en `functions/src/shared/constants/` | `AUTH: "auth"` en `RESERVED_BUSINESS_SLUG`, porque es un segmento nuevo de primer nivel |
| `src/modules/auth/AuthActionPage.tsx` (nuevo) | Lee `mode`. Si es `resetPassword`, redirige a `/password-reset` con la misma query (US-36 no cambia). En cualquier otro caso muestra `EmailVerificationCard`, que solo aplica el código si `mode` es `verifyEmail`; con otro `mode` muestra el aviso de enlace inválido sin llamar a Firebase |
| `src/modules/auth/components/EmailVerificationCard.tsx` + `EmailVerificationNotice.tsx` (nuevos) | El mismo marco que la página de US-36. Estados: `checking` (`Spinner`), `verified` (`common:auth.emailVerification.success` + "Ir a iniciar sesión"), `invalid` (`linkInvalid` + "Ir a iniciar sesión" para pedir otro correo) y `failed` (`common:errors.network` o `errors.unknown` + "Reintentar") |
| `src/modules/auth/hooks/useEmailVerificationViewModel.ts` (nuevo) | Decide el estado y el destino del botón |
| `src/modules/auth/api/useEmailVerificationQuery.ts` + `applyEmailVerificationCode.ts` + `mapEmailVerificationError.ts` (nuevos) | `applyActionCode` con `useQuery` (sin reintentos, `staleTime: Infinity` y sin volver a pedirlo al enfocar o reconectar, porque un código ya usado respondería "inválido"). Si hay sesión abierta, `currentUser.reload()` refresca `emailVerified`. `auth/expired-action-code`, `auth/invalid-action-code`, `auth/user-disabled` y `auth/user-not-found` → `invalid`; `auth/network-request-failed` → red; lo demás → desconocido |
| `src/modules/auth/utils/readContinuePath.ts` (nuevo) | Toma la ruta de `continueUrl` solo si es de este sitio y pasa `resolveSafeRedirectPath` |
| `src/constants/routes/SearchParam.constants.ts` | `CONTINUE_URL: "continueUrl"` |
| `src/i18n/locales/{es,en}/common.json` | `auth.emailVerification.*` (D11) |
| `src/modules/auth/auth.routes.tsx` | La ruta `/auth/action` va **fuera** de `GuestOnly`, porque el enlace se puede abrir con la sesión iniciada |

`continueUrl` es la página a la que se vuelve después de iniciar sesión (por ejemplo `https://<dominio>/<slug>`). El botón lleva a `buildSignInPath(<esa ruta>)` solo si es de este sitio y pasa `resolveSafeRedirectPath`. Si no, va a `/sign-in`.

### 3.4 Formulario de registro (PR 3)

| Archivo | Cambio |
| --- | --- |
| `src/modules/customer/customer.routes.tsx` | Ruta `sign-up` (`ROUTE_PATH.CUSTOMER.SIGN_UP`) dentro de `CustomerLayout`, envuelta en `GuestOnly` (AC-KAN-123-08) |
| `features/customer-sign-up/CustomerSignUpPage.tsx` + `components/CustomerSignUpForm.tsx` (nuevos) | Usa `InputField`, `PasswordInput`, `PasswordStrengthMeter`, `RecaptchaField` y `Button` de `src/components/common/`, sin HTML crudo. El retorno queda en menos de 80 líneas |
| `features/customer-sign-up/hooks/useCustomerSignUpViewModel.ts` (nuevo) | React Hook Form + Zod, `mode: "onTouched"`. El botón se desactiva sin token de reCAPTCHA o mientras se envía (AC-KAN-123-05, AC-KAN-123-10). Si el envío falla, se conservan los datos y la visibilidad de la contraseña y se renueva el reCAPTCHA (AC-KAN-123-07, AC-KAN-125-02). Si sale bien, se oculta la contraseña (AC-KAN-125-03) y se navega al inicio de sesión |
| `features/customer-sign-up/models/CustomerSignUpForm.schema.ts` (nuevo) | Compone `fullNameFieldSchema`, `phoneFieldSchema`, `emailFieldSchema` y `passwordFieldSchema`, que ya están en `src/modules/auth/models` (#43 y #5). No se crean reglas nuevas |
| `features/customer-sign-up/api/useCompleteCustomerSignUpMutation.ts` + `mapCustomerSignUpError.ts` (nuevos) | `callFunction(COMPLETE_CUSTOMER_SIGN_UP)`. El error de red se detecta con `navigator.onLine`, igual que en el registro del suscriptor |
| `src/modules/auth/models/SignInLocationState.interface.ts` + `SignInPage.tsx` | El estado acepta `signUpRole` (`subscriber` o `customer`) para mostrar `landing:subscriberSignUp.success` o `customer:signUp.success`. Si `verificationEmail` es `sendFailed`, se muestra `customer:signUp.verification.sendFailed` (AC-KAN-126-04). El correo sigue precargado (AC-KAN-127-04) y `redirectTo` se conserva (AC-KAN-127-03, AC-KAN-127-05) |
| `src/modules/auth/components/SignInForm.tsx` | Enlace "¿No tienes cuenta? Crear cuenta" **solo** cuando `redirectTo` apunta a las páginas de un negocio: lleva a `/<slug>/sign-up?redirectTo=…`. Hoy no hay ninguna forma de llegar al registro |
| `src/modules/customer/layout/components/EmailVerificationPendingBanner.tsx` (nuevo) + hook | Si la sesión es de un `customer` con `emailVerified === false`, muestra `customer:signUp.verification.pending` con "Reenviar correo". El reenvío llama a `sendEmailVerification(currentUser, { url })` desde el cliente. `auth/too-many-requests` muestra `tooManyRequests` (AC-KAN-126-05, AS-6) |
| `src/i18n/locales/{es,en}/customer.json` | `signUp.form.*`, `signUp.verification.*` (`sent`, `sendFailed`, `tooManyRequests`, `pending`, `resendAction`) y `signUp.success`. Los mensajes de la página del enlace (`success`, `linkInvalid`) están en `common:auth.emailVerification` (D11) |

## 4. Tests

| Archivo | Cubre |
| --- | --- |
| `functions/src/auth/tests/completeCustomerSignUp.test.ts` (emulador) | AC-KAN-123-01 y 11 (cuenta, claims y `users/{uid}`), AC-KAN-123-05 (sin reCAPTCHA no hay cuenta), AC-KAN-123-06 (correo existente: misma respuesta y la cuenta queda igual), AC-KAN-123-09 (correo normalizado), el rollback cuando falla Firestore y AC-KAN-126-01 y 04 (`sent` o `sendFailed`) |
| `tests/api/completeCustomerSignUp.test.ts` | La rama de Vercel ejecuta el handler compartido y traduce `CallableFailure` a HTTP |
| `src/modules/auth/tests/AuthActionPage.test.tsx` (+ `.page.ts`) + `mapEmailVerificationError.test.ts` | `resetPassword` redirige con la misma query, AC-KAN-126-02 (verificado, también con sesión abierta), AC-KAN-126-03 (vencido, usado, cuenta desactivada o borrada, sin código), error de red con "Reintentar", error desconocido, `mode` desconocido y `continueUrl` de otro sitio. El slug `auth` lo comprueba `isReservedBusinessSlug.test.ts` |
| `features/customer-sign-up/tests/CustomerSignUpPage.test.tsx` (+ `.page.ts`) | AC-KAN-123-02 … 13, AC-KAN-124-01 … 04, AC-KAN-125-01 … 04 y AC-KAN-127-01 … 05 |
| `src/modules/auth/tests/SignInPage.test.tsx` | El mensaje según `signUpRole`, `sendFailed` y el enlace "Crear cuenta" (solo con un `redirectTo` de negocio) |
| `src/modules/customer/layout/tests/EmailVerificationPendingBanner.test.tsx` | AC-KAN-126-05 y 06 |

AC-KAN-127-06 (el servicio o el negocio ya no se pueden reservar al volver) ya lo cubren las páginas del flujo de reserva. Aquí solo se prueba que la redirección llega a la ruta correcta.

## 5. Decisiones para revisar

| Id | Decisión | Por qué |
| --- | --- | --- |
| D1 | La cuenta se crea **en el servidor**, no con `createUserWithEmailAndPassword` en el navegador | El reCAPTCHA solo se puede exigir en el servidor (`auth-and-roles` §5). El claim `customer` solo lo pone el servidor. Además, en el navegador Firebase dice `email-already-in-use`, y eso revela qué correos tienen cuenta (AS-4) |
| D2 | El **primer** correo de verificación lo pide el servidor (token personalizado → `idToken` → `sendOobCode`) | Así el navegador no inicia sesión a mitad del registro. Si lo hiciera, `GuestOnly` y la sesión reaccionarían antes de tiempo, y se rompería AS-8, que pide cerrar sesión después del registro. Es gratis y usa la clave web que ya usa US-36 |
| D3 | El **reenvío** se hace desde el navegador con la sesión iniciada (aviso de "pendiente") | `sendEmailVerification` necesita a la persona dentro de su cuenta, y el límite de reenvíos lo pone Firebase (AS-6). Sin sesión ("enlace inválido" o `sendFailed`), la acción es "Iniciar sesión" y ahí aparece el aviso para reenviar |
| D4 | Ruta común **`/auth/action`** para todos los enlaces de Firebase | Firebase tiene **una sola URL de acción** para todas sus plantillas. La recuperación de contraseña de US-36 se sigue resolviendo en su página, sin cambiar su código |
| D5 | La URL de acción de la consola se cambia **al final**, con el código ya en Vercel y el acuerdo de José | Hoy está la URL por defecto (`…firebaseapp.com/__/auth/action`), revisada el 2026-11-26. Si se cambia antes, los enlaces de recuperar contraseña dejan de funcionar. Es un paso manual en *Authentication → Plantillas → Editar → Personalizar URL de acción* = `https://booking-system-web-omega.vercel.app/auth/action`. También deja de verdad en uso la página `/password-reset` (era el paso D-8 de US-36) |
| D6 | `auth` pasa a ser un slug reservado | Es un segmento nuevo de primer nivel (regla de `BusinessSlug.constants.ts`). Antes de fusionar hay que revisar que ningún negocio real use el slug `auth` |
| D7 | El registro está en `/<businessSlug>/sign-up` | Q4: el portal del cliente vive bajo el slug, y AC-KAN-127-03 y 05 piden volver a ese negocio |
| D8 | El aviso de "pendiente" está en `CustomerLayout` | Un cliente sin `redirectTo` va a la landing (`PORTAL_HOME_BY_ROLE`, P-1 de US-33) y ahí no ve el aviso. Lo verá al entrar a cualquier página de un negocio. Se puede revisar cuando exista "mis reservas" global |
| D9 | Las etiquetas de mostrar / ocultar son las de `PasswordInput` (`common`), no claves nuevas `customer:signUp.form.showPassword` / `hidePassword` | Evita duplicar textos. La SPEC pide que estas piezas se compartan (*Backlog issues*) |
| D10 | Un cliente sin verificar **puede** iniciar sesión | AS-7. Si puede reservar o no, lo decide KAN-148 |
| D11 | Los textos de la página del enlace van en `common:auth.emailVerification.*`, no en `customer:signUp.verification.*` | La página está en el módulo `auth`, compartido por todos los roles, y la reutiliza la verificación del suscriptor (paso 3 de KAN-25). Es el mismo criterio que `common:auth.passwordReset` |

## 6. División en PRs: un PR por historia

Regla: **un PR por historia (KAN)**. Nunca dos historias en el mismo PR. Una historia grande se puede partir en varios PRs, cada uno con sentido propio (límite de ~2000 líneas, `git-workflow` §5). Todos salen de `develop` hacia `develop`, sin apilar: cada rama se crea cuando el PR del que depende ya está en `develop`.

| PR | Historia | Contenido | Revisores | Se abre / fusiona |
| --- | --- | --- | --- | --- |
| 1 (#106) | KAN-126 (parte 1) | §3.3: `/auth/action`, la página de verificación y el slug `auth` + tests | José (US-36) | Ya abierto |
| 2 | KAN-123 (parte 1) | §3.2: el handler compartido, el `onCall`, la rama de Vercel y el primer correo de verificación + tests (AC-KAN-123-01, 05, 06, 09, 11; AC-KAN-126-01 y 04 del lado del servidor) | Randy + José | Se fusiona **después de #65** (reCAPTCHA) |
| 3 | KAN-123 (parte 2) | La ruta `/<slug>/sign-up`, el formulario con `InputField`, `PasswordInput` y `RecaptchaField`, el envío y sus errores (AC-KAN-123-02 … 13) | José + Ale | Después del PR 2 |
| 4 | KAN-124 | `PasswordStrengthMeter` en el formulario y sus pruebas (AC-KAN-124-01 … 04) | José | Después del PR 3 |
| 5 | KAN-125 | Visibilidad controlada de la contraseña: se conserva si falla el envío y se oculta antes de salir (AC-KAN-125-01 … 04) | José | Después del PR 3 |
| 6 | KAN-127 | Paso al inicio de sesión: correo precargado, `signUpRole`, `redirectTo` conservado y el enlace "Crear cuenta" en `SignInForm` (AC-KAN-127-01 … 06) | José | Después del PR 3 |
| 7 | KAN-126 (parte 2) | Aviso "verifica tu correo" en `CustomerLayout`, reenvío y `sendFailed` (AC-KAN-126-04 … 06) | José + Ale | Después de los PR 1 y 2 |

En el PR 3, `PasswordInput` ya trae el botón de mostrar / ocultar porque es parte del componente común. El PR 5 agrega solo el comportamiento que pide KAN-125 y sus pruebas.

Después de fusionar los siete: el paso manual de D5 y una prueba de punta a punta en Vercel (registrarse, recibir el correo, verificar e iniciar sesión).
