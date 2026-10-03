---
name: component-architecture
description: Feature-based component architecture, presentation vs logic separation (views + use*ViewModel hooks), scannable returns, modular folder rules, and JSDoc interface contracts (models/*.model.js / models/*.model.ts).
---

# Component Architecture Standards

This skill defines the structure for organizing UI components, separating business logic from presentation (MVVM), keeping JSX returns clean and scannable (< 80-100 lines), and enforcing formal interface contracts using JSDoc (`@typedef`, `@property`) in `models/`.

---

## 1. Directory Responsibility Map (SaaS Booking Platform)

Source code lives inside `src/`. Always use the `@/` path alias. All component, layout, and module folders MUST be named in **`kebab-case`**.

```text
src/
├── assets/                  # Logos, icons, branding assets, static images
├── components/              # Shared UI building blocks (reusable across all modules)
│   ├── common/              # Atomic reusable UI components in kebab-case folders
│   │   ├── badge/
│   │   │   ├── Badge.tsx (or .jsx)
│   │   │   └── index.ts (or .js)
│   │   ├── button/
│   │   │   ├── Button.tsx
│   │   │   └── index.ts
│   │   ├── card/
│   │   ├── input-field/
│   │   ├── modal/
│   │   ├── select-field/
│   │   ├── spinner/
│   │   ├── status-badge/
│   │   └── index.ts         # Unified barrel export for all common components
│   ├── layout/              # Structural chrome wrappers in kebab-case folders
│   │   ├── navbar/
│   │   ├── sidebar/         # Business & Admin sidebars with logout and status
│   │   ├── footer/
│   │   └── index.ts         # Unified barrel export for layout components
├── constants/               # Single source of truth for global constants (Object.freeze, A-Z)
├── context/                 # Global React Context providers (AuthContext, ThemeContext)
│   └── models/              # JSDoc contracts for context values (authContext.model.js/ts)
├── hooks/                   # Custom cross-cutting React hooks (useTheme, useDebounce)
├── modules/                 # Business feature pages & colocated sub-components
│   ├── landing/             # Public portal: home, pricing, contact, subscriber onboarding
│   │   ├── components/      # Local presentational minis (Hero, Testimonials, PlanCatalog)
│   │   ├── hooks/           # useLandingViewModel, usePlanCatalogViewModel
│   │   ├── models/          # JSDoc / TS contracts (plan.model.ts, landing.model.ts)
│   │   └── LandingPage.tsx
│   ├── business/            # Subscriber portal (B2B): services, schedule, collaborators, customers
│   │   ├── services/        # CRUD, pricing, duration, discounts
│   │   ├── schedule/        # Daily/weekly agenda, business blocks, holidays
│   │   ├── subscription/    # Plan status, mock gateway, payment receipts
│   │   ├── collaborators/   # Invitations, roles, permissions
│   │   ├── customers/       # Directory, internal notes, blocking, GDPR forget
│   │   ├── reports/         # Estimated financial reports, occupancy, CSV/Excel export
│   │   └── settings/        # Locale, dark/light theme, password management
│   ├── customer/            # Customer portal (B2C): service booking, my appointments
│   │   ├── business-home/   # Public page of a specific business
│   │   ├── booking-flow/    # Service selection, collaborator, date/time slots
│   │   ├── my-bookings/     # Upcoming appointments, reschedule, cancellation
│   │   └── profile/         # Personal info, notifications preferences
│   ├── admin/               # Super Admin portal: global SaaS governance
│   │   ├── businesses/      # Business verification & directory (active/inactive/pending)
│   │   ├── plans/           # Commercial subscription plans management & limits
│   │   ├── parameters/      # System parameters (inactivity timeout, grace days)
│   │   ├── dashboard/       # Global metrics (MRR, active businesses, reservations)
│   │   ├── support-tickets/ # Ticketing support system
│   │   └── audit-log/       # Traceability of critical administrative actions
│   └── auth/                # Cross-cutting auth: login, signup, reset password, reCAPTCHA
├── services/                # Firebase connection, Firestore queries, Cloud Functions, Mock Gateway
└── utils/                   # Pure stateless helper functions (formatters, date/currency, validators)
```

---

## 2. Presentation vs Logic Separation (`use*ViewModel`)

- **View File (`.tsx` / `.jsx`):** Renders visual layout, semantic HTML, and Tailwind styling only. Prohibited: direct Firebase calls, complex state orchestration, heavy side effects, or raw data transformations.
- **`use*ViewModel` Hook:** Encapsulates component state (`useState`), side effects (`useEffect`), business calculations, and event handlers. Exposes a clean, typed contract to the view.

### Incorrect (Logic mixed in View)

```tsx
// ❌ Monolithic component mixing Firestore fetch, state, handlers, and JSX
const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getDocs(collection(db, "services")).then(...);
  }, []);

  const handleCreate = async () => { ... };

  return <div>{services.map(...)}</div>;
};
```

### Correct (Presentation + ViewModel Hook separation)

```tsx
// ✅ Presentation file: ServicesPage.tsx
import { useServicesViewModel } from "./hooks/useServicesViewModel";
import { ServicesToolbar } from "./components/ServicesToolbar";
import { ServicesTable } from "./components/ServicesTable";

export const ServicesPage = (): ReactElement => {
  const {
    services,
    filters,
    viewState,
    handleCreateService,
    handleFilterChange,
  } = useServicesViewModel();

  return (
    <main className="container mx-auto p-6 space-y-6">
      <ServicesToolbar
        filters={filters}
        onCreateClick={handleCreateService}
        onFilterChange={handleFilterChange}
      />
      <ServicesTable services={services} viewState={viewState} />
    </main>
  );
};
```

---

## 3. Scannable Returns (Extract Mini Components)

If a view's JSX return exceeds **80–100 lines** or contains multiple visual sections (toolbar, filters, tables, modals), extract local mini components into the feature's `components/` subfolder:

- Mini components are strictly presentational.
- They receive data and callbacks via props.
- They live in the feature folder and are not exported globally unless reused by a second module.

---

## 4. Interface Contracts (`models/*.model.js` / `models/*.model.ts`) — MANDATORY

**Requerimiento del profesor: todo dato con forma no trivial — props de un componente, valor de un Context, resultado de un `use*ViewModel`, entidad de negocio — se documenta con una interfaz JSDoc (`@typedef`) antes de abrir el PR.** Obligatorio para todo componente, hook o contexto nuevo o modificado.

### 4.1 Dónde viven

Una carpeta `models/` colocada junto al código que documenta:

- Componente común/atómico: `src/components/common/<component>/models/<component>.model.js` (o `.ts`).
- Contexto global: `src/context/models/<contextName>Context.model.js` (ej. `src/context/models/authContext.model.js`).
- Módulo de negocio: `src/modules/<module>/models/<module>.model.js`.
- Un `index.js` (o `index.ts`) barrel re-exporta todos los `.model` de esa carpeta (`export * from './x.model';`) en orden alfabético.

### 4.2 Cómo se escribe un archivo `.model.js` / `.model.ts`

```javascript
/**
 * @file Contrato de interfaz para el catálogo de planes de suscripción.
 */

/**
 * @typedef {Object} PlanLimits
 * @property {number} maxBookings - Cantidad máxima de reservas mensuales permitidas.
 */

/**
 * @typedef {"monthly" | "annual"} BillingPeriod
 */

/**
 * @typedef {Object} Plan
 * @property {string} id - Identificador único del plan.
 * @property {string} name - Nombre comercial del plan.
 * @property {number} priceInCents - Precio unitario en centavos.
 * @property {BillingPeriod} billingPeriod - Periodicidad de cobro.
 * @property {string[]} features - Lista de características incluidas.
 * @property {PlanLimits} limits - Límites operativos del plan.
 * @property {"active" | "inactive"} status - Estado de disponibilidad comercial.
 */

/**
 * @typedef {Object} FormattedPlanCard
 * @property {string} id - ID del plan.
 * @property {string} name - Nombre para visualización.
 * @property {string} formattedPrice - Precio formateado con divisa local (ej. $29.00).
 * @property {string} billingPeriodLabel - Etiqueta de periodicidad traducida (/mes, /año).
 * @property {string[]} features - Características a desplegar.
 * @property {string} maxBookingsLabel - Texto accesible de reservas permitidas.
 */

/**
 * @typedef {Object} UsePlanCatalogViewModelReturn
 * @property {FormattedPlanCard[]} plans - Lista de planes formateados y ordenados.
 * @property {"empty" | "error" | "loading" | "ready"} viewState - Estado de la vista.
 * @property {string} emptyMessage - Mensaje para estado sin datos.
 * @property {() => void} retry - Handler para reintentar la carga.
 * @property {(planId: string) => void} handleSelectPlan - Handler para seleccionar plan.
 */

export {};
```

- `export {}` al final convierte el archivo en módulo ES para permitir imports de tipos.

### 4.3 Cómo se consume desde la vista o el ViewModel

```javascript
/**
 * Tarjeta presentacional de plan de suscripción.
 * @param {{
 *   plan: import('../models').FormattedPlanCard,
 *   onSelectPlan: (planId: string) => void
 * }} props
 * @returns {import('react').JSX.Element}
 */
export const PlanCard = ({ plan, onSelectPlan }) => {
  /* ... */
};
```

```javascript
/**
 * Hook ViewModel para el catálogo de planes.
 * @returns {import('../models').UsePlanCatalogViewModelReturn}
 */
export const usePlanCatalogViewModel = () => {
  /* ... */
};
```

---

## 5. Checklist de Verificación de Arquitectura

- [ ] Todo componente con props complejas tiene su contrato documentado con `@typedef` en `models/*.model.*`.
- [ ] Todo Context expone su contrato `<Nombre>ContextValue` en `src/context/models/`.
- [ ] Todo hook `use*ViewModel` documenta su objeto de retorno.
- [ ] Las vistas solo renderizan layout y JSX; cero lógica de negocio o queries directas.
- [ ] Los retornos JSX son scannables (< 80-100 líneas).
- [ ] Cero elementos HTML nativos crudos (`<button>`, `<input>`); se utilizan las primitivas de `src/components/common/`.
- [ ] Cada carpeta `models/` cuenta con su `index` barrel en orden alfabético.
