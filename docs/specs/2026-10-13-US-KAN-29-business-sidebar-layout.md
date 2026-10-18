# Software Design Document (SDD) — KAN-29 / KAN2-11
## Barra Lateral Persistente de Navegación y Panel de Control B2B

| Metadato | Valor |
|---|---|
| **Historia / Épica** | KAN-29 (Business Layout & Sidebar) / KAN2-11 (Business Home Dashboard) |
| **Portal** | Business (`src/modules/business/layout/`) |
| **Fecha de Especificación** | 2026-10-13 |
| **Estado** | Aprobada para Implementación |
| **Requerimientos Relacionados** | RF-B01, RNF-01, RNF-02, RNF-05 (Theming), RNF-08 (Accesibilidad WCAG AA) |

---

### 1. Resumen y Propósito
Transformar la arquitectura de navegación del portal de negocio (`/business`) implementando una barra lateral persistente (`BusinessSidebar`) a nivel de layout (`BusinessLayout`), la cual envuelve la vista activa (`<Outlet />`). Al estar montada en la raíz del árbol de rutas del portal B2B, la barra lateral permanece visible y no se re-renderiza entre navegaciones.

La barra lateral provee botones descriptivos con accesos directos a las herramientas clave (como "Crear servicio") y módulos del sistema. En consecuencia, la página de inicio (`BusinessHomePage`) se simplifica a un panel de control ejecutivo enfocado en estadísticas y métricas del negocio (servicios activos, citas del día, estado del negocio) junto con alertas de solo lectura.

---

### 2. Criterios de Aceptación Medibles

* **AC-KAN-29-01 [Layout Persistente]:** Dado un usuario autenticado (`subscriber` o `collaborator`) en cualquier ruta del portal de negocios, cuando la página carga o cambia de ruta mediante `<Outlet />`, la barra lateral `BusinessSidebar` se mantiene montada sin parpadeos ni recargas completas.
* **AC-KAN-29-02 [Identidad y Rol en Sidebar]:** Dado el encabezado de la barra lateral, muestra el nombre del negocio (o iniciales fallback en un contenedor neutral), el estado del negocio y el badge de rol correspondiente (`Suscriptor` o `Colaborador`).
* **AC-KAN-29-03 [Accesos Directos Descriptivos]:** La barra lateral contiene botones descriptivos de navegación para:
  1. *Panel de control* (`/business`)
  2. *Crear servicio* (`/business/services/new`)
  3. *Agenda y turnos* (Próximamente)
  4. *Directorio de clientes* (Próximamente)
  5. *Reportes y métricas* (Próximamente)
  6. *Equipo y colaboradores* (Próximamente, visible solo para Suscriptor)
  7. *Configuración general* (Próximamente, visible solo para Suscriptor)
  8. *Plan y suscripción* (Próximamente, visible solo para Suscriptor)
* **AC-KAN-29-04 [Navegación y Modal de En Construcción]:** Al hacer clic en una herramienta disponible ("Crear servicio"), el usuario es dirigido inmediatamente a su ruta. Al hacer clic en una herramienta con estado "Próximamente", se abre un diálogo modal accesible (`PlaceholderDialog`) informando que la funcionalidad está en desarrollo, sin cambiar la ruta actual.
* **AC-KAN-29-05 [Aislamiento de Permisos por Rol]:** Dado un colaborador autenticado (`collaborator`), los accesos exclusivos de administración del suscriptor (Equipo, Configuración, Suscripción) no se muestran en la barra lateral.
* **AC-KAN-29-06 [Diseño Responsivo]:** En pantallas grandes (>= 1024px), la barra lateral se muestra fija a la izquierda (`w-64` / `w-72`). En pantallas pequeñas (< 1024px), la interfaz provee un encabezado superior con botón hamburguesa para desplegar la barra mediante un `Drawer` accesible.
* **AC-KAN-29-07 [Panel de Inicio Rediseñado]:** La vista `BusinessHomePage` conserva el encabezado de bienvenida, la alerta de solo lectura (cuando el negocio está inactivo o suspendido) y una cuadrícula de tarjetas de estadísticas (métricas operativas), eliminando las cuadrículas redundantes de tarjetas de herramientas que ahora residen en la barra lateral.
* **AC-KAN-29-08 [Tokens Semánticos y Accesibilidad]:** Todos los componentes utilizan tokens semánticos de Tailwind v4 (`bg-card`, `text-foreground`, `border-border`, `hover:bg-muted`) y respetan WCAG 2.1 AA (landmark `nav aria-label`, atributos aria, contraste en modo claro y oscuro).

---

### 3. Matriz de Fronteras de Archivos

| Archivo / Módulo | Estado | Rol |
|---|---|---|
| `docs/specs/2026-10-13-US-KAN-29-business-sidebar-layout.md` | Modificado | Especificación SDD |
| `src/components/layout/sidebar/` | Nuevo | Componente atómico reutilizable `PortalSidebar` para cualquier portal |
| `src/components/layout/index.ts` | Nuevo | Barrel export para componentes de layout transversales |
| `src/modules/business/layout/BusinessLayout.tsx` | Modificado | Shell persistente con Sidebar + Outlet |
| `src/modules/business/layout/components/BusinessSidebar/` | Modificado | Envoltorio de dominio que consume `PortalSidebar` |
| `src/modules/business/layout/hooks/useBusinessSidebarViewModel.ts` | Nuevo | ViewModel MVVM para la barra lateral |
| `src/modules/business/layout/models/businessSidebar.model.ts` | Nuevo | Interfaces y tipos TypeScript |
| `src/modules/business/layout/tests/BusinessSidebar.test.tsx` | Modificado | Pruebas unitarias de la barra lateral |
| `src/modules/business/features/home/` | Modificado | Actualización a panel de estadísticas |
| `src/modules/business/features/home/tests/BusinessHomePage.test.tsx` | Modificado | Pruebas unitarias del panel de estadísticas |
| `src/i18n/locales/{es,en}/business.json` | Modificado | Claves de i18n para la barra lateral |

---

### 4. Componente Atómico Reutilizable (`PortalSidebar`)

Para habilitar la reutilización en cualquier portal (Admin, Business, Customer):
- **Ubicación:** `src/components/layout/sidebar/PortalSidebar.tsx`
- **Contrato de Props (`PortalSidebarProps`):**
  - `brandName`: string — Nombre de la marca o título principal del portal.
  - `brandInitials`?: string — Iniciales opcionales; si no se pasan se derivan del `brandName`.
  - `badge`?: ReactNode — Insignia de rol o estado (`Suscriptor`, `Super Admin`, etc.).
  - `navItems`: readonly PortalSidebarItem[] — Colección de enlaces/botones con icono, título, descripción y badges.
  - `activePath`?: string — Ruta activa para resaltar el ítem actual.
  - `onItemClick`: (item: PortalSidebarItem) => void — Callback de interacción.
  - `onSignOut`?: () => void — Acción de cierre de sesión opcional.
  - `signOutLabel`?: string — Texto accesible para el botón de cierre de sesión.
  - `ariaLabel`: string — Etiqueta ARIA para el landmark `<nav>`.
  - `className`?: string — Clases adicionales de diseño.
