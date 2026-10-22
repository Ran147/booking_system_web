# Software Design Document (SDD) — US-12 (KAN-12)
## Visualización del Logo de la Empresa en la Navegación Principal

| Metadato | Valor |
|---|---|
| **Historia de Usuario** | US-12 / KAN-12 ("Como visitante quiero ver el logo de la empresa en la navegación principal para identificar visualmente la marca") |
| **Épica** | KAN-1 ([Landing] Home) |
| **Portal** | Landing (`src/modules/landing/layout/components/LandingNavbar`) |
| **Fecha de Especificación** | 2026-10-12 |
| **Estado** | Aprobada para Implementación |
| **Requerimientos Relacionados** | RF-01 (Landing Page), RNF-04 (Usabilidad e Identidad de Marca), RNF-05 (Tema Dinámico y Contraste), RNF-08 (Accesibilidad WCAG AA) |

---

### 1. Resumen y Propósito

Garantizar la identidad visual de la marca y la navegabilidad accesible en la cabecera principal (`LandingNavbar`) de la plataforma para cualquier visitante. El componente de branding (`LandingNavbarBranding`) presenta el isotipo/logo corporativo acompañado del nombre comercial ("Booking System").

El logotipo actúa como punto ancla interactivo que permite retornar a la raíz del portal público (`/`) desde cualquier subpágina o posición de scroll. Debe soportar accesibilidad completa (texto alternativo descriptivo `landing:home.navbar.logoAlt`), degradación elegante ante fallo de carga de recursos de imagen (mostrando el nombre de la plataforma y el isotipo de respaldo sin romper el enlace) y contraste adaptativo según el tema activo (claro u oscuro).

---

### 2. Criterios de Aceptación Medibles

* **AC-KAN-12-01 [Happy Path - Visualización de Logo y Navegación a Inicio]:** Dado que un visitante se encuentra en cualquier pantalla del portal landing, cuando la barra de navegación se renderiza, entonces:
  - Se visualiza el logo de la plataforma con texto alternativo accesible asociado (`landing:home.navbar.logoAlt`).
  - El contenedor de marca es un enlace interactivo hacia `ROUTE_PATH.LANDING.HOME` (`/`).
  - Activar el enlace conduce fluidamente a la ruta de inicio.
* **AC-KAN-12-02 [Error - Fallback ante Fallo de Carga de Imagen]:** Dado que se suministra una ruta o URL de imagen para el logo y esta falla al cargarse (`onError` en `<img>`), cuando el componente detecta el error, entonces:
  - Se muestra de manera elegante el nombre de la plataforma y el isotipo SVG vectorizado de respaldo en su lugar.
  - El enlace hacia la página de inicio permanece completamente funcional e interactivo.
* **AC-KAN-12-03 [Edge - Dynamic Theming y Contraste (RNF-05, RNF-08)]:** Dado que el tema visual del sistema cambia entre modo claro y modo oscuro, cuando el logo y branding se renderizan, entonces:
  - Emplean tokens semánticos de Tailwind v4 (`bg-primary`, `text-primary-foreground`, `text-foreground`, `hover:opacity-85`).
  - Mantienen una relación de contraste mínima de 4.5:1 exigida por WCAG AA sobre fondos claros u oscuros.

---

### 3. Matriz de Fronteras de Equipo

| Recurso / Módulo | Estado | Permiso |
|---|---|---|
| `docs/specs/2026-10-12-US-12-logo-empresa-navegacion.md` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/layout/components/LandingNavbar/LandingNavbarBranding/LandingNavbarBranding.tsx` | Modificación | **Permitido (Creador)** |
| `src/modules/landing/layout/components/LandingNavbar/LandingNavbarBranding/types.ts` | Modificación | **Permitido (Creador)** |
| `src/modules/landing/layout/models/landingNavbar.model.ts` | Extensión | **Permitido (Creador)** |
| `src/modules/landing/layout/hooks/useLandingNavbarViewModel.ts` | Extensión | **Permitido (Creador)** |
| `src/modules/landing/layout/constants/landingNavbar.constants.ts` | Extensión | **Permitido (Creador)** |
| `src/modules/landing/layout/tests/LandingNavbar.page.ts` | Extensión | **Permitido (Creador)** |
| `src/modules/landing/layout/tests/LandingNavbar.test.tsx` | Extensión | **Permitido (Creador)** |
| `src/components/common/**` | Átomos UI (`Image`, etc.) | **Solo Lectura / Consumo** |
| Otros módulos (`src/modules/business/**`, etc.) | Módulos externos | **PROHIBIDO MODIFICAR** |

---

### 4. Decisiones de Arquitectura y Contratos de Datos (MVVM)

#### 4.1. Contrato del Branding (`LandingNavbarBrandingProps`)
```typescript
export interface LandingNavbarBrandingProps {
  readonly brandName: string;
  readonly logoAlt: string;
  readonly logoUrl?: string;
}
```

#### 4.2. Contrato del ViewModel (`LandingNavbarViewModel`)
```typescript
export interface LandingNavbarViewModel {
  readonly brandName: string;
  readonly closeMobileMenu: () => void;
  readonly handleNavigate: (targetPath: string) => void;
  readonly isMobileMenuOpen: boolean;
  readonly isSignedIn: boolean;
  readonly logoAlt: string;
  readonly logoUrl?: string;
  readonly navLinks: readonly NavbarNavLink[];
  readonly portalActionLabel: string;
  readonly portalActionPath: string;
  readonly toggleMobileMenu: () => void;
}
```

#### 4.3. Constantes Técnicas (`landingNavbar.constants.ts`)
```typescript
export const LANDING_NAVBAR_CONSTANTS = Object.freeze({
  BRAND_NAME: "Booking System",
  ESCAPE_KEY: "Escape",
  LOGO_CONTAINER_ID: "landing-navbar-branding-logo",
  MOBILE_MENU_ID: "landing-navbar-mobile-menu",
  NAVBAR_LANDMARK_LABEL_KEY: "home.navbar.landmarkLabel",
});
```

---

### 5. Trazabilidad de Pruebas Automatizadas

| Criterio | Tipo | Archivo de Prueba | Estrategia |
|---|---|---|---|
| **AC-KAN-12-01** | Happy Path | `LandingNavbar.test.tsx` | Verifica que el logo se renderice con texto alternativo accesible y enlace funcional a `/`. |
| **AC-KAN-12-02** | Error / Fallback | `LandingNavbar.test.tsx` | Simula error de carga de imagen (`fireEvent.error`) y valida fallback tipográfico/vectorial y funcionalidad del enlace. |
| **AC-KAN-12-03** | Dynamic Theming | `LandingNavbar.test.tsx` | Valida aplicación de tokens semánticos dinámicos para garantizar contraste en light y dark mode. |
