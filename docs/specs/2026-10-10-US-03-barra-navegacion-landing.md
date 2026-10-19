# Software Design Document (SDD) — US-03 (KAN-3)
## Barra de Navegación con Opción de Inicio de Sesión (Sign In) en Landing

| Metadato | Valor |
|---|---|
| **Historia de Usuario** | US-03 / KAN-3 ("Como visitante quiero visualizar una barra de navegación con la opción de inicio de sesión (Sign In) para acceder rápidamente al sistema") |
| **Épica** | KAN-1 (Home / Landing Page) |
| **Portal** | Landing (`src/modules/landing/layout`) |
| **Fecha de Especificación** | 2026-10-10 |
| **Estado** | Aprobada para Implementación |
| **Requerimientos Relacionados** | RF-01 (Landing Page), RF-02 (Acceso al sistema), RNF-01 (Rendimiento), RNF-04 (Usabilidad), RNF-05 (Tema Dinámico), RNF-08 (Accesibilidad WCAG AA) |

---

### 1. Resumen y Propósito

Proveer una barra de navegación superior accesible, moderna y responsiva (`LandingNavbar`) en el portal público de la plataforma. La barra permite a los visitantes orientarse rápidamente dentro del sitio, acceder a las secciones clave de la plataforma (como planes y contacto), y ofrece una llamada a la acción clara para iniciar sesión (`Sign In`) en el sistema.

Asimismo, si el usuario ya cuenta con una sesión autenticada activa (suscriptor, colaborador, cliente o super admin), la barra de navegación se adapta de forma contextual ofreciendo un acceso directo hacia su portal de gestión correspondiente ("Ir a mi panel"), en conformidad con la asunción arquitectónica AS-2.

---

### 2. Criterios de Aceptación Medibles

* **AC-KAN-3-01 [Happy Path - Estructura y Enlaces]:** Dado que un visitante carga cualquier página del portal landing, se renderiza la barra de navegación en la parte superior conteniendo:
  - El logotipo y nombre de la marca (`Booking System`) con texto alternativo accesible y enlace a la raíz (`/`) (KAN-12).
  - Enlaces de navegación rápida hacia secciones de la página principal (`#plans-section`) y páginas del portal (`/contact`).
  - Botón de llamada a la acción de inicio de sesión rotulado mediante `landing:home.navbar.signIn`.
* **AC-KAN-3-02 [Navegación a Sign In]:** Dado que el visitante activa el botón de inicio de sesión (`Sign In`), la aplicación navega fluidamente a la ruta de inicio de sesión `/sign-in` (`ROUTE_PATH.AUTH.SIGN_IN`).
* **AC-KAN-3-03 [Manejo de Errores y Resiliencia]:** La navegación hacia las rutas o secciones ancladas se maneja de forma controlada sin producir excepciones en consola ni romper el estado de la página.
* **AC-KAN-3-04 [Adaptabilidad por Rol y Sesión Activa (AS-2)]:** Dado que un usuario ya ha iniciado sesión en el sistema (`status === "signed_in"`):
  - El botón "Iniciar sesión" es reemplazado por la acción contextual `landing:home.navbar.goToPortal`.
  - Al activarlo, navega a la raíz del portal asignado según su rol: `/business` para suscriptores y colaboradores, `/admin` para super administradores, o el portal de cliente.
* **AC-KAN-3-05 [Menú Responsivo y Accesibilidad Móvil (WCAG 2.5.5)]:** En pantallas móviles o viewports estrechos (< 768 px y hasta 360 px):
  - Los enlaces colapsan en un botón de menú accesible tipo hamburguesa con etiqueta `aria-label` y atributo `aria-expanded`.
  - Al accionarse con teclado (`Enter`, `Espacio`) o puntero, despliega el menú móvil con los enlaces y la acción de inicio de sesión.
  - El menú se puede cerrar con la tecla `Escape` o al seleccionar una opción de navegación, manteniendo objetivos táctiles mínimos de 44x44 px.
* **AC-KAN-3-06 [Tokens Semánticos y Modo Claro/Oscuro (RNF-05)]:** La barra de navegación utiliza variables semánticas (`bg-background/80`, `backdrop-blur-md`, `border-border`, `text-foreground`, `text-muted-foreground`), garantizando contraste WCAG AA tanto en tema claro como en tema oscuro.
* **AC-KAN-12-01 [Logo de la Empresa]:** El logo corporativo se renderiza con el texto alternativo `landing:home.navbar.logoAlt` y enlace funcional hacia la página principal.

---

### 3. Matriz de Fronteras de Equipo

Para preservar estrictamente el trabajo colaborativo y prevenir colisiones en Git:

| Recurso / Módulo | Estado | Permiso |
|---|---|---|
| `docs/specs/2026-10-10-US-03-barra-navegacion-landing.md` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/layout/components/LandingNavbar/**` | Nuevo componente | **Permitido (Creador)** |
| `src/modules/landing/layout/hooks/useLandingNavbarViewModel.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/layout/constants/landingNavbar.constants.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/layout/models/landingNavbar.model.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/layout/tests/LandingNavbar.test.tsx` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/layout/tests/LandingNavbar.page.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/layout/LandingLayout.tsx` | Integración | **Permitido (Reemplaza header temporal)** |
| `src/i18n/locales/{es,en}/landing.json` | Extensión bajo `home.navbar.*` | **Permitido (Aditivo sin sobrescribir)** |
| `src/components/common/**` | Componentes atómicos comunes (`Button`, `AppLink`, etc.) | **Solo Lectura / Consumo** |
| `src/modules/business/**`, `src/modules/customer/**`, `src/modules/admin/**` | Módulos ajenos | **PROHIBIDO MODIFICAR** |

---

### 4. Decisiones de Arquitectura y Contratos de Datos (MVVM)

#### 4.1. Contrato del ViewModel (`landingNavbar.model.ts`)
```typescript
export interface NavbarNavLink {
  readonly href: string;
  readonly isExternal?: boolean;
  readonly label: string;
}

export interface LandingNavbarViewModel {
  readonly brandName: string;
  readonly isMobileMenuOpen: boolean;
  readonly isSignedIn: boolean;
  readonly logoAlt: string;
  readonly navLinks: readonly NavbarNavLink[];
  readonly portalActionLabel: string;
  readonly portalActionPath: string;
  readonly closeMobileMenu: () => void;
  readonly toggleMobileMenu: () => void;
  readonly handleNavigate: (path: string) => void;
}
```

#### 4.2. Constantes Técnicas (`landingNavbar.constants.ts`)
Ordenadas alfabéticamente A-Z e inmutables mediante `Object.freeze`:
```typescript
export const LANDING_NAVBAR_CONSTANTS = Object.freeze({
  MOBILE_MENU_ID: "landing-mobile-menu",
  NAVBAR_LANDMARK_LABEL: "Barra de navegación principal",
  Z_INDEX_CLASS: "sticky top-0 z-50",
} as const);
```

#### 4.3. Cadena de Internacionalización (`landing.json`)
```json
"navbar": {
  "goToPortal": "Ir a mi panel",
  "landmarkLabel": "Navegación principal de Booking System",
  "links": {
    "contact": "Contacto",
    "home": "Inicio",
    "plans": "Planes"
  },
  "logoAlt": "Logo de Booking System",
  "menuClose": "Cerrar menú principal",
  "menuOpen": "Abrir menú principal",
  "signIn": "Iniciar sesión"
}
```

---

### 5. Trazabilidad de Pruebas

| Criterio | Tipo | Archivo de Prueba | Validación |
|---|---|---|---|
| `AC-KAN-3-01` | Happy Path | `LandingNavbar.test.tsx` | Renderizado de logo, enlaces y botón de Sign In |
| `AC-KAN-3-02` | Navegación | `LandingNavbar.test.tsx` | Activación de Sign In redirige a `/sign-in` |
| `AC-KAN-3-03` | Resiliencia | `LandingNavbar.test.tsx` | Navegación segura sin excepciones |
| `AC-KAN-3-04` | Contexto / Rol | `LandingNavbar.test.tsx` | Usuario autenticado ve "Ir a mi panel" con ruta de su rol |
| `AC-KAN-3-05` | Responsivo | `LandingNavbar.test.tsx` | Toggle de menú hamburguesa accesible con teclado y foco |
| `AC-KAN-3-06` | Tokens | `LandingNavbar.test.tsx` | Clases semánticas con soporte dark/light mode |
| `AC-KAN-12-01` | Branding | `LandingNavbar.test.tsx` | Logo con texto alternativo y enlace a home |
