# Software Design Document (SDD) — KAN-139, PR 5

## Pantalla de fecha y horarios libres del cliente

| Metadato | Valor |
| --- | --- |
| **Historias** | KAN-140 (elegir fecha), KAN-141 (solo horarios libres), KAN-142 (colaborador elegido), KAN-143 (bloqueos y días sin horario) |
| **Épica** | KAN-139. Spec del motor: `docs/specs/2026-11-03-US-KAN-139-consulta-disponibilidad.md` (PR 5 de su plan) |
| **Spec funcional** | `src/modules/customer/features/availability/specs/SPEC.md` |
| **Portal** | Customer (`/:businessSlug/...`, Q4), privado para `customer` (Q6, AS-8) |
| **Rama** | `US-139-interfaz`, desde `develop` |
| **Fecha** | 2026-11-15 |
| **Depende de** | `getAvailability` (#84, en `develop`). En producción, del PR #87 (despachador de Vercel) |

---

### 1. Resumen

El cliente elige un servicio, ve una semana de días y los horarios libres del día elegido, en la zona horaria del negocio, y elige uno. Al continuar pasa al resumen y confirmación (KAN-145, PR siguiente).

**Alcance mínimo de KAN-134 (elegir servicio):** nadie ha empezado KAN-111 (página del negocio) ni KAN-134 (elegir servicio y colaborador). Para que el flujo se pueda usar, este PR incluye **solo** la lista de servicios activos para elegir uno (AC-KAN-135-01, 04, 06 y 08). No incluye el paso de colaborador (KAN-136 a 138): la pantalla de horarios acepta `?collaboratorId=` en la URL para cuando exista, y sin él usa "cualquiera disponible" (AC-KAN-142-02).

### 2. Rutas y entrada

| Ruta | Pantalla | Guardia |
| --- | --- | --- |
| `/:businessSlug/book` | Elegir servicio | `RequireRole` customer/client |
| `/:businessSlug/book/:serviceId` (`?collaboratorId=` opcional) | Fecha y horarios | `RequireRole` customer/client |

- **Entrada:** una tarjeta "Reservar una cita" en `CustomerPlaceholderPage`, junto a la de "Mis reservas". Quien haga KAN-111 o KAN-134 solo enlaza estas rutas.
- Un visitante que abre la ruta va al login y vuelve a ella (AC-KAN-140-09), con el `RequireRole` existente.
- **Continuar** navega a `/:businessSlug/book/:serviceId/confirm?startsAt=<ISO>[&collaboratorId=]`, que crea el PR de KAN-145.

### 3. Archivos

```text
src/modules/customer/features/
├── service-selection/
│   ├── api/ fetchBookableServices.ts, useBookableServicesQuery.ts, bookableService.schema.ts
│   ├── components/ServiceSelectionPage/ ServiceSelectionPage.tsx, index.ts
│   ├── hooks/useServiceSelectionViewModel.ts
│   ├── models/serviceSelection.model.ts        # contratos JSDoc
│   ├── tests/ ServiceSelectionPage.page.ts, ServiceSelectionPage.test.tsx
│   └── index.ts
└── availability/
    ├── api/
    │   ├── availabilityQueryKeys.ts
    │   ├── fetchAvailability.ts               # callFunction(getAvailability) + Zod de la respuesta
    │   ├── fetchBookingContext.ts             # negocio (por slug) + servicio: timeZone, businessHours, nombre, duración
    │   ├── useAvailabilityQuery.ts
    │   ├── useBookingContextQuery.ts
    │   └── useFirstAvailableDateQuery.ts      # AC-KAN-140-07
    ├── components/
    │   ├── AvailabilityPage/ AvailabilityPage.tsx
    │   ├── DateStrip/ DateStrip.tsx           # semana con anterior/siguiente
    │   └── SlotList/ SlotList.tsx             # RadioGroup de horas
    ├── constants/Availability.constants.ts    # ventana 60 días, 7 días por semana, motivos de error
    ├── hooks/useAvailabilityViewModel.ts
    ├── models/availability.model.ts
    ├── utils/ buildWeekDays.ts, formatSlotTime.ts, mapAvailabilityError.ts
    ├── tests/ AvailabilityPage.page.ts, AvailabilityPage.test.tsx, buildWeekDays.test.ts, mapAvailabilityError.test.ts
    └── index.ts
```

Átomos de `@/components/common`: `PageTemplate`, `Card`, `Button`, `RadioGroup`, `Spinner`, `EmptyState`, `ErrorState`, `Alert`, `AppLink`. Ningún control HTML crudo.

### 4. Decisiones

| Id | Decisión |
| --- | --- |
| P5-1 | **Días como tira semanal**, no un `<input type="date">`: un input nativo no puede deshabilitar los días de la semana sin horario (AC-KAN-143-03). Se ven 7 días con "semana anterior/siguiente". Quedan deshabilitados los días antes de hoy (AC-KAN-140-04), después del último día reservable (AC-KAN-140-05) y los días sin rangos en `businessHours` (AC-KAN-143-03). "Hoy" y las fechas se calculan en la zona del negocio (AC-KAN-140-06). |
| P5-2 | **Primer día con horarios (AC-KAN-140-07, AS-2):** al abrir sin fecha en la URL, se consultan uno a uno los días abiertos desde hoy y se preselecciona el primero con horarios. Se detiene en el primero. Si ninguno de la ventana tiene, se muestra hoy con el estado vacío. La fecha elegida va en `?date=`, así que recargar o volver la conserva. Una `?date=` que no existe (por ejemplo `2026-02-30` o texto) o que está fuera de la ventana (un marcador viejo) se ignora y se busca el primer día con horarios. La búsqueda usa la señal de TanStack Query y se detiene al salir de la pantalla (revisión de Copilot, 2026-11-16). |
| P5-3 | **Una consulta por fecha** con TanStack Query, con clave `[availability, businessId, serviceId, collaboratorId, date]`. Si el cliente cambia de fecha mientras carga, solo se muestran los horarios del último día (AC-KAN-140-08). Se pide fresca al abrir (`staleTime: 0`) y no se reintenta un error de negocio. |
| P5-4 | **Respuesta validada con Zod.** Si no cumple el contrato, no se muestra ninguna lista y aparece `common:errors.unknown` con "Reintentar" (AC-KAN-141-03). |
| P5-5 | **Errores por `reason`:** `not_configured` → `availability.slots.notConfigured` y sin fechas (AC-KAN-143-04); `business_unavailable` (143-07); `service_unavailable` → volver a elegir servicio (140-03); `collaborator_unavailable` → volver (142-03); `no_collaborator` (141-10); red → `common:errors.network` con "Reintentar" (140-02). Un día sin horarios muestra `availability.slots.emptyDay` con "Elegir otra fecha" (141-08). |
| P5-6 | **Horas en la zona del negocio** con `Intl.DateTimeFormat` (`timeZone` de la respuesta) y la zona indicada arriba de la lista (AC-KAN-140-06). Nunca se muestra quién atendería (AC-KAN-142-02). |
| P5-7 | **El horario elegido vive en el estado de la pantalla.** Cambiar de fecha o de servicio lo borra (AC-KAN-135-10, 142-05). Si la sesión se cierra, el `RequireRole` saca al cliente y no se guarda nada (AC-KAN-140-10). |
| P5-8 | **Lectura del negocio y del servicio** con el SDK web, que las reglas ya permiten: el negocio por `slug` y el servicio activo. Las reglas niegan a un cliente un servicio desactivado o inexistente: esa denegación se trata como `service_unavailable`, no como error con reintento (revisión de Copilot, 2026-11-16). Solo se leen `timeZone`, `businessHours`, `name`, `durationMinutes`, `priceInCents`, `status` y `currency`. |

### 5. Claves i18n nuevas (es, en)

- `customer:availability.{title, subtitle, timeZoneNote, previousWeek, nextWeek, dayUnavailable, continueAction, chooseAnotherDate, backToServices}`
- `customer:availability.slots.{emptyDay, notConfigured, noCollaborator, groupLabel}`
- `customer:availability.errors.{businessUnavailable, serviceUnavailable, collaboratorUnavailable}` (las que ya envía el servidor)
- `customer:serviceSelection.{title, subtitle, continueAction, durationLabel}`, `customer:serviceSelection.list.empty`, `customer:serviceSelection.errors.{serviceRequired}`
- `customer:placeholder.bookCard.{title, description, action}`
- Reutilizadas: `common:errors.network`, `common:errors.unknown`, `common:actions.retry` (si existe).

### 6. Pruebas (Vitest + Testing Library, Page Object)

| Test | Comprueba |
| --- | --- |
| `AvailabilityPage.test.tsx` | AC-KAN-140-01, 02, 03, 04, 05, 06, 07, 08; 141-03, 08, 10; 142-02, 03; 143-03, 04, 07. La frontera `api/` se reemplaza, como en `my-bookings` |
| `buildWeekDays.test.ts` | Días deshabilitados por ventana y por `businessHours`, en una zona distinta a la del navegador |
| `mapAvailabilityError.test.ts` | `reason` → clave i18n y acción |
| `ServiceSelectionPage.test.tsx` | AC-KAN-135-01, 04, 06, 08 |

Los criterios del motor (141-01, 04 a 07, 09; 142-01; 143-01, 02, 06) ya los cubren los tests de `getAvailability` contra el emulador.

### 7. Verificación

`npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test:run`. Probado a mano con `npm run dev` y emuladores, en modo claro y oscuro y a ancho de teléfono.

### 8. Fuera de alcance

- Página del negocio y catálogo (KAN-111), paso de colaborador (KAN-136 a 138).
- Resumen, políticas y confirmación (KAN-145): PR siguiente.
