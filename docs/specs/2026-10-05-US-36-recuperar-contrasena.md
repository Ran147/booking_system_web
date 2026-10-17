# Software Design Document (SDD) — US-36 (KAN-36, KAN-37, KAN-132)

## Recuperar la contraseña y definir una nueva con indicador de seguridad

| Metadato | Valor |
| --- | --- |
| **Historias de Usuario** | US-36 / KAN-36 (pedir el correo de recuperación), US-37 / KAN-37 (definir una contraseña nueva con indicador de seguridad), US-132 / KAN-132 (lo mismo para el cliente) |
| **Épicas** | KAN-28 (Login suscriptor) y KAN-128 (Login cliente). Las mismas dos páginas para todos los roles (AS-8) |
| **Portal** | Compartido (`src/modules/auth/`) |
| **Spec funcional** | `src/modules/auth/specs/SPEC.md` |
| **Rama** | `US-36`, desde `develop` (el PR #8 de US-33 ya está fusionado, con el reCAPTCHA, `GuestOnly`, `PasswordInput` y `PasswordStrengthMeter` compartidos). Depende del PR #5 de KAN-25: ver §9 |
| **Fecha de Especificación** | 2026-10-05 |
| **Estado** | Borrador ajustado el 2026-10-13 a `develop` y al PR #5 — P-1 y P-2 decididas (2026-10-05), pendiente de aprobación |
| **Fuera de alcance** | Cambiar la contraseña con sesión iniciada (épica KAN-168), registro (KAN-25, KAN-122), cierre por inactividad (US-38), plantillas de correo propias y proveedor de correo (aún sin decidir, spec de notificaciones) |

---

### 1. Resumen y Propósito

Dos páginas nuevas, solo para visitantes (`GuestOnly`):

1. **`/password-recovery`**: el usuario escribe su correo, resuelve el reCAPTCHA y pide el enlace. Siempre ve el mismo mensaje neutro (`auth.passwordReset.requestSent`), exista o no la cuenta. El botón queda bloqueado 60 s con una cuenta atrás (AS-2).
2. **`/password-reset?oobCode=…`**: es la página a la que lleva el enlace del correo. Comprueba el código. Si es válido, pide la contraseña nueva y su confirmación, con el indicador compartido `PasswordStrengthMeter`, que marca cada regla de `PASSWORD_RULE` cumplida. Al guardar, lleva al login con un aviso de éxito.

El correo lo envía **Firebase Authentication** con su plantilla de "restablecer contraseña". No se necesita un proveedor de correo propio.

---

### 2. Criterios de Aceptación

Tomados sin cambios de `src/modules/auth/specs/SPEC.md`.

#### KAN-36 — Pedir el correo de recuperación

| Id | Criterio (resumen) | Cobertura |
| --- | --- | --- |
| AC-KAN-36-01 | Desde el login, "¿Olvidaste tu contraseña?" abre la recuperación con el correo ya escrito, si lo había | Completa (el correo viaja en el `state` del router, **no** en la URL) |
| AC-KAN-36-02 | Correo válido + reCAPTCHA → se envía el correo **en el idioma de la cuenta** si existe; siempre se muestra `auth.passwordReset.requestSent` | Completa (**P-1** = B: el servidor lee `User.language`) |
| AC-KAN-36-03 | Correo vacío o inválido → `validation:required` / `validation:emailInvalid` y no se envía nada | Completa |
| AC-KAN-36-04 | reCAPTCHA sin resolver o rechazado → no se envía y se muestra `validation:recaptchaRequired` | Completa |
| AC-KAN-36-05 | Falla de red → `errors.network` y se conserva el correo | Completa |
| AC-KAN-36-06 | Pedir otra vez antes de tiempo → botón deshabilitado con cuenta atrás (60 s, AS-2) | Completa (la cuenta atrás vive en la página; recargar la reinicia, ver D-6) |

#### KAN-37 — Definir la contraseña nueva

| Id | Criterio (resumen) | Cobertura |
| --- | --- | --- |
| AC-KAN-37-01 | Con un enlace válido, un indicador muestra qué reglas de `PASSWORD_RULE` se cumplen (las mismas que la validación) y hay mostrar u ocultar | Completa |
| AC-KAN-37-02 | Contraseña válida y confirmación igual (AS-3) → se cambia, se va al login y se muestra `auth.passwordReset.success` | Completa (aviso con `toast.success`, como pide `forms-validation-standards`) |
| AC-KAN-37-03 | Una regla sin cumplir → `validation:passwordTooWeak` y el indicador marca las reglas que faltan | Completa |
| AC-KAN-37-04 | La confirmación no coincide al perder el foco → mensaje de "no coinciden" | Completa, con la clave `validation:passwordMismatch` (ver **P-2**) |
| AC-KAN-37-05 | Enlace vencido, usado o mal formado → `auth.passwordReset.linkInvalid` con acción para pedir otro; no se muestra el formulario | Completa |
| AC-KAN-37-06 | Falla de red al guardar → no se cambia y se muestra `errors.network` | Completa |

#### KAN-132 — Cliente

| Id | Criterio (resumen) | Cobertura |
| --- | --- | --- |
| AC-KAN-132-01 | Igual que AC-KAN-36-02 para el cliente | Igual que AC-KAN-36-02 |
| AC-KAN-132-02 | Igual que AC-KAN-37-01 / 02 para el cliente | Completa |
| AC-KAN-132-03 | Igual que AC-KAN-36-03 / 04 para el cliente | Completa |
| AC-KAN-132-04 | Igual que AC-KAN-37-05 para el cliente | Completa |

#### Suposiciones de la SPEC que se aplican

AS-2 (60 s entre pedidos), AS-3 (campo de confirmación) y AS-8 (páginas compartidas por todos los roles; correo en `User.language`, ver **P-1**).

---

### 3. Matriz de Fronteras de Equipo

| Recurso / Módulo | Estado | Permiso |
| --- | --- | --- |
| `docs/specs/2026-10-05-US-36-recuperar-contrasena.md` | Nuevo | **Permitido (Creador)** |
| `src/modules/auth/**` | Módulo propio (épica KAN-28) | **Permitido (Creador)** |
| `src/modules/auth/components/SignInForm.tsx`, `SignInErrorAlert.tsx`, `hooks/useSignInViewModel.ts` | Pasar el correo escrito a la recuperación (AC-KAN-36-01) | **Permitido (propio, US-33)** |
| `src/components/common/password-input/`, `password-strength-meter/`, `src/domain/user/` | Ya existen en `develop` (compartidos, PR #8). Solo se consumen | **PROHIBIDO MODIFICAR** (si hace falta un cambio, se propone aparte) |
| `src/constants/**` | Claves nuevas en `ROUTE_PATH.AUTH`, `FIREBASE_ERROR_CODE` y `VALIDATION_MESSAGE_KEY` | **Permitido (Aditivo, A-Z)** |
| `src/i18n/locales/{es,en}/common.json`, `validation.json` | `auth.passwordRecovery.*`, `auth.passwordReset.*`, `passwordMismatch` | **Permitido** |
| `functions/src/auth/requestPasswordReset.ts` y su fila en `functions/src/index.ts` | Callable nueva (**P-1** = B). Usa `assertRecaptcha` del PR #5 | **Permitido (Creador)** |
| `functions/src/auth/assertRecaptcha.ts`, `verifyRecaptcha.ts` | Los crea el PR #5 (KAN-25) | **PROHIBIDO MODIFICAR** (solo se importa) |
| `functions/.env.example` | Documentar `FIREBASE_WEB_API_KEY` | **Permitido (Aditivo)** |
| `e2e/password-reset.spec.ts` | Flujo completo contra los emuladores | **Permitido (Aditivo)** |
| `README.md` | Cómo probar el enlace con el emulador y la URL de acción para producción | **Permitido (Aditivo)** |
| `src/modules/business/**`, `customer/**`, `admin/**`, `landing/**` | Trabajo de otras personas | **PROHIBIDO MODIFICAR** |
| `firestore.rules` | Sin cambios | — |

---

### 4. Decisiones de Arquitectura y Contratos de Datos (MVVM)

#### 4.1 Estructura de archivos (nuevos)

```text
src/modules/auth/
├── PasswordRecoveryPage.tsx                 # /password-recovery
├── PasswordResetPage.tsx                    # /password-reset
├── api/
│   ├── requestPasswordReset.ts              # llama a la callable requestPasswordReset
│   ├── useRequestPasswordResetMutation.ts
│   ├── verifyResetCode.ts                   # verifyPasswordResetCode
│   ├── useResetCodeQuery.ts                 # useQuery: comprueba el enlace al abrir la página
│   ├── confirmNewPassword.ts                # confirmPasswordReset
│   ├── useConfirmNewPasswordMutation.ts
│   └── mapPasswordResetError.ts             # código de Firebase → clave i18n
├── components/
│   ├── PasswordRecoveryForm.tsx
│   ├── PasswordRecoverySentNotice.tsx       # mensaje neutro + cuenta atrás
│   ├── PasswordResetForm.tsx
│   └── PasswordResetLinkInvalid.tsx         # enlace inválido + "pedir otro enlace"
├── constants/
│   ├── PasswordRecovery.constants.ts        # COOLDOWN_SECONDS = 60 (AS-2), tick de 1 s
│   └── PasswordResetErrorKey.constants.ts
├── hooks/
│   ├── usePasswordRecoveryViewModel.ts
│   ├── useCooldownCountdown.ts              # cuenta atrás reutilizable
│   └── usePasswordResetViewModel.ts
├── models/
│   ├── PasswordField.schema.ts              # passwordFieldSchema: lo crea el PR #5; ver §9
│   ├── PasswordRecoveryForm.schema.ts
│   ├── PasswordResetForm.schema.ts          # newPassword + confirmation, con refine
│   ├── PasswordReset.mutation.ts
│   └── passwordReset.model.ts               # contratos JSDoc de ViewModels y props
└── tests/
    ├── PasswordRecoveryPage.page.ts / .test.tsx
    ├── PasswordResetPage.page.ts / .test.tsx
    └── mapPasswordResetError.test.ts
```

Las reglas de contraseña ya viven en `@/domain` (`PASSWORD_RULE`, `evaluatePasswordStrength`) y el indicador es `<PasswordStrengthMeter password={newPassword} />` de `@/components/common`. No se crea nada de eso aquí. `passwordFieldSchema` lo crea el PR #5 en `src/modules/auth/models/` y lo exporta el barrel de `@/modules/auth`.

#### 4.2 Contratos de datos

```typescript
// models/PasswordResetForm.schema.ts
export const passwordResetFormSchema = z.object({
  confirmation: z.string().min(1, VALIDATION_MESSAGE_KEY.REQUIRED),
  newPassword: passwordFieldSchema,          // passwordTooWeak si falla alguna regla
}).refine((values) => values.confirmation === values.newPassword, {
  message: VALIDATION_MESSAGE_KEY.PASSWORD_MISMATCH,
  path: ["confirmation"],
});

// models/PasswordReset.mutation.ts
export interface RequestPasswordResetPayload { readonly email: string; readonly recaptchaToken: string }
export interface ConfirmNewPasswordPayload   { readonly oobCode: string; readonly newPassword: string }
export interface PasswordResetError          { readonly code: string; readonly messageKey: PasswordResetErrorKey }
```


#### 4.3 Contratos de los ViewModels

```typescript
export interface PasswordRecoveryViewModel {
  readonly form: UseFormReturn<PasswordRecoveryFormValues>;
  readonly handleRecaptchaTokenChange: (recaptchaToken: Nullable<string>) => void;
  readonly handleSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  readonly hasRequestBeenSent: boolean;       // muestra el mensaje neutro
  readonly isSubmitDisabled: boolean;         // sin token, enviando o en cuenta atrás
  readonly isSubmitting: boolean;
  readonly language: string;
  readonly recaptchaResetSignal: number;
  readonly recaptchaSiteKey: string;
  readonly remainingCooldownSeconds: number;  // 0 = puede volver a pedir
  readonly serverErrorAlertReference: RefObject<NullableRef<HTMLDivElement>>;
  readonly serverErrorKey: Nullable<PasswordResetErrorKey>;
}

export interface PasswordResetViewModel {
  readonly form: UseFormReturn<PasswordResetFormValues>;
  readonly handleSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  readonly handleToggleConfirmationVisibility: () => void;
  readonly handleTogglePasswordVisibility: () => void;
  readonly isConfirmationVisible: boolean;
  readonly isPasswordVisible: boolean;
  readonly isSubmitting: boolean;
  readonly linkState: "checking" | "invalid" | "network_error" | "valid";
  readonly retryLinkCheck: () => void;
  readonly serverErrorAlertReference: RefObject<NullableRef<HTMLDivElement>>;
  readonly serverErrorKey: Nullable<PasswordResetErrorKey>;
}
```

#### 4.4 Decisiones

| Id | Decisión |
| --- | --- |
| D-1 | **Flujo de recuperación:** validar con Zod → callable `requestPasswordReset({ email, recaptchaToken })` → mostrar siempre `requestSent` → iniciar la cuenta atrás de 60 s. La callable responde `{ isRequested: true }` **exista o no la cuenta**; solo falla por reCAPTCHA (`invalid-argument` / `permission-denied`) o red (`unavailable`). Nunca se revela si la cuenta existe. |
| D-1b | **La callable (P-1 = B):** 1) verifica el reCAPTCHA **dentro de la función** con `assertRecaptcha` (`functions/src/auth/assertRecaptcha.ts`, del PR #5; así lo pide `cloud-functions-standards` §5) y declara `secrets: RECAPTCHA_SECRETS`; 2) `getAuth().getUserByEmail(email)`: si no existe, responde igual y termina; 3) lee `users/{uid}.language` (si falta o no es `es` / `en`, usa `es`); 4) llama a la API REST de Identity Toolkit `accounts:sendOobCode` con `requestType: "PASSWORD_RESET"` y la cabecera `X-Firebase-Locale: <idioma>`, y Firebase envía su plantilla en ese idioma. Si Firebase responde con error (por ejemplo, demasiados envíos), se registra con `logger` y se responde igual. La clave web de Firebase (pública, la misma del navegador) se lee de `FIREBASE_WEB_API_KEY` en `functions/.env.<proyecto>`; con emuladores se usa la de demo y la URL del emulador de Auth (`FIREBASE_AUTH_EMULATOR_HOST`). | **Tiempo de respuesta:** la callable tarda al menos `PASSWORD_RESET.MINIMUM_RESPONSE_MS` (1,5 s) exista o no la cuenta; un test lo comprueba. Sin ese suelo, la cuenta existente (que lee Firestore y espera a Google) tardaría más y el tiempo delataría que existe (AC-KAN-36-02). **Clave web:** solo en el emulador se usa la clave demo; fuera de él, si `FIREBASE_WEB_API_KEY` falta o está vacía la callable falla con `internal` y lo registra, en vez de responder "enviado" sin enviar nada. El código vive en un solo archivo (`requestPasswordReset.ts`) y el emulador se detecta con `shared/isEmulator.ts` (`cloud-functions-standards` §1 y §7).
| D-2 | **Correo del login (AC-KAN-36-01):** el enlace "¿Olvidaste tu contraseña?" (y el del aviso de demasiados intentos) pasa `state: { email }` con el valor actual del campo. La página de recuperación lo usa como valor inicial solo si es un `string`. No va en la URL para que el correo no quede en el historial ni en los logs. |
| D-3 | **Enlace del correo:** Firebase añade `mode=resetPassword&oobCode=…` a la URL de acción. La página lee `oobCode`; si falta o `mode` no es `resetPassword`, muestra `linkInvalid`. Al abrir, `verifyPasswordResetCode` (con `useQuery`, sin reintentos) decide el estado: válido → formulario; `auth/expired-action-code` o `auth/invalid-action-code` → `linkInvalid`; red → `errors.network` con "Reintentar". |
| D-4 | **Guardar:** `confirmPasswordReset(oobCode, newPassword)` → `toast.success(auth.passwordReset.success)` → `navigate(/sign-in, { replace: true })`. Si el enlace vence entre medio → pasa a `linkInvalid`. Red → `errors.network` en el `Alert` y se conserva lo escrito (AC-KAN-37-06). Las dos contraseñas se ocultan antes de enviar (AS-1). | **Errores al guardar:** `auth/weak-password` (política de contraseñas del proyecto) muestra `auth.passwordReset.weakPassword`; `auth/too-many-requests`, `auth.passwordReset.tooManyRequests`. **Cuenta deshabilitada o borrada** después de enviar el correo (`auth/user-disabled`, `auth/user-not-found`): pasa a `linkInvalid`, con la opción de pedir un enlace nuevo, igual que un enlace vencido. Mientras "Reintentar" espera, la página muestra el estado de carga.
| D-5 | **Indicador y validación usan la misma función** `evaluatePasswordStrength` de `@/domain`: `passwordFieldSchema` falla si alguna regla no se cumple, y `PasswordStrengthMeter` pinta las mismas reglas. No pueden contradecirse (AC-KAN-37-01 / 03). El indicador se actualiza mientras se escribe (`form.watch("newPassword")`) y anuncia los cambios de forma educada (`aria-live="polite"`). |
| D-6 | **Cuenta atrás (AS-2):** `useCooldownCountdown(seconds)` con un `setInterval` de 1 s, en memoria. Recargar la página la reinicia. No es una barrera de seguridad: Firebase limita los envíos en el servidor (`auth/too-many-requests`, que también se muestra como `requestSent` para no revelar nada). |
| D-7 | **Desarrollo local:** el emulador de Auth no envía correos. Imprime el enlace en su terminal y lo muestra en la interfaz del emulador (http://127.0.0.1:4000/auth). Ese enlace abre la página del propio emulador, así que para probar nuestra página se copia el `oobCode` en `http://localhost:5173/password-reset?mode=resetPassword&oobCode=…`. El README lo explica. |
| D-8 | **Producción:** en *Firebase Console → Authentication → Plantillas → Restablecer contraseña* hay que configurar la URL de acción personalizada `https://<dominio>/password-reset`. Se documenta en el README; no se puede hacer desde el código. |
| D-9 | **E2E:** pedir la recuperación con `suscriptor@demo.test` → leer el `oobCode` desde la API REST del emulador (`/emulator/v1/projects/demo-booking-system/oobCodes`) → abrir la página → definir una contraseña nueva → entrar con ella. Al final se vuelve a correr la semilla para restaurar la contraseña de prueba. |
| D-10 | **Pruebas unitarias:** se mockea la frontera `api/` como en US-33, y se reutilizan el doble de `RecaptchaField` y `CurrentPathProbe`. |

#### 4.5 Claves i18n nuevas

- `common`: `auth.passwordRecovery.{title, subtitle, emailLabel, submitAction, submittingLabel, cooldownLabel (con {{count}}), backToSignInAction}`, `auth.passwordReset.{requestSent, title, subtitle, newPasswordLabel, confirmationLabel, submitAction, submittingLabel, success, linkInvalid, requestNewLinkAction}`, las reglas y el nivel del indicador usan las claves que ya existen en `auth.password.*` (`rules.*`, `strength.*`).
- `validation`: `passwordMismatch` (**P-2**).
- Se reutilizan `validation:required`, `validation:emailInvalid`, `validation:passwordTooWeak`, `validation:recaptchaRequired`, `errors.network`, `errors.unknown`, `auth.password.*` (mostrar/ocultar, reglas y niveles del indicador).

---

### 5. Preguntas para decidir antes de programar

| Id | Pregunta | Opciones |
| --- | --- | --- |
| **P-1** ✅ Decidida: **B** (2026-10-05) | ¿En qué idioma se envía el correo? AC-KAN-36-02 y AS-8 piden **el idioma de la cuenta** (`User.language`). Pero el usuario no ha iniciado sesión, así que el navegador **no puede** leer su perfil sin revelar si la cuenta existe. | **A (simple):** el navegador llama a `verifyRecaptcha` y luego a `sendPasswordResetEmail` con `auth.languageCode` = idioma de la página. Sin código nuevo en el servidor. El correo llega en el idioma en que el usuario está viendo la app, que suele coincidir con el de su cuenta (al iniciar sesión, la app guarda ese idioma en el navegador). AC-KAN-36-02 queda **parcial** en ese punto. <br>**B (completa, recomendada):** una callable nueva `requestPasswordReset` hace todo en el servidor: verifica el reCAPTCHA, busca la cuenta por correo, lee `User.language` y pide el correo a Firebase con ese idioma (cabecera `X-Firebase-Locale` de la API de Identity Toolkit). Cumple el criterio completo y además une reCAPTCHA y envío en una sola llamada. Cuesta una función de ~80 líneas y configurar la clave web de Firebase como parámetro de Functions. |
| **P-2** ✅ Decidida: `validation:passwordMismatch` (2026-10-05) | El mensaje de "las contraseñas no coinciden" está en la SPEC como `common:auth.passwordReset.mismatch`, pero el componente `FormMessage` solo traduce claves del namespace `validation`. | **Recomendado:** usar `validation:passwordMismatch` (un `VALIDATION_MESSAGE_KEY` nuevo) y anotar el cambio de nombre en la SPEC. La alternativa es modificar `FormMessage`, un componente compartido. |

---

### 6. Plan de Pruebas

#### 6.1 `PasswordRecoveryPage.test.tsx` (Page Object)

| Test | Comprueba |
| --- | --- |
| `AC-KAN-36-01` | Llega con `state.email` → el campo viene relleno; sin `state` → vacío |
| `AC-KAN-36-02` / `AC-KAN-132-01` | Éxito → `requestSent`; `auth/user-not-found` → el **mismo** `requestSent` |
| `AC-KAN-36-03` / `AC-KAN-132-03` | Vacío → `required`; inválido → `emailInvalid`; sin llamada |
| `AC-KAN-36-04` / `AC-KAN-132-03` | Botón deshabilitado sin reCAPTCHA; token rechazado → `recaptchaRequired` y reinicio |
| `AC-KAN-36-05` | Red → `errors.network`, el correo se conserva |
| `AC-KAN-36-06` | Tras pedir, botón deshabilitado con "Puedes volver a pedirlo en 60 s"; con temporizadores falsos, a los 60 s se habilita |
| Desde el login | El enlace "¿Olvidaste tu contraseña?" lleva el correo escrito (prueba en `SignInPage.test.tsx`) |

#### 6.2 `PasswordResetPage.test.tsx` (Page Object)

| Test | Comprueba |
| --- | --- |
| `AC-KAN-37-01` / `AC-KAN-132-02` | Al escribir, el indicador marca cada regla; hay mostrar u ocultar en los dos campos |
| `AC-KAN-37-02` / `AC-KAN-132-02` | Válida + confirmación igual → `confirmPasswordReset` con el `oobCode`, toast de éxito y navega a `/sign-in` |
| `AC-KAN-37-03` | Contraseña débil → `passwordTooWeak` y el indicador muestra las reglas que faltan |
| `AC-KAN-37-04` | Confirmación distinta al perder el foco → `passwordMismatch` |
| `AC-KAN-37-05` / `AC-KAN-132-04` (×3) | Código vencido, usado o ausente → `linkInvalid` + enlace a recuperar; no hay formulario |
| `AC-KAN-37-06` | Red al guardar → `errors.network`, sigue en la página |
| AS-1 | Las dos contraseñas visibles se ocultan antes de enviar |

#### 6.3 Otras pruebas

- `mapPasswordResetError.test.ts`: función pura.
- `PasswordStrengthMeter` y `evaluatePasswordStrength` ya tienen sus tests (PR #8); aquí solo se prueba que la página los usa.
- `GuestOnly`: ya cubierto; las rutas nuevas quedan dentro del mismo layout.
- `localeParity.test.ts`: las claves nuevas existen en `es` y `en`.
- `e2e/password-reset.spec.ts`: ver D-9.
- `requestPasswordReset` tiene tests contra los emuladores (`functions/src/auth/tests/requestPasswordReset.test.ts`, `npm run test:functions`): cuenta existente y desconocida responden igual, idioma del perfil, reCAPTCHA rechazado y carga inválida. El e2e (`e2e/password-reset.spec.ts`) recorre el flujo completo con una cuenta propia del test.

---

### 7. Verificación

`npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build` y `npm run test:e2e`. `npm run test:rules` no hace falta (sin cambios en `firestore.rules`).

### 8. Commits previstos

```text
docs(specs): especificacion tecnica de recuperar contrasena (US-36)
feat(functions): pedir correo de recuperacion en el idioma de la cuenta (US-36) [necesita el PR #5]
feat(auth): pedir correo de recuperacion de contrasena (US-36)
feat(auth): definir contrasena nueva desde el enlace (US-37)
test(auth): pruebas de criterios de recuperar contrasena (US-36)
test(e2e): recuperar contrasena con el emulador (US-36)
```

---

### 9. Dependencias con otros PRs y cambios de esta versión

**Cambios respecto a la versión del 2026-10-05:** el indicador de seguridad, `PasswordInput`, las reglas de contraseña (`PASSWORD_RULE`, `evaluatePasswordStrength`) y las claves `auth.password.*` ya están en `develop` (commit compartido del PR #8). Esta spec ya no los crea: los consume. Desaparecen `evaluatePasswordRules`, el átomo nuevo y el commit `feat(ui)`.

**Qué necesita del PR #5 (KAN-25, @mitsuogui), aún sin fusionar:**

| Pieza | Dónde | Qué pasa si el PR #5 no está |
| --- | --- | --- |
| `passwordFieldSchema` | `src/modules/auth/models/PasswordField.schema.ts` | Son 10 líneas. Se puede copiar idéntica; si el contenido es igual, Git no marca conflicto al fusionar |
| `assertRecaptcha` y `RECAPTCHA_SECRETS` | `functions/src/auth/assertRecaptcha.ts` | Necesaria para la callable `requestPasswordReset`. **Recomendado esperar el PR #5** antes de esa parte |

**Orden propuesto de trabajo:** primero las dos páginas (frontend, con la API mockeada) y sus tests; después la callable cuando el PR #5 esté en `develop`; al final el e2e. La callable comparte `functions/src/index.ts` con las tres funciones del PR #5: se agrega una línea en orden A-Z y se resuelve el conflicto dejando ambas.

**Conforme a `cloud-functions-standards` (PR #17, propuesta):** payload leído con Zod, `HttpsError` con los códigos de la tabla, el reCAPTCHA dentro de la función, y la función registrada en `FUNCTION_NAME`.
