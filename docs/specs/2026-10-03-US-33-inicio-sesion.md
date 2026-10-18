# Software Design Document (SDD) — US-33 (KAN-33, KAN-34, KAN-35, KAN-129, KAN-130, KAN-131)

## Inicio de sesión con reCAPTCHA, errores claros y mostrar u ocultar la contraseña

| Metadato | Valor |
|---|---|
| **Historias de Usuario** | US-33 / KAN-33 (iniciar sesión validando un reCAPTCHA), US-34 / KAN-34 (mensajes claros ante datos erróneos), US-35 / KAN-35 (mostrar u ocultar la contraseña), US-129 / KAN-129, US-130 / KAN-130, US-131 / KAN-131 (las mismas tres para el cliente) |
| **Épicas** | KAN-28 (Login suscriptor) y KAN-128 (Login cliente). Una sola pantalla para todos los roles |
| **Portal** | Compartido (`src/modules/auth/`) |
| **Spec funcional** | `src/modules/auth/specs/SPEC.md` |
| **Rama** | `US-33` (sale de `develop`; PR contra `develop`) |
| **Fecha de Especificación** | 2026-10-03 |
| **Estado** | Aprobada (2026-10-05) |
| **Fuera de alcance** | Recuperar la contraseña (US-36, US-37, US-132), cierre por inactividad (US-38, US-133), pantallas "en revisión" / "rechazado" y error al leer el estado del negocio (AC-KAN-33-09 … 12, van en el PR de KAN-29, `business/layout`), modo solo lectura (KAN-49) y filtrado por permisos del colaborador (KAN-86) |

---

### 1. Resumen y Propósito

Reemplazar `SignInPlaceholderPage` por la pantalla real de inicio de sesión en `/sign-in`. Todo titular de cuenta (suscriptor, colaborador, cliente y super admin) entra con correo y contraseña, resuelve un reCAPTCHA verificado en el servidor, recibe errores traducidos que nunca revelan si un correo está registrado y puede mostrar u ocultar la contraseña. Al entrar, cada rol va a su portal o vuelve a la página protegida que lo envió al login (`redirectTo`).

---

### 2. Criterios de Aceptación

Tomados sin cambios de `src/modules/auth/specs/SPEC.md`. La columna "Cobertura" dice qué se implementa en este PR.

#### KAN-33 — Iniciar sesión validando un reCAPTCHA

| Id | Criterio (resumen) | Cobertura |
|---|---|---|
| AC-KAN-33-01 | Suscriptor con cuenta y negocio → entra y va al inicio del portal de su negocio | Completa |
| AC-KAN-33-02 | Super admin → va al inicio del portal admin | Completa |
| AC-KAN-33-03 | Con `redirectTo`, vuelve a esa página si su rol puede verla; si no, a su portal | Completa |
| AC-KAN-33-04 | Sin reCAPTCHA el botón está deshabilitado; token rechazado por el servidor → no entra, se reinicia el reCAPTCHA y se muestra `validation:recaptchaRequired` | Completa |
| AC-KAN-33-05 | Falla de red → sigue sin sesión, se conserva el correo, se borra la contraseña y se muestra `common:errors.network` | Completa |
| AC-KAN-33-06 | Suscriptor de negocio `inactive` / `suspended` → entra y llega al portal del negocio | Parcial: el login no bloquea por estado del negocio. El modo solo lectura es KAN-49 |
| AC-KAN-33-07 | Usuario con sesión que abre `/sign-in` → redirigido a su portal | Completa (`GuestOnly`) |
| AC-KAN-33-08 | Doble clic → botón deshabilitado con estado de carga; un solo intento | Completa |
| AC-KAN-33-09 … 12 | Pantallas "en revisión", aprobación, "rechazado" y error de red al leer el estado | **Fuera** (PR de KAN-29, `BusinessStatusGate`) |
| AC-KAN-33-13 | Colaborador `active` → va al inicio del portal del negocio | Parcial: llega al portal. Lo que ve según permisos es KAN-86 |
| AC-KAN-33-14 | Colaborador `inactive` con contraseña correcta → no entra y ve `common:auth.signIn.accountDisabled` | Completa del lado del cliente (mapeo de `auth/user-disabled`). Deshabilitar la cuenta es KAN-81 |

#### KAN-34 — Mensajes claros ante datos erróneos

| Id | Criterio (resumen) | Cobertura |
|---|---|---|
| AC-KAN-34-01 | Al corregir un campo con error, el error desaparece sin enviar | Completa |
| AC-KAN-34-02 | Correo o contraseña vacíos al perder el foco o al enviar → `validation:required`, sin intento de login | Completa |
| AC-KAN-34-03 | Correo inválido al perder el foco → `validation:emailInvalid` | Completa |
| AC-KAN-34-04 | Correo no registrado o contraseña incorrecta → el mismo `common:auth.signIn.invalidCredentials` | Completa |
| AC-KAN-34-05 | Demasiados intentos → `common:auth.signIn.tooManyAttempts` con enlace a recuperar la contraseña | Completa (el enlace apunta a `/password-recovery`, que llega con US-36) |
| AC-KAN-34-06 | Error inesperado → `common:errors.unknown` y sigue sin sesión | Completa |
| AC-KAN-34-07 | El error del servidor aparece arriba del formulario, se anuncia a lectores de pantalla y recibe el foco | Completa |

#### KAN-35 — Mostrar u ocultar la contraseña

| Id | Criterio (resumen) | Cobertura |
|---|---|---|
| AC-KAN-35-01 | El control alterna entre visible y oculta; se conservan el valor y el cursor | Completa |
| AC-KAN-35-02 | Nombre accesible `common:auth.password.show` / `hide` y `aria-pressed` | Completa |
| AC-KAN-35-03 | Contraseña vacía y visible al enviar → `validation:required`; el control conserva su estado | Completa |
| AC-KAN-35-04 | Contraseña visible al enviar → se oculta antes de la petición (AS-1) | Completa |

#### KAN-129, KAN-130, KAN-131 — Cliente

| Id | Criterio (resumen) | Cobertura |
|---|---|---|
| AC-KAN-129-01 | Cliente → va a "mis reservas" o vuelve a `redirectTo` | Parcial: completa con `redirectTo`; sin él va a la landing hasta KAN-150 (**P-1**) |
| AC-KAN-129-02 | Al iniciar sesión, la interfaz usa `User.language` | Completa, con la regla nueva de `users/` (**P-2**) |
| AC-KAN-129-03 | reCAPTCHA sin resolver o rechazado → no entra y ve `validation:recaptchaRequired` | Completa |
| AC-KAN-129-04 | Falla de red → sigue sin sesión y ve `common:errors.network` | Completa |
| AC-KAN-129-05 | Cliente bloqueado en un negocio (KAN-93) → entra igual | Completa (el login nunca lee `Customer`) |
| AC-KAN-129-06 | Cliente que abre el portal de negocio o admin → redirigido al inicio de su portal | Completa: `RequireRole` hoy manda a la landing y se corrige para mandar al portal propio. Ver **P-1** |
| AC-KAN-130-01 … 04 | Mismos errores que KAN-34 para el cliente | Completa |
| AC-KAN-131-01 … 03 | Mismo mostrar u ocultar que KAN-35 para el cliente | Completa |

#### Suposiciones de la SPEC que se aplican

AS-1 (la contraseña visible se oculta al enviar) y AS-10 (`accountDisabled` solo tras una contraseña correcta; Firebase lo garantiza) se implementan tal como están escritas.

---

### 3. Matriz de Fronteras de Equipo

| Recurso / Módulo | Estado | Permiso |
|---|---|---|
| `docs/specs/2026-10-03-US-33-inicio-sesion.md` | Nuevo | **Permitido (Creador)** |
| `src/modules/auth/**` | Módulo de la épica KAN-28 (propio) | **Permitido (Creador)** |
| `src/modules/auth/components/RequireRole.tsx` | Redirigir al portal propio y agregar `redirectTo` | **Permitido (propio)** |
| `src/components/common/password-input/`, `recaptcha-field/`, `alert/` | Átomos nuevos compartidos (opción A acordada) | **Permitido (Aditivo)**. No se modifica ningún átomo existente |
| `src/components/common/index.ts` | Exportar los átomos nuevos | **Permitido (Aditivo)** |
| `src/constants/**` | Claves nuevas en `ROUTE_PATH`, `SEARCH_PARAM`, `FUNCTION_NAME`, `FIREBASE_ERROR_CODE` y una constante nueva de reCAPTCHA | **Permitido (Aditivo, A-Z)** |
| `src/services/firebase/` | Lectura de la clave del sitio de reCAPTCHA | **Permitido (Aditivo)** |
| `src/i18n/locales/{es,en}/common.json` | Claves `auth.signIn.*` y `auth.password.*`; se borra `signInPlaceholder.*` | **Permitido** |
| `src/app/router/appRoutes.tsx` y `pages/SignInPlaceholderPage.tsx` | Montar la ruta real y borrar el placeholder | **Permitido (Integración)** |
| `src/app/router/tests/*`, `src/app/tests/*`, `e2e/smoke.spec.ts` | Ajustar las aserciones que esperaban el placeholder | **Permitido (Integración)** |
| `functions/src/auth/verifyRecaptcha.ts`, `functions/src/index.ts` | Función callable nueva | **Permitido (Creador)** |
| `firestore.rules` y `tests/rules/users.rules.test.ts` | Lectura del propio `users/{userId}` (ver **P-2**) | **Permitido (P-2 aprobada)** |
| `scripts/seed-emulator.ts` y sus constantes | Agregar `language` a los perfiles (ver **P-2**) | **Permitido (P-2 aprobada)** |
| `playwright.config.ts`, `e2e/sign-in.spec.ts` | Emuladores y semilla para el e2e (ver **D-7**) | **Permitido (Aditivo)** |
| `.env.example`, `README.md` | Documentar la clave de reCAPTCHA | **Permitido (Aditivo)** |
| `src/modules/business/**`, `customer/**`, `admin/**`, `landing/**` | Trabajo de otras personas | **PROHIBIDO MODIFICAR** |
| `src/shared/**` (shims de la migración) | Solo re-exportan el árbol nuevo | **No se modifica**. El código nuevo importa de `@/components/common`, `@/constants`, `@/services`, `@/types` y `@/test-utils` |

---

### 4. Decisiones de Arquitectura y Contratos de Datos (MVVM)

#### 4.1 Estructura de archivos

```text
src/modules/auth/
├── SignInPage.tsx                     # Vista: compone las piezas, sin lógica
├── auth.routes.tsx                    # Ruta /sign-in envuelta en GuestOnly
├── api/
│   ├── signInWithPassword.ts          # verifyRecaptcha → signInWithEmailAndPassword
│   ├── fetchUserLanguage.ts           # Lee users/{userId}.language (P-2)
│   ├── mapSignInError.ts              # Código de Firebase → clave i18n
│   └── useSignInMutation.ts           # useMutation tipado
├── components/
│   ├── GuestOnly.tsx                  # Redirige al portal propio si hay sesión
│   ├── RequireRole.tsx                # (editado) portal propio + redirectTo
│   ├── SignInForm.tsx                 # Formulario presentacional
│   └── SignInErrorAlert.tsx           # Mensaje de error del servidor con foco
├── constants/
│   ├── PortalHomeByRole.constants.ts  # Rol → ruta de inicio de su portal
│   ├── SignInErrorKey.constants.ts    # Claves i18n de errores del login
│   └── SignInFormDefaults.constants.ts
├── hooks/
│   ├── useSignInViewModel.ts          # Estado, envío, errores y navegación
│   └── useRedirectAfterSignIn.ts      # Decide el destino (redirectTo o portal)
├── models/
│   ├── index.ts                       # Barrel A-Z
│   ├── SignIn.mutation.ts             # Payload / Response
│   ├── SignInForm.schema.ts           # Zod + tipo inferido
│   └── signIn.model.ts                # Contratos JSDoc de props y ViewModel
├── utils/
│   └── resolveSafeRedirectPath.ts     # Solo rutas internas ("/x", nunca "//x" ni URLs)
└── tests/
    ├── SignInPage.page.ts             # Page Object
    ├── SignInPage.test.tsx            # Un test por criterio
    ├── RequireRole.test.tsx
    ├── GuestOnly.test.tsx
    ├── mapSignInError.test.ts
    └── resolveSafeRedirectPath.test.ts

src/components/common/
├── alert/{Alert.tsx, models/alert.model.ts, index.ts}                     # role="alert", tokens destructive
├── password-input/{PasswordInput.tsx, models/passwordInput.model.ts, index.ts}  # Input + Button ojo, aria-pressed
└── recaptcha-field/{RecaptchaField.tsx, useRecaptchaWidget.ts, models/recaptchaField.model.ts, index.ts}

functions/src/auth/verifyRecaptcha.ts   # Callable: verifica el token con Google
e2e/sign-in.spec.ts                     # Login real contra los emuladores
```

#### 4.2 Contratos de datos

```typescript
// src/modules/auth/models/SignInForm.schema.ts
export const signInFormSchema = z.object({
  email: z.string().trim().min(1, VALIDATION_MESSAGE_KEY.REQUIRED).email(VALIDATION_MESSAGE_KEY.EMAIL_INVALID),
  password: z.string().min(1, VALIDATION_MESSAGE_KEY.REQUIRED),
});
export type SignInFormValues = z.infer<typeof signInFormSchema>;
```

En el login no se valida la fortaleza de la contraseña: eso revelaría reglas sin aportar nada y queda para el registro y el cambio de contraseña (KAN-37).

```typescript
// src/modules/auth/models/SignIn.mutation.ts
export interface SignInPayload {
  readonly email: string;
  readonly password: string;
  readonly recaptchaToken: string;
}

export interface SignInResponse {
  readonly language: Nullable<Language>;   // User.language, null si no está
  readonly session: SignedInSession;       // Rol y claims recién leídos del token
}

export interface SignInError {
  readonly code: string;
  readonly messageKey: SignInErrorKey;     // ver 4.4
}
```

```typescript
// functions/src/auth/verifyRecaptcha.ts (contrato de la callable)
interface VerifyRecaptchaPayload  { recaptchaToken: string }
interface VerifyRecaptchaResponse { isVerified: true }
// Token vacío → HttpsError "invalid-argument"; Google lo rechaza → "permission-denied".
```

#### 4.3 Contrato de la Vista (ViewModel)

```typescript
export interface SignInViewModel {
  readonly form: UseFormReturn<SignInFormValues>;
  readonly handleSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  readonly handleRecaptchaTokenChange: (recaptchaToken: Nullable<string>) => void;
  readonly handleTogglePasswordVisibility: () => void;
  readonly isPasswordVisible: boolean;
  readonly isSubmitDisabled: boolean;      // sin token o petición en curso
  readonly isSubmitting: boolean;
  readonly recaptchaResetSignal: number;   // cambia para reiniciar el widget
  readonly serverErrorKey: Nullable<SignInErrorKey>;
  readonly shouldShowPasswordRecoveryLink: boolean;   // solo con tooManyAttempts
}
```

Los mismos contratos se documentan con `@typedef` en `models/signIn.model.ts` (`component-architecture` §4).

#### 4.4 Decisiones

| Id | Decisión |
|---|---|
| D-1 | **Flujo de envío:** validar con Zod → ocultar la contraseña (AS-1) → `verifyRecaptcha(token)` → `signInWithEmailAndPassword` → `getIdTokenResult(true)` para leer los claims → leer `User.language` (si falla, se ignora sin bloquear) → `i18n.changeLanguage` → navegar. |
| D-2 | **Mapeo de errores** (en `api/`, una sola vez): `auth/invalid-credential`, `auth/user-not-found`, `auth/wrong-password` e `auth/invalid-email` → `auth.signIn.invalidCredentials`; `auth/too-many-requests` → `auth.signIn.tooManyAttempts`; `auth/user-disabled` → `auth.signIn.accountDisabled`; `auth/network-request-failed`, `functions/unavailable` y `functions/internal` → `errors.network` (el SDK de Functions reporta como `internal` una petición que no llegó al servidor; no la distingue de un fallo del backend); `functions/invalid-argument` y `functions/permission-denied` de `verifyRecaptcha` → `validation:recaptchaRequired` y se reinicia el widget; cualquier otro → `errors.unknown`. Nunca se muestra `error.message`. |
| D-3 | **Destino tras el login:** si hay `?redirectTo=` y es una ruta interna segura (`resolveSafeRedirectPath`, evita redirecciones abiertas), se navega ahí. Si el rol no puede ver esa página, `RequireRole` lo manda a su portal (cubre AC-KAN-33-03). Si no hay `redirectTo`, se usa `PORTAL_HOME_BY_ROLE`: suscriptor y colaborador → `/business`, super admin → `/admin`, cliente → landing `/` (**P-1**). |
| D-4 | **reCAPTCHA v2 casilla** cargado desde el script oficial de Google (`https://www.google.com/recaptcha/api.js?render=explicit&hl=<idioma>`), sin dependencia npm. `RecaptchaField` es presentacional: recibe `siteKey`, `language`, `onTokenChange` y `resetSignal`; la carga del script vive en su hook `useRecaptchaWidget`. Clave del sitio en `VITE_RECAPTCHA_SITE_KEY`; secreto en el secret `RECAPTCHA_SECRET_KEY` de Functions (Secret Manager). En local y e2e se usan las **claves públicas de prueba de Google**, que siempre aprueban: con los emuladores la app usa la clave de sitio de prueba si `VITE_RECAPTCHA_SITE_KEY` está vacía, y la función usa la clave secreta de prueba sin declarar el secreto, así que no hace falta ningún archivo `.secret.local`. |
| D-5 | **Límite de seguridad conocido:** verificar el token en una callable antes de `signInWithEmailAndPassword` frena a un usuario normal, pero alguien puede llamar directo a la API REST de Firebase Auth. La protección real del endpoint es la integración de reCAPTCHA Enterprise de Identity Platform. Se deja anotado para el equipo y no se implementa aquí. |
| D-6 | **`RequireRole`** pasa a redirigir a `PORTAL_HOME_BY_ROLE[role]` (antes iba a la landing) y agrega `?redirectTo=<ruta actual>` al mandar al login. **`GuestOnly`** envuelve `/sign-in`. Ambos quedan en el barrel de `@/modules/auth`. |
| D-7 | **E2E:** `playwright.config.ts` agrega un segundo `webServer` que compila `functions/` y levanta los emuladores (`reuseExistingServer`), y el spec corre la semilla en un `beforeAll` dentro de un `describe` en serie (un `globalSetup` exige `export default`, que el lint prohíbe). El build del e2e fija `VITE_FIREBASE_PROJECT_ID` y `VITE_RECAPTCHA_SITE_KEY` para que un `.env.local` con valores reales no se mezcle. El test entra con `suscriptor@demo.test`, resuelve la casilla de prueba de Google dentro de su iframe y comprueba la llegada a `/business`. Requiere Java 21 (ya pedido en el README) e internet para el script de Google. |
| D-8 | **Constantes nuevas** con `Object.freeze({...} as const)`, claves A-Z. Las globales existentes (`as const` sin freeze) solo reciben claves nuevas y no se reescriben (cero refactors de paso). |
| D-9 | **Pruebas unitarias:** Firebase se mockea en `api/` (`vi.mock("../api/signInWithPassword")`). `RecaptchaField` se reemplaza con `vi.mock("@/components/common/recaptcha-field")` por un doble con un botón que emite un token, para que el Page Object pueda "resolverlo". |
| D-10 | **Validación:** `mode: "onTouched"` de React Hook Form: valida al perder el foco y, desde entonces, en cada cambio. Con `"onBlur"` el error no desaparecía al corregir el campo hasta el primer envío (AC-KAN-34-01). |

#### 4.5 Claves i18n nuevas (`common`, es y en)

`auth.signIn.title`, `auth.signIn.subtitle`, `auth.signIn.emailLabel`, `auth.signIn.passwordLabel`, `auth.signIn.submitAction`, `auth.signIn.submittingLabel`, `auth.signIn.forgotPassword`, `auth.signIn.invalidCredentials`, `auth.signIn.tooManyAttempts`, `auth.signIn.recoverPasswordAction`, `auth.signIn.accountDisabled`, `auth.signIn.recaptchaLabel`, `auth.password.show`, `auth.password.hide`.

Se reutilizan: `validation:required`, `validation:emailInvalid`, `validation:recaptchaRequired`, `common:errors.network` y `common:errors.unknown`. Se borra `signInPlaceholder.*`.

---

### 5. Preguntas resueltas (2026-10-03)

| Id | Pregunta | Decisión |
|---|---|---|
| **P-1** | ¿A dónde va un cliente que inicia sesión **sin** `redirectTo`? "Mis reservas" (KAN-150) todavía no tiene ruta. | Va a la landing (`/`) por ahora. Queda en una sola línea de `PORTAL_HOME_BY_ROLE` para que KAN-150 la cambie. AC-KAN-129-01 queda parcial hasta entonces. |
| **P-2** | ¿Se lee `users/{userId}.language` (AC-KAN-129-02)? | Sí. Regla `allow read: if request.auth.uid == userId` en `users/{userId}`, con su test de reglas (permitido y denegado), y `language` en los perfiles de la semilla. |

---

### 6. Plan de Pruebas

#### 6.1 Componente (`src/modules/auth/tests/SignInPage.test.tsx`, con Page Object)

Cada `it` empieza con la clave del criterio:

| Test | Comprueba |
|---|---|
| `AC-KAN-33-01` | Suscriptor → navega a `/business` |
| `AC-KAN-33-02` | Super admin → navega a `/admin` |
| `AC-KAN-33-03` (×2) | Vuelve a `redirectTo`; un `redirectTo` externo (`//evil.com`) se ignora |
| `AC-KAN-33-04` (×2) | Botón deshabilitado sin token; token rechazado → mensaje y reinicio del widget |
| `AC-KAN-33-05` | Red → correo conservado, contraseña vacía, `errors.network` |
| `AC-KAN-33-06` | Suscriptor de negocio suspendido → navega a `/business` (el login no consulta el estado) |
| `AC-KAN-33-08` | Doble clic → una sola llamada y botón con estado de carga |
| `AC-KAN-33-13` | Colaborador → navega a `/business` |
| `AC-KAN-33-14` | `auth/user-disabled` → `accountDisabled` |
| `AC-KAN-34-01` … `07` | Un test por criterio (blur, vacío, correo inválido, credenciales iguales para ambos códigos, demasiados intentos con enlace, desconocido, alerta con `role="alert"` y foco) |
| `AC-KAN-35-01` … `04` | Alternar, nombre accesible y `aria-pressed`, vacío visible, oculta antes de enviar |
| `AC-KAN-129-01` | Cliente con `redirectTo=/barberia-centro` → vuelve ahí |
| `AC-KAN-129-02` | Cliente con `language: "en"` → la interfaz cambia a inglés |
| `AC-KAN-129-03`, `04`, `05` | reCAPTCHA, red y cliente bloqueado (no se consulta `Customer`) |
| `AC-KAN-130-01` … `04` | Mismos casos de error con sesión de cliente |
| `AC-KAN-131-01` … `03` | Mismo mostrar u ocultar en el flujo de cliente |

#### 6.2 Otras pruebas

- `GuestOnly.test.tsx` — `AC-KAN-33-07`: con sesión, `/sign-in` redirige al portal propio.
- `RequireRole.test.tsx` — `AC-KAN-129-06`: un cliente en `/business` o `/admin` va a su portal; un visitante va a `/sign-in?redirectTo=...`.
- `mapSignInError.test.ts` y `resolveSafeRedirectPath.test.ts` — funciones puras.
- `localeParity.test.ts` (ya existe) — las claves nuevas están en `es` y `en`.
- `tests/rules/users.rules.test.ts` — cada usuario lee su propio perfil y no el de otro (P-2).
- Se ajustan `appRoutes.test.tsx`, `App.test.tsx` y `e2e/smoke.spec.ts` para que esperen el título real del login.

#### 6.3 E2E (`e2e/sign-in.spec.ts`)

Visitante → `/business` → redirigido a `/sign-in?redirectTo=/business` → entra con `suscriptor@demo.test` y la casilla de prueba → llega a `/business`.

---

### 7. Verificación

`npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run build`, `npm run test:e2e` y `npm run test:rules` (cambia `firestore.rules`). Después, revisión con la skill `revisor-agente`.

### 8. Commits previstos

```text
docs(specs): especificacion tecnica de inicio de sesion (US-33)
feat(ui): componentes comunes de alerta, contrasena y recaptcha (US-33)
feat(functions): verificar token de recaptcha en el servidor (US-33)
feat(auth): inicio de sesion con recaptcha y redireccion por rol (US-33)
feat(auth): mensajes de error claros en el inicio de sesion (US-34)
feat(auth): mostrar u ocultar la contrasena (US-35)
test(auth): pruebas de criterios de inicio de sesion (US-33)
test(e2e): inicio de sesion con usuario de la semilla (US-33)
```
