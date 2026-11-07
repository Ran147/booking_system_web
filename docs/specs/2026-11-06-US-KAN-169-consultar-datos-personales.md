# Software Design Document (SDD) — KAN-169

## Consultar los datos personales de la cuenta del cliente

| Metadato | Valor |
| --- | --- |
| Historia de Usuario | KAN-169 — Como cliente quiero consultar mis datos personales para verificar la información asociada a mi cuenta. |
| Épica | KAN-168 — [Cliente] Perfil y configuración |
| Portal / Actor | customer / `customer`; se conserva el alias existente `client`, sin nueva funcionalidad |
| Feature folder | `src/modules/customer/features/profile/` |
| Fecha de Especificación | 2026-11-06 |
| Estado | Draft — listo para primer commit documental y revisión; BLOCKED únicamente la fuente del email en AC-01 (AS-1); no autoriza implementación |
| SPEC funcional | `src/modules/customer/features/profile/specs/SPEC.md` |
| Base inspeccionada | `develop`, HEAD `502d806446aab4d18a2715430cdfada7a5c3bbf6`; árbol inicialmente limpio; comparación inicial con `origin/develop`: 0 ahead / 0 behind |
| Requerimientos relacionados | Q4 (rutas por slug), Q6 (cuenta con nombre y teléfono), RNF-05 (tema), RNF-08 (accesibilidad); `auth-and-roles`, `api-query-standards`, `unit-testing-standards` |
| Depende de | Sesión y guards existentes; documento de cuenta producido por registro KAN-122/123; layout customer. La navbar KAN-96/109 es una integración posterior, no un bloqueo para acceso directo |

## 1. Resumen y propósito

El cliente consulta su nombre completo, teléfono y correo de cuenta en una pantalla de solo lectura. El perfil corresponde a la cuenta global, no a la ficha que mantiene cada negocio. El slug aporta contexto al portal y no determina la identidad consultada.

Este documento concreta únicamente KAN-169 siguiendo los SDD fechados de `docs/specs/`. No reemplaza la SPEC de la épica ni duplica las responsabilidades de sus demás historias. Conserva los identificadores publicados AC-KAN-169-01 a 04 y agrega AC-KAN-169-05 a 09. Los criterios nuevos del borrador anterior, aún sin primer commit, se consolidan en esta revisión; no se renumeran los publicados en la SPEC funcional. Las precisiones pendientes se identifican como supuestos, no como decisiones aprobadas.

## 2. Evidencia del estado actual

| Tema | Evidencia y consecuencia |
| --- | --- |
| Campos | No existe una interfaz global `User` en `src/domain/`. El glosario (`.agents/skills/domain-glossary/domain-glossary.md`, entidad User) define `fullName` y `phone` obligatorios para customer. `scripts/seed-emulator.ts`, `writeUserProfile`, escribe `email`, `fullName`, `phone`, `language`, `theme` en `users/{uid}`. No se deducen campos adicionales de una interfaz inexistente |
| Correo | El glosario y AC-KAN-123-11 del registro customer sitúan email en Firebase Auth; la semilla y los creadores de cuentas subscriber lo duplican en users. AC-KAN-169-01 de la SPEC funcional exige el correo almacenado en User. No existe contrato consistente de lectura del correo de perfil; AS-1 bloquea únicamente decidir su fuente en AC-01, sin elegir provisionalmente una ni definir fallback |
| Rol | `src/domain/user/UserRole.constants.ts` contiene `CUSTOMER: customer` y `CLIENT: client`; `customer.routes.tsx` permite ambos. El vocabulario canónico sigue siendo `customer` |
| Sesión | `AuthProvider` y `useAuthSessionController` exponen `useSession()`. `subscribeToSession.ts` escucha Firebase Auth, resuelve claims y actualmente tiene un fallback al documento users para rol y businessId. `Session` contiene userId y rol, no los datos personales |
| Lecturas | `src/modules/business/features/settings/api/fetchUserLanguage.ts` usa `doc/getDoc`, `firestore` de `@/services`, colección USERS y Zod. Las features customer ya usan TanStack Query con funciones fetch y claves propias |
| Rutas | `src/modules/customer/customer.routes.tsx` monta `CustomerLayout` en `/:businessSlug` y las reservas bajo `RequireRole`; no existe PROFILE en `RoutePath.constants.ts`. `CustomerPlaceholderPage.tsx` ya contiene un enlace a mis reservas |
| Layout | `CustomerLayout.tsx` resuelve primero el negocio por slug y solo monta Outlet en ready. Un slug no encontrado muestra `customer:layout.businessNotFound`; loading/error del negocio preceden al perfil. No existe una navbar customer implementada |
| Guards | `RequireRole.tsx`, `useRoleGate.ts` y `useRoleGateTargets.ts`: espera con Spinner; visitante a sign-in con redirectTo; otro rol a PORTAL_HOME_BY_ROLE |
| Seguridad | `firestore.rules`, match users: lectura solo con sesión y uid propio, independientemente del rol; create propio permitido; update limitado a preferencias de usuarios del portal business. KAN-169 no necesita modificar reglas |
| Estados | `ViewStateSwitch` representa loading/error/empty/ready mediante Spinner/ErrorState/EmptyState. `ErrorState` recibe messageKey pero no acción retry: la feature debe componer un Button de reintento, no asumir que ViewStateSwitch ya lo hace |
| Pruebas existentes | `tests/rules/users.rules.test.ts` ya prueba lectura propia, denegación de lectura ajena y visitante. También espera que create propio se deniegue, contradiciendo la regla actual; se registra sin corregirlo en esta tarea |

Graphify se intentó antes de explorar fuentes: el comando no está instalado y `graphify-out/graph.json` no existe. Se usaron búsquedas dirigidas con `rg` y lecturas de los archivos identificados. Las specs de referencia fueron los SDD de US-150 (aprobada), KAN-123 y KAN-25 (2026-10-31); no se presume que los borradores estén aprobados.

### Investigación dirigida del email (refinamiento)

- `customer-sign-up/` contiene únicamente `specs/SPEC.md`: no hay formulario ni creador de users customer implementado. Sus apartados Data y AC-KAN-123-11 separan fullName/phone en users de email/contraseña en Auth.
- `src/modules/auth/api/signInWithPassword.ts` y `signInWithGoogle.ts` autentican con Firebase Auth; leen users para rol alternativo e idioma, no para mostrar ni sincronizar email. Google sign-in no crea explícitamente un documento users ni copia el correo del proveedor.
- `SignIn.mutation.ts` devuelve Session e idioma; `Session.types.ts` no expone email. No existe schema global User ni schema de email de cuenta para el perfil. Los schemas de formulario validan el correo introducido, sin establecer la fuente de visualización.
- `functions/src/billing/completeSubscriberSignUp.ts` y `api/callFunction.ts` crean cuentas subscriber y guardan una copia de email en users, al igual que `writeUserProfile` de la semilla. `clientFunctionsFallback.ts` crea la cuenta subscriber en Auth; no establece un contrato customer de lectura del correo. Estos flujos no demuestran sincronización permanente entre fuentes.
- `changeCurrentUserPassword.ts` del portal business usa `auth.currentUser.email` para reautenticar; esto establece la identidad de autenticación, no la lectura del perfil customer. La búsqueda dirigida en componentes de layout, settings y customer no encontró una pantalla de correo de cuenta que resuelva la contradicción; el correo del footer customer es contacto del negocio y queda excluido.

Conclusión: Auth tiene el contrato de identidad, pero el contrato de visualización publicado de KAN-169 apunta a users. Elegir una fuente para esta pantalla requiere resolver esa discrepancia, no inferir una sincronización inexistente. La única pregunta sobre email es AS-1.

## 3. Alcance y fronteras

### In scope

- Consultar nombre completo y teléfono exclusivamente en `users/{session.userId}`; mostrar correo en solo lectura cuando se resuelva AS-1.
- Ruta `/:businessSlug/profile` dentro de la rama protegida existente; constante CUSTOMER.PROFILE y carga lazy siguiendo reservas.
- Integrar una entrada alcanzable en el portal customer y regreso al inicio del mismo slug mediante AppLink. En el develop inspeccionado, la página customer existente es el único punto de entrada implementado para features; se propone ahí el enlace mínimo, siguiendo el de mis reservas. Al implementar se reutilizará la navegación vigente si ya ofrece esa entrada, sin duplicarla. No construir la navbar ni modificar el flujo de reservas.
- Estados de sesión, carga, datos incompletos, documento ausente y errores recuperables; aislamiento al cambiar de cuenta.

### Out of scope

| Historia / Área | Frontera y relación futura |
| --- | --- |
| KAN-170 | Editar y guardar datos. Podrá reutilizar ruta, proyección y clave de consulta para refrescar la vista. KAN-169 no añade formulario ni botón de edición sin destino |
| KAN-171 | Cambio de contraseña y reautenticación; sección futura del mismo perfil, sin controles anticipados |
| KAN-172 | Selección y persistencia de idioma; esta consulta solo respeta el idioma vigente |
| KAN-173 | Selección y persistencia de tema; esta vista usa los tokens y tema vigentes |
| KAN-203 | Activar/desactivar recordatorios; sección futura, sin inventar campo, valor por defecto o persistencia |
| Otras áreas | Cambiar correo, eliminar cuenta, avatar, dirección, cumpleaños, exportación, listas de usuarios, fichas Customer por negocio, notas internas, bloqueo y administración de permisos |

Estas historias quedan fuera de esta entrega, no se declaran Deferred (out of MVP): no hay decisión de producto que las retire del MVP.

## 4. Actors and permissions

| Actor | Permiso de esta pantalla |
| --- | --- |
| `customer` autenticado | Ver solamente su propia cuenta |
| `client` autenticado | Se conserva la compatibilidad de las rutas actuales; variante de los tests de acceso, no historia ni AC independiente |
| Visitante | Sin acceso al perfil; redirección del guard existente |
| `subscriber`, `business_owner`, `collaborator`, `super_admin` | Sin acceso a esta pantalla; redirección a su portal existente |

Los permisos de pantalla no cambian los de Firestore: cada usuario autenticado puede leer su propio documento aunque pertenezca a otro rol. Ningún rol obtiene lectura del perfil ajeno mediante esta feature. No se toman uid, rol ni permisos de parámetros de ruta, query string, formularios o del payload del perfil.

## 5. Data y diseño previsto

| Campo | Fuente propuesta | Ausencia / nulabilidad |
| --- | --- | --- |
| `fullName` | Documento propio users | Obligatorio según Q6; ausencia/null/vacío en datos históricos se representa con notProvidedHint (AS-4), sin inventar un nombre |
| `phone` | Documento propio users | Obligatorio según Q6; misma tolerancia de lectura. No convertirlo a número ni aplicar formato que pierda `+`, ceros o separadores |
| `email` | Pendiente exclusivamente de AS-1: Auth o copia users, sin fallback | En la fuente que se acuerde, ausencia/null/vacío se representa con notProvidedHint; no sustituir por uid ni deducirlo del nombre |

No hay campos personales opcionales adicionales demostrados. Tolerar datos incompletos no cambia los requisitos del registro ni los de edición. Los espacios solos se consideran ausencia para presentación. Un tipo distinto de string/null/ausente en un campo permitido es documento inválido, no texto a serializar (AS-4).

La futura capa `profile/api/` leerá un único documento propio con `doc/getDoc`, validará con Zod y devolverá solo la proyección permitida. La integración del correo queda pendiente de AS-1: no se prescribe leerlo de users ni añadir una lectura Auth hasta resolverla. Los campos adicionales se descartan: identificadores internos, role, businessId/business_id, collaboratorId, language, theme, tokens y metadatos no son datos a presentar aquí. La contraseña nunca se consulta ni almacena en Firestore. Firestore entrega documentos completos: esta proyección limita UI/modelo de vista, no es filtrado de campos del lado servidor.

La clave de TanStack Query incluye USERS y session.userId; la consulta solo se habilita con sesión autorizada. No se reutiliza previousData de otra cuenta. Al salir o cambiar uid se deja de presentar el perfil anterior, incluso si llega una respuesta tardía. No se necesitan collection queries, índices, paginación, realtime ni Cloud Functions nuevas.

Se prevén ProfilePage, useProfileViewModel y contratos en `models/*.model.ts` dentro de la feature existente. La vista solo presenta; Firebase queda en api/. Sin formularios en KAN-169: no aplica introducir React Hook Form, validación de edición ni reCAPTCHA. Reutilizar Card, AppLink, Spinner, EmptyState, ErrorState y Button de common; no crear controles HTML alternativos.

## 6. Acceptance criteria

### KAN-169 — See my personal data

Los AC-01 a 04 conservan el comportamiento y los IDs de la SPEC funcional; las referencias a AS-1 de aquella SPEC se concretan en §5. Los criterios nuevos continúan su numeración. No se marcan como implementados.

- [ ] **AC-KAN-169-01** · happy · Given a signed-in `customer` with complete own account data, when they open their profile, then their `fullName`, `phone` and account email are shown with distinct labels as read-only values. Only the email source remains BLOCKED by AS-1; the name and phone contract is defined in §5. [KAN-169]
- [ ] **AC-KAN-169-02** · edge · Given a displayed field has no stored value, when the profile is shown, then `customer:profile.view.notProvidedHint` replaces the absent value while available fields remain visible; see AS-4 for missing, null and blank values. [KAN-169]
- [ ] **AC-KAN-169-03** · error · Given loading the profile fails because of the network, when the failure is reported, then `common:errors.network` and a retry action are shown; when retry succeeds, the current account values are shown. [KAN-169]
- [ ] **AC-KAN-169-04** · error · Given a visitor or a signed-in role other than `customer` or the supported `client` alias, when they open the profile under an available business slug, then the visitor is redirected to sign-in with the current destination preserved and the other roles to their configured portal; no personal profile values are shown. [KAN-169]
- [ ] **AC-KAN-169-05** · error · Given customer A is signed in, when a request attempts to read customer B's account document, then access is denied and B's profile values are not shown. [KAN-169]
- [ ] **AC-KAN-169-06** · edge · Given an authorized customer and a pending initial profile read, when they open their profile, then an accessible loading state is shown until the read settles, without presenting personal values prematurely. [KAN-169]
- [ ] **AC-KAN-169-07** · error · Given reading the own profile fails with permission denied, when the failure is reported, then `common:errors.permissionDenied` and a retry action are shown without raw backend errors or profile values. [KAN-169]
- [ ] **AC-KAN-169-08** · edge · Given an authorized account has no users document, when the read completes, then `customer:profile.view.profileNotFoundEmpty` is shown with a retry action; no document is created and no registration or edit form is displayed. See AS-4. [KAN-169]
- [ ] **AC-KAN-169-09** · happy · Given an authorized customer in the existing customer portal for a loaded business, when they follow the profile entry, then `/:businessSlug/profile` opens; refreshing that URL preserves access and returning home retains the same slug. [KAN-169]

### Consolidación de criterios nuevos antes del primer commit

Los antiguos AC-09 (proyección), AC-11 (aislamiento de caché/sesión) y AC-12 (tipos inválidos y error no clasificado) pasan a invariantes de §5/§7 y escenarios separados de §10, sin perder cobertura. El antiguo AC-13 se integra como variante de compatibilidad de AC-01/AC-04 y de actores/permisos. El antiguo AC-10 queda como AC-09. AC-05 conserva ownership y mueve la manipulación del UID en URL a la estrategia de pruebas. AC-06 conserva loading del perfil; loading de sesión sigue como comportamiento heredado del guard. Ningún ID de AC-01 a 04 cambia.

## 7. Estados de UI y restricciones no funcionales

| Estado | Resultado |
| --- | --- |
| Negocio loading/error/empty | Mantener comportamiento del layout existente; no montar contenido privado hasta ready. No rediseñar recuperación del layout |
| Sesión loading | Spinner del guard; no lectura de perfil |
| Perfil loading | Spinner accesible, sin valores de otra cuenta |
| Ready | Tres etiquetas y valores; datos faltantes con hint por campo |
| Documento ausente | EmptyState diferenciado de error y de campos incompletos |
| Error | ErrorState con mensaje traducido y Button de reintento; no valores parciales del documento inválido |

Las invariantes de proyección y aislamiento de §5 son obligatorias aunque no tengan AC independiente. Un tipo inválido en un campo permitido produce `customer:profile.view.loadError` con reintento y sin serialización del documento. Un fallo de lectura no clasificado produce el mismo estado, sin mensajes crudos. Son dos escenarios de prueba distintos. La espera del guard es heredada y se comprueba mediante integración, sin redefinirla como requisito nuevo del perfil.

Claves propuestas (a crear solo al implementar en es/en): `customer:profile.view.title`, `fullNameLabel`, `phoneLabel`, `emailLabel`, `notProvidedHint`, `profileNotFoundEmpty`, `loadError`, `retryAction`, `backAction`; entrada `customer:profile.navigation.profileAction`. Reutilizar `common:errors.network` y `common:errors.permissionDenied`. No se añaden locales en esta fase.

La consulta respeta idioma y tema existentes sin escribir preferencias. Etiquetas asociadas semánticamente a valores (por ejemplo lista descriptiva), encabezado identificable, loading con nombre accesible, errores anunciados, enlaces y reintento operables por teclado. Usar tokens semánticos en claro/oscuro (RNF-05), sin depender solo del color. No se agregan exportaciones, notificaciones, auditoría ni cambios de sesión propios de esta historia.

## 8. Assumptions (to confirm)

| Id | Supuesto propuesto | Afecta |
| --- | --- | --- |
| AS-1 | ¿El correo mostrado por KAN-169 debe proceder de Firebase Auth (contrato de identidad y registro) o de `users/{uid}.email` (AC-01 funcional publicado)? El equipo debe escoger una fuente y reconciliar la SPEC funcional; no se define fallback ni sincronización | BLOCKED solo la fuente del email de AC-01 y su integración/pruebas; no bloquea nombre, teléfono, ownership, navegación ni los demás AC |
| AS-4 | Tolerar campos ausentes/null/blancos solo en lectura; documento inexistente produce empty; tipos inválidos producen error. Esto no hace opcionales los campos obligatorios de Q6 | AC-02, AC-08 y adaptación/errores de §5/§7 |

AS-2 y AS-3 del borrador inicial se retiran como supuestos: `client` es compatibilidad comprobada, y la navegación se define siguiendo el portal existente (§3). Se conservan los IDs restantes para no confundir referencias de la revisión.

## 9. BLOCKED y Backlog issues

Ninguna pregunta Q1–Q7 permanece abierta. AS-1 es una discrepancia local pendiente de equipo: bloquea únicamente la fuente del correo de AC-01 y sus detalles de integración/prueba. No bloquea el resto de la especificación ni su primer commit documental. No se modifica el registro global de decisiones en esta pasada limitada a la SPEC. AS-4 sigue identificado para revisión de producto, sin conflicto arquitectónico conocido.

- La investigación de §2 no encuentra un contrato consistente para la fuente de visualización del correo. AS-1 concentra la única pregunta de email; no se elige una fuente provisional ni se asume sincronización.
- El glosario y las skills solo enumeran cuatro roles canónicos; develop también contiene `client` y `business_owner`. Se respeta compatibilidad actual sin normalización de roles en esta historia.
- AC-02 de la SPEC funcional habla de campo opcional, pero los únicos campos personales documentados son obligatorios para registro. Aquí cubre documentos históricos incompletos, sin inventar nuevos campos opcionales.
- La SPEC funcional y `jira-export.csv` omiten KAN-203 y afirman que no existe historia de recordatorios. `docs/backlog/Jira-export2.csv` y la solicitud sí incluyen KAN-203 bajo KAN-168. Sus responsabilidades quedan fuera, no fuera del MVP.
- `epic-map.md` conserva rutas antiguas `portals/`; AGENTS.md y código vigente usan `src/modules/`. Se usa la feature profile existente en modules y el nuevo SDD se guarda en docs/specs por solicitud expresa. No se crea otra SPEC de épica.
- Regla users/create permite crear documento propio y el test correspondiente espera denegación. Además, la resolución de sesión puede usar rol del documento si no obtiene claims válidos. Son hallazgos preexistentes para revisión de seguridad separada; KAN-169 no amplía esos mecanismos ni afirma que el guard sea una frontera de seguridad del servidor.

## 10. Pruebas y trazabilidad previstas

Los archivos siguientes son destinos propuestos, no pruebas creadas ni ejecutadas. Prefijo de cada caso: KAN-169 e ID del AC. UI con Page Object y renderWithProviders; mocks en api/, QueryClient nuevo y retries automáticos desactivados. Reglas solo en emulador.

| Historia | Criterios | Archivo previsto |
| --- | --- | --- |
| KAN-169 | AC-01, AC-02, AC-03, AC-06, AC-07, AC-08; variante `client` de AC-01; errores de §7 | `src/modules/customer/features/profile/tests/ProfilePage.test.tsx`, con `ProfilePage.page.ts`; fuente email pendiente de AS-1 |
| KAN-169 | AC-04, AC-09; variante `client` y espera heredada del guard | `src/app/router/tests/appRoutes.test.tsx` (casos con negocio disponible y mocks aislados) |
| KAN-169 | AC-05; invariantes §5: UID de sesión, parámetros ajenos ignorados, caché por uid, logout/cambio de cuenta y respuestas tardías | `src/modules/customer/features/profile/tests/useProfileViewModel.test.tsx` y `useProfileQuery.test.tsx` |
| KAN-169 | AC-02, AC-08; proyección §5 y tipo inválido §7 | `src/modules/customer/features/profile/tests/fetchProfile.test.ts` (proyección y adaptación; sin serializar campos internos) |
| KAN-169 | AC-05 (lectura propia/ajena), AC-04 (visitante) | `tests/rules/users.rules.test.ts` (reutilizar casos de ownership existentes; distinguirlos del fallo create preexistente) |
| KAN-170 | Fuera de este SDD; AC-KAN-170-* existentes en SPEC funcional | Plan futuro de edición sobre el mismo perfil |
| KAN-171 | Fuera de este SDD; AC-KAN-171-* existentes | Plan futuro de contraseña |
| KAN-172 | Fuera de este SDD; AC-KAN-172-* existentes | Plan futuro de idioma |
| KAN-173 | Fuera de este SDD; AC-KAN-173-* existentes | Plan futuro de apariencia |
| KAN-203 | Fuera de este SDD; requiere especificación propia, sin AC inventados aquí | Plan futuro de recordatorios |

Casos técnicos independientes obligatorios: documento con campos internos descartados; respuesta tardía de A tras entrar B; cierre de sesión con caché poblada; parámetro UID ajeno sin efecto; tipo inválido rechazado por adaptador; fallo de lectura no clasificado con mensaje traducido. Se verifican por separado, sin agrupar errores distintos en un único caso. Los casos de email se concretarán únicamente después de AS-1; no se fabrican expectativas contra dos fuentes.

## 11. Fronteras de entrega y verificación

La entrega de especificación crea únicamente este archivo. No cambia producción, SPEC funcional, reglas, tests, dependencias ni locales. No hace commit, push ni abre PR.

Tras aprobación, la implementación se limitará a profile, rutas/constantes customer, integración mínima con la navegación vigente, locales es/en y pruebas correspondientes. No cambiará el modelo de registro, el backend, reglas ni comportamiento de otras historias. Antes de implementar la parte del correo se deberá resolver AS-1 y reconciliar este SDD con la SPEC funcional manteniendo IDs publicados. El primer commit de documentación puede presentar esta decisión como pendiente, sin declarar toda la historia lista para implementación.

Las verificaciones de documentación no acreditan implementación de los AC. La futura entrega de código deberá ejecutar las puertas de calidad del contrato y documentar resultados reales; no se marcarán pruebas como aprobadas por estar previstas en esta SPEC.
