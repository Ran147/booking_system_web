# Software Design Document (SDD) — US-04 (KAN-4)
## Introducción de la Plataforma con Opción de "Leer más" en la Página Principal

| Metadato | Valor |
|---|---|
| **Historia de Usuario** | US-04 / KAN-4 ("Como visitante quiero leer una breve introducción de la plataforma con la opción de 'Leer más' para conocer rápidamente la propuesta del servicio") |
| **Épica** | KAN-1 ([Landing] Home) |
| **Portal** | Landing (`src/modules/landing/features/home`) |
| **Fecha de Especificación** | 2026-10-12 |
| **Estado** | Aprobada para Implementación |
| **Requerimientos Relacionados** | RF-01 (Landing Page), RNF-01 (Rendimiento), RNF-04 (Usabilidad), RNF-05 (Tema Dinámico), RNF-08 (Accesibilidad WCAG AA) |

---

### 1. Resumen y Propósito

Ofrecer a los visitantes de la plataforma una sección introductoria clara, atractiva y accesible (`PlatformIntroSection`) en la página de inicio. La sección comunica la propuesta de valor y capacidades principales del sistema de gestión de citas y reservas, facilitando que el usuario evalúe rápidamente el servicio.

La interfaz presenta un extracto o resumen inicial conciso (`summary`) para mantener una lectura ágil, complementado por un mecanismo interactivo de expansión progresiva ("Leer más" / "Leer menos") accesible mediante teclado y puntero, el cual despliega el texto ampliado (`fullText`) sin recargas de página ni navegación forzada.

---

### 2. Criterios de Aceptación Medibles

* **AC-KAN-4-01 [Happy Path - Visualización de Resumen]:** Dado que el visitante accede a la página principal, cuando se renderiza la sección introductoria, entonces se visualiza una insignia descriptiva (`badge`), el título principal (`title`), el resumen de la propuesta (`summary`) y el control interactivo rotulado como "Leer más" (`readMore`).
* **AC-KAN-4-02 [Happy Path - Expansión Interactiva]:** Dado que el resumen está visible, cuando el visitante activa "Leer más", entonces el contenido ampliado de la propuesta (`fullText`) se despliega de manera visible y accesible en la misma sección, y el botón de acción cambia su texto a "Leer menos" (`readLess`).
* **AC-KAN-4-03 [Happy Path - Colapso de Contenido]:** Dado que el contenido ampliado se encuentra visible, cuando el visitante activa "Leer menos", entonces el texto ampliado se oculta, la acción vuelve al estado "Leer más" y el foco accesible permanece en el botón de alternancia.
* **AC-KAN-4-04 [Error / Resiliencia - Ausencia de Contenido Ampliado]:** Dado que el contenido ampliado no está configurado o se encuentra vacío en las traducciones del idioma activo, cuando se renderiza la sección, entonces se muestra únicamente el resumen y el botón de alternancia no se renderiza, evitando un estado vacío o una interacción inoperante.
* **AC-KAN-4-05 [Accesibilidad WCAG AA y Responsive]:**
  - El botón interactivo incluye `aria-expanded` acorde al estado actual y `aria-controls` apuntando al identificador del contenedor del texto ampliado.
  - La sección se adapta a dispositivos móviles estrechos (360 px) sin desbordamiento horizontal.
  - Utiliza tokens semánticos de Tailwind v4 (`bg-card`, `text-card-foreground`, `text-muted-foreground`, `border-border`), garantizando contraste WCAG AA en tema claro y oscuro (RNF-05).
  - El control de acción cumple con un área táctil mínima de 44x44 px.

---

### 3. Matriz de Fronteras de Equipo

| Recurso / Módulo | Estado | Permiso |
|---|---|---|
| `docs/specs/2026-10-12-US-04-introduccion-plataforma-landing.md` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/components/PlatformIntroSection/**` | Nuevo componente | **Permitido (Creador)** |
| `src/modules/landing/features/home/constants/PlatformIntro.constants.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/models/PlatformIntroViewModel.interface.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/hooks/usePlatformIntroViewModel.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/tests/PlatformIntroSection.page.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/tests/PlatformIntroSection.test.tsx` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/tests/usePlatformIntroViewModel.test.tsx` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/home/index.ts` | Exportación barrel | **Permitido (Aditivo)** |
| `src/modules/landing/placeholder/LandingPlaceholderPage.tsx` | Inclusión de sección | **Permitido (Aditivo)** |
| `src/i18n/locales/{es,en}/landing.json` | Claves bajo `home.intro.*` | **Permitido (Aditivo)** |
| `src/components/common/**` | Átomos UI (`Button`, `Card`, `Badge`) | **Solo Lectura / Consumo** |
| Otros módulos (`src/modules/business/**`, etc.) | Módulos externos | **PROHIBIDO MODIFICAR** |

---

### 4. Decisiones de Arquitectura y Contratos de Datos (MVVM)

#### 4.1. Contrato del ViewModel (`PlatformIntroViewModel.interface.ts`)
```typescript
export interface PlatformIntroViewModel {
  readonly badge: string;
  readonly fullText: string;
  readonly handleToggle: () => void;
  readonly hasFullText: boolean;
  readonly isExpanded: boolean;
  readonly summary: string;
  readonly title: string;
  readonly toggleButtonLabel: string;
}
```

#### 4.2. Constantes Técnicas (`PlatformIntro.constants.ts`)
Ordenadas alfabéticamente A-Z e inmutables mediante `Object.freeze`:
```typescript
export const PLATFORM_INTRO_CONSTANTS = Object.freeze({
  BADGE_KEY: "home.intro.badge",
  CONTAINER_SECTION_ID: "platform-intro-section",
  FULL_TEXT_CONTAINER_ID: "platform-intro-full-text",
  FULL_TEXT_KEY: "home.intro.fullText",
  READ_LESS_KEY: "home.intro.readLess",
  READ_MORE_KEY: "home.intro.readMore",
  SUMMARY_KEY: "home.intro.summary",
  TITLE_KEY: "home.intro.title",
} as const);
```

#### 4.3. Estructura de Componentes
Siguiendo las buenas prácticas y el patrón modular:
```text
src/modules/landing/features/home/components/PlatformIntroSection/
├── PlatformIntroSection.tsx
├── types.ts
└── index.ts
```

---

### 5. Trazabilidad de Pruebas Automatizadas

| Criterio | Tipo | Archivo de Prueba | Estrategia |
|---|---|---|---|
| **AC-KAN-4-01** | Happy Path | `PlatformIntroSection.test.tsx` | Verifica renderizado de badge, título, resumen y botón "Leer más". |
| **AC-KAN-4-02** | Happy Path | `PlatformIntroSection.test.tsx` | Simula clic en "Leer más" y verifica aparición de `fullText` y cambio a "Leer menos". |
| **AC-KAN-4-03** | Happy Path | `PlatformIntroSection.test.tsx` | Simula alternancia a "Leer menos" y verifica colapso del texto adicional. |
| **AC-KAN-4-04** | Error/Edge | `PlatformIntroSection.test.tsx` | Verifica que si `fullText` está vacío, no se renderice el botón de alternancia. |
| **AC-KAN-4-05** | Accesibilidad/Edge | `PlatformIntroSection.test.tsx` | Verifica atributos `aria-expanded`, `aria-controls` y clases semánticas de contraste. |
| **Unit VM** | Unitario | `usePlatformIntroViewModel.test.tsx` | Valida estados iniciales y función `handleToggle`. |
