# Software Design Document (SDD) — US-02 (KAN-2)
## Sección Principal Destacada (Hero Section) en la Página Principal

| Metadato | Valor |
|---|---|
| **Historia de Usuario** | US-02 / KAN-2 ("Como visitante quiero ver una sección principal destacada (Hero Section) con un llamado a la acción (CTA) para iniciar el proceso de contratación") |
| **Épica** | KAN-1 (Home / Landing Page) |
| **Portal** | Landing (`src/modules/landing/`) |
| **Fecha de Especificación** | 2026-10-05 |
| **Estado** | Aprobada para Implementación |
| **Requerimientos Relacionados** | RF-01 (Página principal y presentación de servicio), RNF-01 (Rendimiento), RNF-02 (Seguridad), RNF-04 (Usabilidad), RNF-05 (Tema Dinámico), RNF-08 (Accesibilidad WCAG AA) |

---

### 1. Resumen y Propósito

Ofrecer a los visitantes del portal público (dueños de negocios y profesionales que evalúan la plataforma de reservas) una sección de apertura visualmente impactante, clara y atractiva que comunique de inmediato la propuesta de valor central del producto SaaS.

La sección incorpora un título de alto nivel editorial, un subtítulo descriptivo persuasivo, un distintivo de marca y una llamada a la acción (CTA) destacada que conduce al usuario de forma accesible y fluida hacia el catálogo de planes de suscripción (KAN-7), facilitando el inicio del proceso de contratación de acuerdo con la decisión arquitectónica Q7.

---

### 2. Criterios de Aceptación Medibles

* **AC-KAN-2-01 [Happy Path - Contenido y Presentación]:** Dado que un visitante ingresa a la página principal del portal público, cuando la vista carga, entonces se presenta la sección Hero como el bloque destacado principal con un distintivo visual (`landing:home.hero.badge`), un título editorial destacado (`landing:home.hero.title`), una descripción clara de la propuesta de valor (`landing:home.hero.tagline`) y un botón de llamada a la acción (`landing:home.hero.ctaAction`).
* **AC-KAN-2-02 [Navegación / Desplazamiento Accesible]:** Dado que se muestra la sección Hero, cuando el visitante activa el botón de llamada a la acción, entonces la página realiza un desplazamiento suave (`smooth scroll`) hacia la sección de planes de suscripción (`#plans-section`) y transfiere el foco programático al encabezado correspondiente (`#plans-heading`) para soporte total de tecnologías de asistencia.
* **AC-KAN-2-03 [Manejo de Errores / Resiliencia de Enlace]:** Dado que el elemento objetivo `#plans-section` no se encuentre disponible temporalmente en el árbol DOM del navegador, cuando el visitante activa la llamada a la acción, la interacción no arroja excepciones en consola y navega de forma segura a través de fallback por hash de URL.
* **AC-KAN-2-04 [Diseño Responsivo (Mobile First - 360px a Desktop 4K)]:** Dado cualquier tamaño de viewport desde 360 px de ancho, cuando el Hero se renderiza, los textos y el botón de acción se organizan fluidamente sin provocar desbordamiento horizontal (`overflow-x`), garantizando un objetivo táctil de interacción mínimo de 44x44 px (WCAG 2.5.5).
* **AC-KAN-2-05 [Accesibilidad y Operabilidad por Teclado]:** El botón de llamada a la acción debe ser plenamente accionable vía teclado (`Tab`, `Enter`, `Espacio`), con un indicador de foco visible conforme al anillo de diseño del sistema (`ring-ring`) y cumpliendo el ratio de contraste WCAG AA en modo claro y modo oscuro.
* **AC-KAN-2-06 [Tokens Semánticos y Tipografía Oficial]:** La sección debe aplicar estrictamente los tokens del sistema de diseño del proyecto (`bg-background`, `text-foreground`, `text-muted-foreground`), la tipografía serif editorial **Newsreader** en el encabezado principal `h1`, tipografía **Plus Jakarta Sans** en textos secundarios y el color primario Terracota (`#C86D51`) en la llamada a la acción principal.

---

### 3. Matriz de Fronteras de Equipo

Para preservar estrictamente el trabajo colaborativo y prevenir colisiones en Git:

| Recurso / Módulo | Estado | Permiso |
|---|---|---|
| `docs/specs/2026-10-05-US-02-seccion-hero-landing.md` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/components/HeroSection.tsx` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/hooks/useHeroSectionViewModel.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/constants/HeroSection.constants.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/models/HeroSectionViewModel.interface.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/tests/HeroSection.test.tsx` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/tests/HeroSection.page.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/i18n/locales/{es,en}/landing.json` | Extensión bajo `home.hero.*` | **Permitido (Aditivo sin sobrescribir)** |
| `src/modules/landing/placeholder/LandingPlaceholderPage.tsx` | Montaje de integración | **Permitido (Integración)** |
| `src/components/common/**` | Componentes atómicos comunes (`Button`, `Badge`, etc.) | **Solo Lectura / Consumo** |
| `src/modules/business/**` | Módulo Dueño de Negocio (trabajo de otros compañeros) | **PROHIBIDO MODIFICAR** |
| `src/modules/customer/**` | Módulo Cliente Final (trabajo de otros compañeros) | **PROHIBIDO MODIFICAR** |
| `src/modules/admin/**` | Módulo Super Admin (trabajo de otros compañeros) | **PROHIBIDO MODIFICAR** |
| `src/modules/auth/**` | Módulo compartido de Auth (trabajo de otros compañeros) | **PROHIBIDO MODIFICAR** |

---

### 4. Decisiones de Arquitectura y Contratos de Datos (MVVM)

#### 4.1. Contrato del ViewModel (`HeroSectionViewModel.interface.ts`)
```typescript
/**
 * View model contract for the Hero section in the public landing portal.
 */
export interface HeroSectionViewModel {
  /** Localized badge text displayed above the main heading. */
  readonly badgeLabel: string;
  /** Localized primary headline text. */
  readonly title: string;
  /** Localized tagline / value proposition description. */
  readonly tagline: string;
  /** Localized label for the call to action button. */
  readonly ctaLabel: string;
  /** Accessible callback to scroll smoothly to the plans section. */
  readonly handleCtaClick: () => void;
}
```

#### 4.2. Constantes Técnicas (`HeroSection.constants.ts`)
Ordenadas alfabéticamente A-Z e inmutables mediante `Object.freeze`:
```typescript
export const HERO_SECTION_CONSTANTS = Object.freeze({
  SCROLL_BEHAVIOR: "smooth",
  TARGET_HEADING_ID: "plans-heading",
  TARGET_SECTION_ID: "plans-section",
} as const);
```

#### 4.3. Cadena de Internacionalización (`landing.json`)
```json
"hero": {
  "badge": "Gestión de citas y reservas para profesionales",
  "ctaAction": "Explorar planes",
  "tagline": "Simplifica la agenda de tu negocio, automatiza tus recordatorios y permite que tus clientes reserven en línea 24/7 sin complicaciones.",
  "title": "Impulsa tu negocio con reservas inteligentes y sin esfuerzo"
}
```

---

### 5. Trazabilidad de Pruebas

| Criterio | Tipo | Archivo de Prueba | Validación |
|---|---|---|---|
| `AC-KAN-2-01` | Happy Path | `HeroSection.test.tsx` | Renderizado del badge, headline H1, tagline y CTA |
| `AC-KAN-2-02` | Interacción | `HeroSection.test.tsx` | Ejecución de `scrollIntoView` y foco en `#plans-heading` al activar CTA |
| `AC-KAN-2-03` | Resiliencia | `HeroSection.test.tsx` | Manejo seguro sin fallos si el elemento no existe en el DOM |
| `AC-KAN-2-04` | Responsivo | `HeroSection.test.tsx` / `e2e` | Estructura flexible y tamaño mínimo de botón para pantallas móviles |
| `AC-KAN-2-05` | Accesibilidad | `HeroSection.test.tsx` | Operabilidad por teclado con tecla Enter y Espacio |
| `AC-KAN-2-06` | Tokens | `HeroSection.test.tsx` | Clases semánticas de tema (`text-foreground`, `font-headline`, `btn-primary`) |
