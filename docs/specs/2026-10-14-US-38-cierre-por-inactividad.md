# Software Design Document (SDD) — US-38 (KAN-38, KAN-133)

## Cierre de sesión automático por inactividad

| Metadato | Valor |
| --- | --- |
| **Historias de Usuario** | US-38 / KAN-38 (cierre por inactividad del suscriptor) y US-133 / KAN-133 (lo mismo para el cliente) |
| **Épicas** | KAN-28 (Login suscriptor) y KAN-128 (Login cliente). Un solo mecanismo para todos los roles con sesión |
| **Portal** | Compartido (`src/modules/auth/`) |
| **Spec funcional** | `src/modules/auth/specs/SPEC.md` (criterios AC-KAN-38-xx y AC-KAN-133-xx) |
| **Rama** | `US-38`, desde `develop` |
| **Fecha de Especificación** | 2026-10-14 |
| **Estado** | Aprobada (2026-10-14) — P-1 = B (se crea `useSignOut` aquí; si se duplica con KAN-42 se unifica después), P-2 = A, P-3 = A |
| **Fuera de alcance** | Editar `idleTimeoutMinutes` (KAN-182, admin), el botón manual de cerrar sesión (KAN-42) salvo lo indicado en **P-1**, y restaurar formularios sin guardar (AS-7) |

---

### 1. Resumen y Propósito

Quien tiene sesión y deja de usar la aplicación durante `PlatformSettings.idleTimeoutMinutes` ve primero un aviso con cuenta atrás (60 s, AS-4) con las acciones "Seguir conectado" y "Cerrar sesión". Si la cuenta llega a cero, la sesión se cierra, se limpia la caché de datos y se lleva a `/sign-in` con el mensaje `auth.idle.signedOut` y la página actual como `redirectTo`.

Aplica a todos los roles con sesión. Quien navega las páginas públicas sin sesión no ve nada (AC-KAN-133-04).

---

### 2. Estado actual del código

- Existe `src/modules/auth/hooks/useIdleTimeout.ts`: un temporizador que se reinicia con teclado, puntero y scroll. **Nadie lo usa** y no cubre el aviso, el cierre de sesión, otras pestañas ni el equipo dormido.
- **No existe** ninguna rutina de cerrar sesión: `useAuthSessionController` solo expone `{ session }`. La barra lateral nueva (`PortalSidebar`) tiene un botón con el texto fijo "Cerrar sesión" que aún no hace nada. Ver **P-1**.
- `FIRESTORE_COLLECTION.PLATFORM_SETTINGS` existe, pero `firestore.rules` no tiene regla para `platformSettings`: hoy ninguna lectura del cliente está permitida. Ver **P-2**.
- No hay constante `DEFAULT_PLATFORM_SETTINGS` ni mensajes `auth.idle.*`.

---

### 3. Criterios de Aceptación

Tomados sin cambios de `src/modules/auth/specs/SPEC.md`.

| Id | Criterio (resumen) | Cobertura |
| --- | --- | --- |
| AC-KAN-38-01 / AC-KAN-133-01 | Sin actividad (puntero, teclado, toque, scroll) durante N minutos menos el aviso, aparece `auth.idle.warning` con cuenta atrás y las acciones "Seguir conectado" y "Cerrar sesión" | Completa |
| AC-KAN-38-02 | "Seguir conectado" o interactuar con la página cierra el aviso y reinicia la cuenta | Completa |
| AC-KAN-38-03 | Al llegar a cero: cierra sesión, limpia la caché, va a `/sign-in` con `auth.idle.signedOut` y `redirectTo` = página actual | Completa (depende de **P-1**) |
| AC-KAN-38-04 / AC-KAN-133-02 | Si no se puede leer `PlatformSettings`, se usa `DEFAULT_PLATFORM_SETTINGS.IDLE_TIMEOUT_MINUTES` y no se bloquea al usuario | Completa (ver **P-2**) |
| AC-KAN-38-05 | Tras el cierre por inactividad, el botón "atrás" no muestra datos privados | Completa (la caché se limpia y las rutas privadas exigen sesión) |
| AC-KAN-38-06 | Con varias pestañas: la actividad en una evita el cierre en las demás, y si una cierra por inactividad se cierran todas | Completa (**P-3**, AS-5) |
| AC-KAN-38-07 | Si el admin cambia `idleTimeoutMinutes`, el valor nuevo se usa al empezar la siguiente sesión o al refrescar la consulta (AS-6) | Completa |
| AC-KAN-38-08 | Si el equipo estuvo dormido más del tiempo límite, al despertar se cierra la sesión **sin aviso** | Completa |
| AC-KAN-133-03 | El cliente que estaba llenando un formulario vuelve a la página (`redirectTo`) al iniciar sesión; no se restaura lo escrito (AS-7) | Completa |
| AC-KAN-133-04 | Un visitante sin sesión no ve aviso ni cierre | Completa |

Suposiciones que se aplican: AS-4 (aviso 60 s antes), AS-5 (actividad y cierre compartidos entre pestañas), AS-6 (valor leído al empezar la sesión y al refrescar la consulta), AS-7 (no se restaura lo escrito).

---

### 4. Decisiones de Arquitectura

#### 4.1 Estructura de archivos

```text
src/modules/auth/
├── components/
│   ├── IdleSessionGuard.tsx            # montado una vez con sesión; pinta el aviso
│   └── IdleWarningDialog.tsx           # diálogo con cuenta atrás (Modal común)
├── constants/
│   ├── IdleSession.constants.ts        # WARNING_SECONDS = 60, ACTIVITY_THROTTLE_MS, CHANNEL_NAME
│   └── IdleMessage.constants.ts        # tipos de mensaje entre pestañas
├── hooks/
│   ├── useIdleSession.ts               # estado: activo / aviso / expirado; reemplaza a useIdleTimeout
│   ├── useIdleTimeoutMinutes.ts        # lee PlatformSettings con fallback
│   └── useIdleTabSync.ts               # BroadcastChannel entre pestañas
├── api/
│   ├── fetchPlatformSettings.ts
│   ├── usePlatformSettingsQuery.ts
│   └── platformSettingsQueryKeys.ts
├── models/
│   ├── PlatformSettings.schema.ts      # Zod del documento; idleTimeoutMinutes entero > 0
│   └── idleSession.model.ts            # contratos JSDoc
└── tests/ IdleSessionGuard.page.ts / .test.tsx, useIdleSession.test.ts

src/domain/platform-settings/DefaultPlatformSettings.constants.ts   # DEFAULT_PLATFORM_SETTINGS
```

`useIdleTimeout.ts` se **borra** (sin uso, lo reemplaza `useIdleSession`) y se quita de `src/modules/auth/index.ts`.

#### 4.2 Decisiones

| Id | Decisión |
| --- | --- |
| D-1 | **Montaje:** `IdleSessionGuard` se monta una sola vez dentro del router, solo si la sesión es `SIGNED_IN`. Con `LOADING` o sin sesión no hace nada (AC-KAN-133-04). |
| D-2 | **Reloj por marcas de tiempo, no por un solo temporizador:** se guarda `lastActivityAt`. Un `setInterval` de 1 s compara `Date.now() - lastActivityAt` con el límite: pasa a "aviso" a (N − 60 s) y a "expirado" en N. Así un equipo dormido o una pestaña en segundo plano no se descuadran (AC-KAN-38-08): al volver, si el tiempo ya pasó el límite, se cierra **sin** aviso. También se comprueba al dispararse `visibilitychange`. |
| D-3 | **Actividad:** `pointerdown`, `keydown`, `touchstart` y `scroll` (pasivos). Se limita a una actualización por segundo para no recalcular en cada movimiento. Con el aviso abierto la actividad del fondo **no** cuenta: un clic en "Cerrar sesión" no debe cerrar el aviso antes de llegar. Solo lo cierran "Seguir conectado", Escape, un clic en el fondo del diálogo o actividad de otra pestaña (AC-KAN-38-02). |
| D-4 | **Tiempo límite:** `usePlatformSettingsQuery` lee `platformSettings/current`. Si falla, no existe o el valor no es válido, se usa `DEFAULT_PLATFORM_SETTINGS.IDLE_TIMEOUT_MINUTES` (sin error visible). Se refresca cuando la consulta se refresca (AS-6). El límite menos 60 s nunca baja de 0: si N ≤ 1 minuto el aviso aparece enseguida. |
| D-5 | **Cierre:** al expirar se ejecuta la rutina de cerrar sesión (ver **P-1**): `signOut(auth)`, `queryClient.clear()` y `navigate(sign-in?redirectTo=<página actual>, { replace: true })` con `state: { reason: "idle" }`. La página de login muestra `auth.idle.signedOut` una sola vez a partir de ese `state` (no queda en la URL). Si `signOut` falla, igualmente se limpia la caché y se navega al login (el usuario no debe quedar "colgado"). |
| D-6 | **Otras pestañas (P-3):** `BroadcastChannel("booking-idle")` con dos mensajes: `activity` (con `lastActivityAt`, limitado a uno cada 5 s) y `signed-out`. Quien recibe `activity` actualiza su `lastActivityAt` (si es mayor); quien recibe `signed-out` cierra su propia sesión local sin reenviar el mensaje. Firebase Auth ya comparte la sesión entre pestañas, por lo que `signOut` en una también la cierra en las demás; el mensaje sirve para limpiar la caché y mostrar el aviso en todas. |
| D-7 | **Aviso accesible:** diálogo modal (`Modal` común: `role="dialog"` con título, Escape y clic en el fondo equivalen a "Seguir conectado"). "Seguir conectado" recibe el foco al abrir. La cuenta atrás se anuncia con `aria-live="polite"` cada 10 s y, en los últimos 5 s, cada segundo. **Limitación conocida:** el `Modal` común no atrapa el foco con Tab; cambiarlo es un componente compartido y queda fuera de esta historia. |
| D-8 | **Atrás tras el cierre (AC-KAN-38-05):** la caché de TanStack Query se vacía y las rutas privadas ya exigen sesión (`RequireRole`), así que "atrás" lleva otra vez a `/sign-in`. No se guarda nada privado en `localStorage`. |
| D-9 | **Pruebas:** reloj falso de Vitest (`vi.useFakeTimers`) y la frontera `api/` mockeada, como en US-33 y US-36. La prueba de pestañas usa un doble de `BroadcastChannel`. |

#### 4.3 Claves i18n nuevas

`common`: `auth.idle.{warningTitle, warningMessage (con {{count}} segundos), stayConnectedAction, signOutAction, signedOut}`. Se reutiliza `auth.idle.warning` del SPEC como `warningMessage`.

---

### 5. Preguntas para decidir antes de programar

| Id | Pregunta | Opciones |
| --- | --- | --- |
| **P-1** ✅ Decidida: **B** (2026-10-14) | **¿Quién hace la rutina de cerrar sesión?** El cierre por inactividad "sigue los mismos pasos" que el cierre manual (KAN-42), y esa rutina todavía no existe. La barra lateral ya mergeada tiene el botón, pero sin acción. | **A (recomendada):** coordinar con quien tenga KAN-42 y esperar su `useSignOut` (`signOut` + limpiar caché + ir al login). **B:** crear aquí `useSignOut` en `src/modules/auth/hooks/` (unas 25 líneas) y avisar a quien tenga KAN-42 para que el botón la use. Riesgo de duplicar si ya la están haciendo. |
| **P-2** ✅ Decidida: **A** (2026-10-14) | **¿Se agrega la regla de lectura de `platformSettings`?** Hoy `firestore.rules` no permite leerla. Sin la regla el cliente siempre usará el valor por defecto, y el admin (KAN-182) nunca podrá cambiarlo en la práctica. | **A (recomendada):** agregar `match /platformSettings/{documentId} { allow read: if isSignedIn(); allow write: if false; }` (la escritura la hará KAN-182 por función o con una regla propia) y un test de reglas. No debilita nada: solo se lee con sesión y la escritura sigue cerrada. **B:** dejar solo el valor por defecto ahora y agregar la regla cuando llegue KAN-182. |
| **P-3** ✅ Decidida: **A** (2026-10-14) | **¿Cómo se comparten pestañas?** | **A (recomendada):** `BroadcastChannel` (D-6), soportado por todos los navegadores actuales. **B:** el evento `storage` de `localStorage`, que funciona en más navegadores viejos pero guarda marcas de tiempo en el almacenamiento. |

---

### 6. Plan de Pruebas

#### 6.1 `IdleSessionGuard.test.tsx` (reloj falso, Page Object)

| Test | Comprueba |
| --- | --- |
| `AC-KAN-38-01` / `AC-KAN-133-01` | A los N − 60 s aparece el aviso con cuenta atrás y las dos acciones |
| `AC-KAN-38-02` | "Seguir conectado" cierra el aviso y la cuenta empieza de nuevo; una interacción antes del aviso lo retrasa |
| `AC-KAN-38-03` | Al llegar a cero: se llama a cerrar sesión, se limpia la caché y se navega a `/sign-in` con `redirectTo` y `auth.idle.signedOut` |
| `AC-KAN-38-04` / `AC-KAN-133-02` | Con la lectura fallida se usa el valor por defecto y no hay error visible |
| `AC-KAN-38-06` | Mensaje `activity` de otra pestaña retrasa el aviso; `signed-out` cierra esta sesión |
| `AC-KAN-38-07` | Un valor nuevo en la consulta cambia el límite |
| `AC-KAN-38-08` | Al avanzar el reloj más que el límite de golpe, cierra sin mostrar el aviso |
| `AC-KAN-133-03` | `redirectTo` apunta a la página donde estaba el cliente |
| `AC-KAN-133-04` | Sin sesión (y con sesión cargando) no se monta nada |

#### 6.2 Otras pruebas

- `useIdleSession.test.ts`: transiciones activo → aviso → expirado con marcas de tiempo.
- `PlatformSettings.schema.test.ts`: valor válido, ausente y no positivo.
- `SignInPage.test.tsx`: muestra `auth.idle.signedOut` una vez con `state.reason === "idle"`.
- Reglas (si se acepta **P-2** = A): leer con sesión, no leer sin sesión, no escribir.
- `localeParity.test.ts`: las claves nuevas existen en `es` y `en`.

---

### 7. Verificación

`format:check`, `lint`, `typecheck`, `test:run` y, si se acepta **P-2** = A, `test:rules`. El e2e de inactividad no se justifica: el reloj real tardaría minutos; el reloj falso cubre los criterios.

### 8. Commits previstos

```text
docs(specs): especificacion tecnica de cierre por inactividad (US-38)
feat(auth): leer el tiempo de inactividad de la plataforma (US-38)
feat(auth): aviso y cierre de sesion por inactividad (US-38)
feat(auth): compartir la actividad entre pestanas (US-38)
test(auth): pruebas de criterios de cierre por inactividad (US-38)
```
