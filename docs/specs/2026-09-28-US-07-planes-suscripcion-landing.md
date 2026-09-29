# Software Design Document (SDD) — US-07 (KAN-7)
## Catálogo de Planes de Suscripción en la Página Principal

| Metadato | Valor |
|---|---|
| **Historia de Usuario** | US-07 / KAN-7 ("Como visitante quiero ver los planes de suscripción disponibles desde la página principal para conocer los precios y beneficios") |
| **Épica** | KAN-1 (Home / Landing Page) |
| **Portal** | Landing (`src/portals/landing/`) |
| **Fecha de Especificación** | 2026-09-28 |
| **Estado** | Aprobada para Implementación |
| **Requerimientos Relacionados** | RF-06 (Consulta de planes de suscripción), RNF-01, RNF-02, RNF-04, RNF-05, RNF-08 |

---

### 1. Resumen y Propósito
Permitir a los visitantes del portal público (dueños de negocios interesados que exploran la plataforma) visualizar de forma clara, accesible y atractiva los planes de suscripción activos (`Plan`), con sus respectivos precios, periodicidad de cobro, beneficios incluidos y límites principales.

---

### 2. Criterios de Aceptación Medibles

* **AC-KAN-7-01 [Happy Path]:** Dado que existen planes con estado `active` en la base de datos, cuando el visitante carga la sección de planes en la página principal, entonces se muestra una tarjeta por cada plan activo con su nombre comercial, precio formateado según la divisa y el locale activo (`Intl.NumberFormat`), período de facturación (`monthly` / `annual`), límite de reservas y lista de características, ordenados ascendentemente por precio (`priceInCents`).
* **AC-KAN-7-02 [Navegación / Interacción]:** Dado que se muestra una tarjeta de plan, cuando el visitante activa el botón de llamada a la acción ("Comenzar" o "Ver detalles"), se ejecuta la acción de navegación/callback correspondiente sin fallos.
* **AC-KAN-7-03 [Manejo de Errores]:** Dado un fallo de red o error al consultar Firestore, cuando la sección intenta cargar los planes, se renderiza el componente `ErrorState` con mensaje accesible y un botón de reintento (`retry`) que reejecuta la consulta sin romper la página ni la experiencia del usuario.
* **AC-KAN-7-04 [Filtrado de Inactivos]:** Dado que existen planes con estado `inactive`, cuando la sección se renderiza, ningún plan inactivo es visible para el visitante.
* **AC-KAN-7-05 [Estado Vacío]:** Dado que no existen planes activos en la plataforma, cuando la sección se renderiza, se muestra un `EmptyState` comunicando amigablemente que no hay planes disponibles en este momento.
* **AC-KAN-7-06 [Feedback de Carga (Skeletons)]:** Mientras la consulta de datos está en progreso, la sección renderiza tarjetas esqueleto (`PlanCatalogSkeleton`) con dimensiones proporcionales a las tarjetas finales para mitigar cambios bruscos de diseño (Cumulative Layout Shift - CLS).
* **AC-KAN-7-07 [Accesibilidad y Tema]:** Las tarjetas y controles deben ser completamente navegables por teclado, con contrastes conformes a WCAG AA en modo claro y modo oscuro, respetando las variables semánticas de `src/styles/tokens.css`.

---

### 3. Matriz de Fronteras de Equipo

Para preservar estrictamente el trabajo colaborativo y evitar colisiones de Git:

| Recurso / Módulo | Estado | Permiso |
|---|---|---|
| `docs/specs/2026-09-28-US-07-planes-suscripcion-landing.md` | Nuevo archivo | **Permitido (Creador)** |
| `src/portals/landing/features/home/` | Módulo propio de la US | **Permitido (Creador)** |
| `src/i18n/locales/{es,en}/landing.json` | Extensión de claves bajo `home.plans.*` | **Permitido (Aditivo sin sobrescribir)** |
| `src/portals/landing/placeholder/LandingPlaceholderPage.tsx` | Montaje de la sección | **Permitido (Integración)** |
| `src/shared/components/**` | Componentes atómicos base (`Button`, `Card`, `Spinner`, etc.) | **Solo Lectura / Consumo (No modificar)** |
| `src/portals/business/**` | Módulo Dueño de Negocio (trabajo de otros compañeros) | **PROHIBIDO MODIFICAR** |
| `src/portals/customer/**` | Módulo Cliente Final (trabajo de otros compañeros) | **PROHIBIDO MODIFICAR** |
| `src/portals/admin/**` | Módulo Super Admin (trabajo de otros compañeros) | **PROHIBIDO MODIFICAR** |
| `src/features/auth/**` | Módulo compartido de Auth (trabajo de otros compañeros) | **PROHIBIDO MODIFICAR** |

---

### 4. Decisiones de Arquitectura y Contratos de Datos (MVVM)

#### 4.1. Contrato de Datos del Dominio
```typescript
export interface PlanLimits {
  readonly maxBookings: number;
}

export type BillingPeriod = "monthly" | "annual";

export interface Plan {
  readonly id: string;
  readonly name: string;
  readonly priceInCents: number;
  readonly billingPeriod: BillingPeriod;
  readonly features: readonly string[];
  readonly limits: PlanLimits;
  readonly status: "active" | "inactive";
}
```

#### 4.2. Contrato de la Vista (ViewModel)
```typescript
export interface FormattedPlanCard {
  readonly id: string;
  readonly name: string;
  readonly formattedPrice: string;
  readonly billingPeriodLabel: string;
  readonly features: readonly string[];
  readonly maxBookingsLabel: string;
  readonly isPopular?: boolean;
}

export interface PlanCatalogViewModel {
  readonly plans: readonly FormattedPlanCard[];
  readonly viewState: "empty" | "error" | "loading" | "ready";
  readonly emptyMessage: string;
  readonly retry: () => void;
  readonly handleSelectPlan: (planId: string) => void;
}
```

#### 4.3. Constantes Congeladas y Ordenadas A-Z
Archivo `PLAN_CATALOG_CONSTANTS.ts`:
```typescript
export const PLAN_CATALOG_CONSTANTS = Object.freeze({
  CURRENCY: "USD",
  DEFAULT_LOCALE: "es-ES",
  GRID_LAYOUT_CLASS: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
  SKELETON_COUNT: 3,
});
```

---

### 5. Plan de Pruebas Unitarias y E2E

1. **Pruebas Unitarias (Vitest):**
   * `usePlanCatalogViewModel.test.ts`:
     * Valida ordenamiento por `priceInCents` ascendente.
     * Valida mapeo y formateo de precios con `Intl.NumberFormat`.
     * Valida transiciones de estado (`loading` -> `ready`, `error`, `empty`).
2. **Pruebas de Componentes e Integración (RTL):**
   * `PlanCatalogSection.test.tsx`:
     * Renderizado de skeletons durante carga.
     * Renderizado de planes con sus características.
     * Renderizado y reintento en caso de error.
     * Renderizado de mensaje vacío.
3. **Plan E2E (Playwright):**
   * Navegación a `/` como visitante anónimo.
   * Verificación visual y funcional de la sección de planes.
   * Conmutación de idioma (ES/EN) y verificación del formateo dinámico de moneda y textos.
