# Especificación Técnica — US-KAN-204: Inicio de Sesión Seguro del Super Administrador en el Backoffice

| Campo | Valor |
| --- | --- |
| **Historia de Usuario** | KAN-204 (Subtarea de Épica KAN-198: [Admin] Acceso) |
| **Título** | Como super administrador quiero iniciar sesión en el backoffice de forma segura |
| **Portal** | `admin` (Backoffice) / `auth` (Compartido) |
| **Rol** | `super_admin` |
| **Rutas Involucradas** | `/sign-in`, `/admin` |
| **Estado** | Ready for Review |
| **Autor** | Antigravity (Senior Frontend & Fullstack Architect) |
| **Fecha** | 2026-11-15 |

---

## 1. Declaración de la Historia

**Como** Super Administrador de la plataforma SaaS,  
**quiero** iniciar sesión con mis credenciales y validación reCAPTCHA en el backoffice,  
**para** gestionar y gobernar la plataforma de forma segura, acceder a los módulos administrativos y garantizar la integridad del sistema.

---

## 2. Contexto Arquitectónico y del Dominio

1. **Backoffice (`/admin`):**
   El portal administrativo de la plataforma SaaS permite a los operadores con rol `super_admin` supervisar negocios, planes, configuraciones globales, incidencias de soporte y registros de auditoría.
2. **Autenticación Unificada y Basada en Roles (RBAC):**
   - El punto de entrada para autenticación es `/sign-in`.
   - La verificación de seguridad es de grado enterprise: reCAPTCHA v2 validado mediante Cloud Function callable `verifyRecaptcha`, autenticación Firebase Auth (`signInWithEmailAndPassword`) y lectura de Custom Claims para extraer `role: "super_admin"`.
   - Mapeo canónico en `PORTAL_HOME_BY_ROLE[USER_ROLE.SUPER_ADMIN] = ROUTE_PATH.ADMIN.ROOT` (`/admin`).
3. **Guardias de Ruta:**
   - `RequireRole allowedRoles={[USER_ROLE.SUPER_ADMIN]}`: Protege `/admin` contra visitantes anónimos (redirigiéndolos a `/sign-in?redirectTo=%2Fadmin`) y contra usuarios autenticados con roles ajenos (`customer`, `subscriber`, `collaborator`), enviándolos a sus portales respectivos.
   - `GuestOnly`: Envuelve la ruta `/sign-in` para que cualquier super administrador con sesión activa sea redirigido automáticamente a `/admin`.

---

## 3. Criterios de Aceptación (Acceptance Criteria)

### AC-KAN-204-01 · Happy Path · Inicio de Sesión Exitoso al Backoffice
- **Dado** un super administrador con credenciales válidas registradas en el sistema y rol `super_admin`,
- **Cuando** ingresa su correo electrónico y contraseña en `/sign-in`, resuelve el reCAPTCHA v2 y presiona "Iniciar sesión",
- **Entonces** el sistema valida el reCAPTCHA en el servidor, autentica la sesión en Firebase Auth, extrae el rol `super_admin` y lo redirige automáticamente a la pantalla principal del backoffice (`/admin`).

### AC-KAN-204-02 · Happy Path · Retorno a Ruta Administrativa con `redirectTo`
- **Dado** un visitante no autenticado que intenta acceder directamente a una URL del backoffice (ej. `/admin`),
- **Cuando** la guardia `RequireRole` lo intercepta y lo envía a `/sign-in?redirectTo=%2Fadmin`, y el super administrador completa exitosamente el inicio de sesión,
- **Entonces** el sistema detecta el parámetro seguro `redirectTo` y lo redirige de vuelta a `/admin` en lugar de la redirección por defecto.

### AC-KAN-204-03 · Seguridad / Edge · Bloqueo de Acceso a No Administradores
- **Dado** un usuario autenticado con un rol distinto a super administrador (`subscriber`, `collaborator` o `customer`),
- **Cuando** intenta acceder directamente por URL a la ruta `/admin`,
- **Entonces** la guardia `RequireRole` deniega el acceso y lo redirige a la página de inicio de su propio portal (`/business` para suscriptores/colaboradores o `/` para clientes), evitando cualquier acceso no autorizado al backoffice.

### AC-KAN-204-04 · Seguridad / Edge · Redirección de Administrador Autenticado desde `/sign-in`
- **Dado** un super administrador que ya cuenta con una sesión activa en el navegador,
- **Cuando** intenta navegar a la pantalla pública `/sign-in`,
- **Entonces** el componente `GuestOnly` lo redirige de inmediato a la ruta del backoffice (`/admin`).

### AC-KAN-204-05 · Error · Credenciales Inválidas o reCAPTCHA Pendiente
- **Dado** un intento de acceso con credenciales incorrectas o sin resolver el reCAPTCHA,
- **Cuando** se interactúa con el formulario,
- **Entonces** el botón de envío permanece inhabilitado si el reCAPTCHA no está marcado, y si las credenciales fallan, se muestra un mensaje de alerta neutro (`common:auth.signIn.invalidCredentials`) sin revelar si el correo existe, manteniéndolo sin sesión y fuera de `/admin`.

---

## 4. Matriz de Trazabilidad de Pruebas

| Criterio | Tipo de Prueba | Archivo de Prueba |
| --- | --- | --- |
| `AC-KAN-204-01` | Unit / Component | `src/modules/auth/tests/SignInPage.test.tsx` (`AC-KAN-33-02 / AC-KAN-204-01`) |
| `AC-KAN-204-02` | Unit / Component | `src/modules/auth/tests/SignInPage.test.tsx`, `src/modules/auth/tests/RequireRole.test.tsx` |
| `AC-KAN-204-03` | Unit / Component | `src/modules/auth/tests/RequireRole.test.tsx` |
| `AC-KAN-204-04` | Unit / Component | `src/modules/auth/tests/GuestOnly.test.tsx` |
| `AC-KAN-204-05` | Unit / Component | `src/modules/auth/tests/SignInPage.test.tsx` |
| `AC-KAN-204-01` & `02` | E2E (Playwright) | `e2e/admin-sign-in.spec.ts` |

---

## 5. Verificación de Cumplimiento de Skills

- **`code-style-standards`:** Sintaxis `const` arrow function, nombres completos sin abreviaturas.
- **`component-architecture`:** Desacoplamiento estricto de vistas y ViewModel.
- **`component-standards`:** Uso exclusivo de componentes comunes de `@/components/common`.
- **`constants-standards`:** Constantes en `@/constants/` con `Object.freeze()` y orden A-Z.
- **`auth-and-roles`:** Aislamiento multi-tenant y protección RBAC en `/admin`.
- **`git-workflow`:** Rama `US-KAN-204-super-admin-login-backoffice` con PR contra `develop` en estado `Awaiting QA`.
