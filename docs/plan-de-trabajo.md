# Plan de trabajo: qué falta y por dónde empezar

Estado al 03/10/2026: el proyecto usa la arquitectura modular de Joshua (`src/modules/...`, ramas desde `develop`, claves `US-XX`). Cada feature tiene su `SPEC.md` con los criterios de la épica. La clave `US-XX` usa el mismo número que la de Jira: `US-33` es `KAN-33`. Q1 a Q7 ya están decididas.

## 1. Qué falta antes de programar

| # | Qué | Quién | ¿Bloquea empezar? |
|---|---|---|---|
| 1 | Cada integrante prepara su PC: Node 22.22 o más, `git clone`, `npm ci`, Java 21 (para el emulador) y `.env.local` con `VITE_USE_EMULATORS=true`. | Cada uno | Sí |
| 2 | **Datos de prueba para el emulador.** Un script que cree un super admin, un suscriptor con su negocio y un cliente, con sus roles (custom claims). Sin él nadie puede entrar a los portales de negocio, cliente o admin en local, porque los roles solo se asignan desde el servidor. | Tarea técnica, no es historia | Sí, para todo lo que requiere sesión |
| 3 | Aprobar los **campos nuevos** que proponen los specs (`docs/backlog/spec-review-notes.md` §1). Los más urgentes son los de `Service` (imagen, características, descuentos) y `Business` (logo, contacto, moneda). | Equipo | Solo para servicios y para la página del negocio |
| 4 | ~~Cerrar las votaciones~~. Hecho: Q1 a Q7 decididas el 28/09 (`docs/decisions/open-questions.md`). | Equipo | No |
| 5 | Randy agrega a los 5 compañeros como colaboradores del repo y protege `main` (PR con 1 aprobación). El CI queda apagado hasta que se resuelva la facturación de su cuenta. | Randy | No |
| 6 | Antes de programar, cada uno lee el `SPEC.md` de su feature y confirma o corrige sus suposiciones (`AS-n`). | Cada uno | No |

No hace falta crear el proyecto real de Firebase para empezar: con el emulador y `VITE_USE_EMULATORS=true` todo corre en local. El proyecto real solo se necesita para publicar o para una demo compartida.

## 2. Historias que se pueden empezar ya

### Ola 0: base de todo (empezar primero)

| Historias | Qué es | Carpeta |
|---|---|---|
| Script de datos de prueba | Ver §1, punto 2 | `scripts/` o `tests/` |
| KAN-33, 34, 35, 129, 130, 131 | Inicio de sesión: reCAPTCHA, errores claros, mostrar u ocultar la contraseña | `src/modules/auth` |
| KAN-36, 37, 132 | Recuperar la contraseña | `src/modules/auth` |
| KAN-38, 133 | Cierre de sesión por inactividad | `src/modules/auth` |
| KAN-39, 42 | Barra lateral del negocio: nombre, logo y cerrar sesión | `src/modules/business/layout` |

Todo lo que requiere sesión depende del login.

### Ola 1: no dependen de ninguna decisión abierta y se pueden hacer en paralelo

**Landing (no requiere sesión, se puede empezar hoy mismo)**
- KAN-2 (hero), KAN-3, 4, 6, 8, 9, 10, 11, 12, 13 (Home)
- KAN-5 (formulario de contacto con reCAPTCHA)
- KAN-15, 16, 17, 18, 19 (Contacto)
- KAN-7 ya está hecho (US-07, Joshua). KAN-21 (detalle de planes). Necesita planes cargados: usar el script de datos o esperar a KAN-181.

**Ajustes (requieren sesión)**
- KAN-51, 52, 172, 173 (idioma y tema). Son componentes compartidos que usan los dos portales.
- KAN-53, 171 (cambiar contraseña)

**Negocio**
- Servicios: KAN-54, 55, 56, 57, 58, 60, 62. KAN-59 (eliminar) termina de cerrarse cuando existan reservas.
- Agenda: KAN-64 (horario de atención), KAN-65 y KAN-66 (bloqueos a nivel de negocio), KAN-70 (confirmación manual o automática)
- Clientes: KAN-88, 89, 91, 92, 93, 94, 95. KAN-90 (historial) y KAN-98 (anonimizar) se completan cuando existan reservas.

**Admin**
- Planes: KAN-181, 183, 184, 185 (incluye el límite de colaboradores, Q1)
- Parámetros globales: KAN-182

**Cliente**
- Registro: KAN-123, 124, 125, 126, 127

### Ola 2: dependen de la ola 1

| Historias | Esperan a |
|---|---|
| KAN-112 a 115 (página del negocio), KAN-107, 118 a 121 (navbar y footer) | Servicios y los campos de `Business`. URL `/<slug-del-negocio>` (Q4). |
| KAN-135, KAN-140, 141, 143, 144 (elegir servicio y ver disponibilidad) | Servicios, horario y bloqueos |
| KAN-146 a 149 (confirmar la reserva), KAN-69 (reserva manual) | Disponibilidad |
| KAN-43, 44, 45, 46, 47, 49 (suscripción del negocio), KAN-40, 41 (banners) | Planes y parámetros globales |
| KAN-175, 177, 178, 179 (gestión de negocios, admin) | Suscripción y pagos |
| KAN-108, 109, 110 (enlaces de la navbar del cliente) | Mis reservas y perfil |
| KAN-169, 170 (perfil del cliente) | Registro del cliente |

### Ola 3: dependen de que existan reservas

- KAN-67, 68, 71 a 76 (agenda y gestión de reservas del negocio)
- KAN-151 a 154 (mis reservas), KAN-156 a 162 (reprogramar y cancelar)
- KAN-164 a 167 (correos al cliente), KAN-100, 101 (configurar notificaciones)
- KAN-103, 104, 106 (reportes), KAN-187, 188 (dashboard del admin)
- KAN-190 a 192 (tickets). Falta una historia para que el suscriptor cree tickets.
- KAN-195 (filtro por fecha de la auditoría)

### Antes bloqueadas, ya decididas

Q1 a Q7 se decidieron el 28/09. Lo que estaba bloqueado (colaboradores, auditoría, URL del negocio, checkout del plan) ya tiene criterios en su `SPEC.md`. Siguen fuera del MVP KAN-48 y KAN-50 (reintentos de renovación, Q5) y la reserva sin cuenta (Q6).

## 3. Reparto sugerido para 6 personas

| Persona | Ola 0 y 1 | Después |
|---|---|---|
| 1 | Login completo, script de datos de prueba y barra lateral del negocio | Suscripción del negocio |
| 2 | Landing: Home y Contacto | Registro del cliente y contratación del plan (Q7) |
| 3 | Servicios (negocio) | Página del negocio y selección de servicio |
| 4 | Horario, bloqueos y confirmación (agenda) | Disponibilidad y reserva manual |
| 5 | Planes y parámetros globales (admin) | Gestión de negocios, dashboard y tickets |
| 6 | Idioma, tema y cambio de contraseña; clientes (negocio) | Confirmar la reserva, mis reservas y cambios |

La ruta crítica es login → servicios y agenda → disponibilidad → confirmar la reserva. Si se atrasa, se atrasa todo el lado del cliente.

## 4. Cómo trabajar cada historia

1. Actualizar `develop` (`git checkout develop` y `git pull`) y crear la rama de la historia: `git checkout -b US-33`.
2. Leer el `SPEC.md` de la feature y escribir la spec técnica de la historia en `docs/specs/YYYY-MM-DD-US-33-nombre.md` (ejemplo: `docs/specs/2026-09-28-US-07-planes-suscripcion-landing.md`). Ningún código antes de esa spec.
3. Pedirle al asistente (Claude Code, Copilot o Antigravity) que implemente los criterios siguiendo `AGENTS.md`.
4. Correr `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test:run` y `npm run build` (y `npm run test:e2e` si es un flujo crítico).
5. Commits en español, sin tildes: `feat(auth): inicio de sesion con recaptcha (US-33)`.
6. Abrir el PR contra `develop` con la plantilla. Otra persona lo revisa y lo aprueba.
