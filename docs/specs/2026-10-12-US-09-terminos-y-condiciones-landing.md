# Software Design Document (SDD) — US-09 (KAN-9)
## Acceso a Términos y Condiciones en el Portal Landing

| Metadato | Valor |
|---|---|
| **Historia de Usuario** | US-09 / KAN-9 ("Como visitante quiero acceder a los términos y condiciones para comprender las políticas legales de la plataforma") |
| **Épica** | KAN-1 ([Landing] Home) |
| **Portal** | Landing (`src/modules/landing/features/terms`) |
| **Fecha de Especificación** | 2026-10-12 |
| **Estado** | Aprobada para Implementación |
| **Requerimientos Relacionados** | RF-01 (Landing Page), RNF-01 (Rendimiento), RNF-04 (Usabilidad), RNF-05 (Tema Dinámico), RNF-08 (Accesibilidad WCAG AA) |

---

### 1. Resumen y Propósito

Proveer en el portal público de la plataforma una página dedicada, legible y accesible para la consulta de los Términos y Condiciones de Uso (`TermsPage`) bajo la ruta `/terms`. Esta vista permite a cualquier visitante, potencial suscriptor o cliente final conocer de manera transparente los derechos, obligaciones, políticas de reservas, suscripciones y responsabilidades vinculadas a los servicios ofrecidos por Booking System.

La página se integra de forma canónica en la jerarquía del `LandingLayout` (manteniendo la barra de navegación superior y el pie de página), ofrece un enlace accesible para retornar a la página de inicio y se adapta responsivamente tanto a dispositivos móviles como a los modos claro y oscuro del sistema.

---

### 2. Criterios de Aceptación Medibles

* **AC-KAN-9-01 [Happy Path - Visualización de Términos y Condiciones]:** Dado que un visitante navega a `/terms` (directamente desde la URL o mediante el enlace del pie de página), cuando se carga la página, entonces se visualiza:
  - El título principal de la página (`title`).
  - La fecha de última actualización formateada (`lastUpdated`).
  - Una llamada a la acción de retorno a la página de inicio (`backToHome`).
  - Las cláusulas y secciones legales estructuradas mediante encabezados semánticos (`sections`).
* **AC-KAN-9-02 [Happy Path - Retorno a Inicio]:** Dado que el visitante activa el botón "Volver al inicio", la aplicación navega fluidamente a la ruta raíz `/` (`ROUTE_PATH.LANDING.HOME`) sin recargas de página.
* **AC-KAN-9-03 [Edge - Acceso Público Libre de Autenticación]:** Dado que el visitante accede directamente a `/terms` sin contar con una sesión activa, la página se renderiza completamente sin emitir alertas ni forzar redirecciones hacia `/sign-in`.
* **AC-KAN-9-04 [Accesibilidad WCAG AA y Dynamic Theming (RNF-05, RNF-08)]:**
  - Uso de encabezados semánticos jerárquicos (`<h1>`, `<h2>`).
  - Uso exclusivo de tokens semánticos de Tailwind v4 (`bg-card`, `text-card-foreground`, `text-muted-foreground`, `border-border`).
  - Diseño adaptable sin desbordamiento horizontal en pantallas estrechas (360 px).

---

### 3. Matriz de Fronteras de Equipo

| Recurso / Módulo | Estado | Permiso |
|---|---|---|
| `docs/specs/2026-10-12-US-09-terminos-y-condiciones-landing.md` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/terms/TermsPage.tsx` | Nuevo componente | **Permitido (Creador)** |
| `src/modules/landing/features/terms/TermsPage.types.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/terms/components/TermsSectionCard.tsx` | Nuevo componente | **Permitido (Creador)** |
| `src/modules/landing/features/terms/components/TermsSectionCard.types.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/terms/constants/Terms.constants.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/terms/models/TermsViewModel.interface.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/terms/hooks/useTermsViewModel.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/terms/tests/TermsPage.page.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/terms/tests/TermsPage.test.tsx` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/terms/tests/useTermsViewModel.test.tsx` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/terms/index.ts` | Exportación barrel | **Permitido (Creador)** |
| `src/modules/landing/landing.routes.tsx` | Registro de ruta `/terms` | **Permitido (Aditivo)** |
| `src/i18n/locales/{es,en}/landing.json` | Claves bajo `terms.*` | **Permitido (Aditivo)** |
| `src/components/common/**` | Átomos UI (`Button`, `Card`, `Badge`) | **Solo Lectura / Consumo** |
| Otros módulos (`src/modules/business/**`, etc.) | Módulos externos | **PROHIBIDO MODIFICAR** |

---

### 4. Decisiones de Arquitectura y Contratos de Datos (MVVM)

#### 4.1. Contrato del ViewModel (`TermsViewModel.interface.ts`)
```typescript
export interface TermsLegalClause {
  readonly body: string;
  readonly id: string;
  readonly title: string;
}

export interface TermsViewModel {
  readonly backToHomeLabel: string;
  readonly clauses: readonly TermsLegalClause[];
  readonly lastUpdated: string;
  readonly title: string;
  readonly handleBackToHome: () => void;
}
```

#### 4.2. Constantes Técnicas (`Terms.constants.ts`)
Ordenadas alfabéticamente A-Z e inmutables mediante `Object.freeze`:
```typescript
export const TERMS_CONSTANTS = Object.freeze({
  BACK_TO_HOME_KEY: "terms.backToHome",
  CLAUSES: Object.freeze([
    Object.freeze({
      BODY_KEY: "terms.clauses.acceptance.body",
      ID: "acceptance",
      TITLE_KEY: "terms.clauses.acceptance.title",
    }),
    Object.freeze({
      BODY_KEY: "terms.clauses.services.body",
      ID: "services",
      TITLE_KEY: "terms.clauses.services.title",
    }),
    Object.freeze({
      BODY_KEY: "terms.clauses.subscriptions.body",
      ID: "subscriptions",
      TITLE_KEY: "terms.clauses.subscriptions.title",
    }),
    Object.freeze({
      BODY_KEY: "terms.clauses.cancellations.body",
      ID: "cancellations",
      TITLE_KEY: "terms.clauses.cancellations.title",
    }),
    Object.freeze({
      BODY_KEY: "terms.clauses.liability.body",
      ID: "liability",
      TITLE_KEY: "terms.clauses.liability.title",
    }),
  ]),
  CONTAINER_ID: "terms-page-container",
  HEADING_ID: "terms-heading",
  LAST_UPDATED_KEY: "terms.lastUpdated",
  TITLE_KEY: "terms.title",
} as const);
```

---

### 5. Trazabilidad de Pruebas Automatizadas

| Criterio | Tipo | Archivo de Prueba | Estrategia |
|---|---|---|---|
| **AC-KAN-9-01** | Happy Path | `TermsPage.test.tsx` | Verifica que se renderice el título, fecha de actualización, cláusulas legales y botón de retorno. |
| **AC-KAN-9-02** | Happy Path | `TermsPage.test.tsx` | Simula clic en el botón de retorno y verifica navegación a `/`. |
| **AC-KAN-9-03** | Edge | `TermsPage.test.tsx` | Verifica renderizado sin autenticación (sesión `signed_out`). |
| **AC-KAN-9-04** | Accesibilidad/Theming | `TermsPage.test.tsx` | Verifica presencia de `<main>`, `<h1>`, `<h2>` y clases de tokens semánticos. |
| **Unit VM** | Unitario | `useTermsViewModel.test.tsx` | Valida traducción de cláusulas y callback `handleBackToHome`. |
