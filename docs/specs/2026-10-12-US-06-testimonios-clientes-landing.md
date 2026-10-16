# Software Design Document (SDD) — US-06 (KAN-6)
## Sección de Testimonios de Clientes en la Página Principal

| Metadato | Valor |
|---|---|
| **Historia de Usuario** | US-06 / KAN-6 ("Como visitante quiero leer testimonios de otros clientes para conocer sus experiencias y evaluar la confiabilidad de la plataforma") |
| **Épica** | KAN-1 ([Landing] Home) |
| **Portal** | Landing (`src/modules/landing/features/home`) |
| **Fecha de Especificación** | 2026-10-12 |
| **Estado** | Aprobada para Implementación |
| **Requerimientos Relacionados** | RF-01 (Landing Page), RNF-01 (Rendimiento), RNF-04 (Usabilidad), RNF-05 (Tema Dinámico), RNF-08 (Accesibilidad WCAG AA) |

---

### 1. Resumen y Propósito

Proveer en la página de inicio una sección destacada y visualmente atractiva de testimonios de clientes (`TestimonialsSection`). La sección presenta experiencias reales de dueños de negocios y profesionales que usan la plataforma (barberías, salones de belleza, centros médicos y spas), aportando prueba social, credibilidad y confiabilidad para incentivar la conversión de nuevos suscriptores.

Los testimonios son estáticos y multilenguaje (AS-4), presentados mediante tarjetas de diseño limpio (`TestimonialCard`), garantizando una experiencia de lectura accesible y consistente en cualquier dispositivo.

---

### 2. Criterios de Aceptación Medibles

* **AC-KAN-6-01 [Happy Path - Visualización de Testimonios]:** Dado que existen testimonios disponibles en el contenido de la landing, cuando el visitante llega a la sección correspondiente, se renderizan:
  - La insignia superior (`badge`), el título de la sección (`title`) y un subtítulo explicativo (`subtitle`).
  - Una cuadrícula responsiva con tarjetas de testimonios (`TestimonialCard`), donde cada una incluye la cita textual (`quote`), el nombre del autor (`authorName`), el nombre del negocio o especialidad (`businessName`) y la calificación visual de satisfacción (`rating`).
* **AC-KAN-6-02 [Resiliencia / Error - Testimonio sin Contenido Válido]:** Dado que un testimonio específico no contiene cita (`quote`) o está vacío en el idioma activo, el ViewModel filtra dicho elemento y la sección omite esa tarjeta, evitando mostrar contenido roto o incompleto.
* **AC-KAN-6-03 [Edge - Lista Vacía de Testimonios]:** Dado que no existen testimonios disponibles o todos resultan inválidos, la sección completa no se renderiza en la página principal, preservando la limpieza del diseño.
* **AC-KAN-6-04 [Accesibilidad WCAG AA y Responsive]:**
  - La sección utiliza semántica accesible con `<section aria-labelledby="testimonials-heading">`.
  - En pantallas móviles estrechas (360 px), las tarjetas se apilan verticalmente sin provocar desbordamiento horizontal.
  - La apariencia visual respeta los tokens semánticos de Tailwind v4 (`bg-card`, `border-border`, `text-card-foreground`, `text-muted-foreground`), garantizando legibilidad y contraste WCAG AA en tema claro y oscuro (RNF-05).

---

### 3. Matriz de Fronteras de Equipo

| Recurso / Módulo | Estado | Permiso |
|---|---|---|
| `docs/specs/2026-10-12-US-06-testimonios-clientes-landing.md` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/components/TestimonialsSection.tsx` | Nuevo componente | **Permitido (Creador)** |
| `src/modules/landing/features/home/components/TestimonialsSection.types.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/components/TestimonialCard.tsx` | Nuevo componente | **Permitido (Creador)** |
| `src/modules/landing/features/home/components/TestimonialCard.types.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/constants/Testimonials.constants.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/models/TestimonialsViewModel.interface.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/hooks/useTestimonialsViewModel.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/tests/TestimonialsSection.page.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/tests/TestimonialsSection.test.tsx` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/tests/useTestimonialsViewModel.test.tsx` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/index.ts` | Exportación barrel | **Permitido (Aditivo)** |
| `src/modules/landing/placeholder/LandingPlaceholderPage.tsx` | Inclusión de sección | **Permitido (Aditivo)** |
| `src/i18n/locales/{es,en}/landing.json` | Claves bajo `home.testimonials.*` | **Permitido (Aditivo)** |
| `src/components/common/**` | Átomos UI (`Card`, `Badge`) | **Solo Lectura / Consumo** |
| Otros módulos (`src/modules/business/**`, etc.) | Módulos externos | **PROHIBIDO MODIFICAR** |

---

### 4. Decisiones de Arquitectura y Contratos de Datos (MVVM)

#### 4.1. Contrato del ViewModel (`TestimonialsViewModel.interface.ts`)
```typescript
export interface TestimonialItem {
  readonly authorName: string;
  readonly businessName: string;
  readonly id: string;
  readonly quote: string;
  readonly rating: number;
}

export interface TestimonialsViewModel {
  readonly badge: string;
  readonly hasTestimonials: boolean;
  readonly subtitle: string;
  readonly testimonials: readonly TestimonialItem[];
  readonly title: string;
}
```

#### 4.2. Constantes Técnicas (`Testimonials.constants.ts`)
Ordenadas alfabéticamente A-Z e inmutables mediante `Object.freeze`:
```typescript
export const TESTIMONIALS_CONSTANTS = Object.freeze({
  BADGE_KEY: "home.testimonials.badge",
  CONTAINER_SECTION_ID: "testimonials-section",
  DEFAULT_MAX_RATING: 5,
  HEADING_ID: "testimonials-heading",
  SUBTITLE_KEY: "home.testimonials.subtitle",
  TITLE_KEY: "home.testimonials.title",
} as const);
```

---

### 5. Trazabilidad de Pruebas Automatizadas

| Criterio | Tipo | Archivo de Prueba | Estrategia |
|---|---|---|---|
| **AC-KAN-6-01** | Happy Path | `TestimonialsSection.test.tsx` | Valida renderizado de cabecera (badge, título, subtítulo) y tarjetas de testimonios con autor, negocio y cita. |
| **AC-KAN-6-02** | Error/Resiliencia | `TestimonialsSection.test.tsx` | Verifica que elementos con cita vacía sean descartados automáticamente. |
| **AC-KAN-6-03** | Edge | `TestimonialsSection.test.tsx` | Verifica que si no hay testimonios válidos, la sección no se renderiza en el DOM. |
| **AC-KAN-6-04** | Accesibilidad/Edge | `TestimonialsSection.test.tsx` | Comprueba atributos `aria-labelledby`, semántica de encabezados y tokens de contraste. |
| **Unit VM** | Unitario | `useTestimonialsViewModel.test.tsx` | Valida filtrado de testimonios y mapeo de textos i18n. |
