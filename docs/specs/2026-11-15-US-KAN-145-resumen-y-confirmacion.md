# Software Design Document (SDD) — KAN-145

## Resumen, políticas y confirmación de la reserva

| Metadato | Valor |
| --- | --- |
| **Historias** | KAN-146 (resumen), KAN-147 (políticas), KAN-148 (confirmar), KAN-149 (pantalla de confirmación) |
| **Épica** | KAN-145 |
| **Spec funcional** | `src/modules/customer/features/booking-checkout/specs/SPEC.md` |
| **Portal** | Customer (`/:businessSlug/...`, Q4), privado para `customer` (Q6) |
| **Rama** | `US-145-checkout`, sobre `US-139-interfaz` (#88) con `US-139-vercel` (#87) mezclada. Se mergea **después** de los dos: el diff se reduce solo cuando entren |
| **Fecha** | 2026-11-15 |

---

### 1. Resumen

El cliente llega desde la pantalla de horarios (#88) con el servicio y `startsAt` en la URL. Ve el resumen (negocio, servicio, fecha, hora de inicio y fin en la zona del negocio, duración y precio) y las políticas, y confirma. El servidor revalida y crea la reserva (`createBooking`, ya con el motor, #82 y #87). Después ve una pantalla de confirmación que se puede recargar sin crear otra reserva.

### 2. Rutas

| Ruta | Pantalla | Guardia |
| --- | --- | --- |
| `/:businessSlug/book/:serviceId/confirm?startsAt=<ISO>[&collaboratorId=]` | Resumen y confirmar | `RequireRole` customer/client |
| `/:businessSlug/book/done/:bookingId` | Confirmación | `RequireRole` customer/client |

- Un visitante va al login y vuelve con la misma URL, servicio y horario incluidos (AC-KAN-146-03). `RequireRole` ya conserva `pathname + search` como `redirectTo`.
- **Cambiar** lleva a la pantalla de horarios del mismo servicio con `?date=` del día elegido, o a elegir servicio (AC-KAN-146-02).
- Al confirmar se navega con `replace` a `book/done/:bookingId`. Volver atrás no reenvía nada (AC-KAN-149-04).

### 3. Archivos

```text
src/modules/customer/features/booking-checkout/
├── api/
│   ├── fetchCheckoutSummary.ts       # negocio por slug + servicio: nombre, precio, duración, descuentos, moneda, zona, estado
│   ├── useCheckoutSummaryQuery.ts
│   ├── createCustomerBooking.ts      # callFunction(createBooking)
│   ├── useCreateBookingMutation.ts
│   └── mapCreateBookingError.ts      # reason → clave i18n y acción
├── components/
│   ├── BookingCheckoutPage/          # resumen + políticas + confirmar
│   ├── BookingSummaryCard/
│   ├── BookingPolicyNotice/
│   └── BookingConfirmationPage/      # reutiliza useMyBookingQuery de my-bookings
├── constants/BookingCheckout.constants.ts
├── hooks/ useBookingCheckoutViewModel.ts, useBookingConfirmationViewModel.ts
├── models/bookingCheckout.model.ts
├── utils/resolveServicePrice.ts      # precio con descuento (P-2)
├── tests/ BookingCheckoutPage.page.ts/.test.tsx, BookingConfirmationPage.test.tsx, resolveServicePrice.test.ts, mapCreateBookingError.test.ts
└── index.ts
```

En el servidor (`functions/src/bookings/handlers/handleCreateBooking.ts`, del #87) solo cambia lo de §5.

### 4. Decisiones del cliente

| Id | Decisión |
| --- | --- |
| C-1 | **Resumen (AC-KAN-146-01, 05):** fecha y horas formateadas con `Intl` en la zona del negocio, que se indica. Fin = `startsAt` + `durationMinutes`. Precio con `formatPrice` en la moneda del negocio. |
| C-2 | **Negocio o servicio no disponibles al cargar (AC-KAN-146-04):** si no existe, está inactivo o el negocio no está activo → `common:errors.notFound` sin botón de confirmar. Error de red → `common:errors.network` con "Reintentar". Un `startsAt` ausente o inválido en la URL también es `notFound`. |
| C-3 | **Confirmar (AC-KAN-148-01, 02, 07):** `useMutation`. El botón muestra estado ocupado y queda deshabilitado mientras se envía. El payload es `{ businessId, serviceId, startsAt, collaboratorId?, requestId, expectedPriceInCents, expectedDurationMinutes }`. |
| C-4 | **Reintento sin duplicar (AC-KAN-148-06):** `requestId` es un UUID creado al abrir el resumen y se conserva entre reintentos (ver S-1). |
| C-5 | **Errores al confirmar, por `reason`:** `slot_taken` → `confirm.slotTakenError` y "Elegir otro horario" (148-03); `customer_blocked` → `confirm.customerBlockedError` (148-04); `service_unavailable` (negocio o servicio inactivos) → `confirm.unavailableError` (148-05); `service_changed` → `confirm.serviceChangedError` y el resumen se recarga (148-08). Red → `common:errors.network`; otro → `common:errors.unknown` (148-06). El resumen queda en pantalla. |
| C-6 | **Pantalla de confirmación (KAN-149):** lee la reserva con `useMyBookingQuery` de `my-bookings` (US-150), así que recargar muestra la misma (149-04). El título depende del estado: `success.confirmedTitle` o `success.pendingTitle` (149-01, 02). Muestra negocio, servicio, fecha y horas, precio, y el colaborador si `collaboratorName` existe (149-05). Acciones: "Mis reservas" y "Volver al negocio". El título recibe el foco. |
| C-7 | **Colaborador en el resumen (AC-KAN-146-07):** no hay paso de colaborador (acordado: solo lo mínimo de KAN-134). Si el servicio tiene `collaboratorSelection`, se muestra `summary.anyCollaborator`; si no, no hay línea. AC-KAN-148-13 queda cubierto como `slotTakenError` (AC-KAN-144-09) hasta que exista el paso de colaborador. |

### 5. Cambios en el servidor (`handleCreateBooking`)

| Id | Decisión |
| --- | --- |
| S-1 | **Idempotencia (AC-KAN-148-06, 07):** si llega `requestId`, la reserva se crea con ese id (`bookings/{requestId}`). Dentro de la transacción, si ya existe y es del mismo cliente, se devuelve esa misma reserva en vez de crear otra. Si es de otro cliente → `invalid-argument`. |
| S-2 | **Servicio cambiado (AC-KAN-148-08, AS-6):** si llegan `expectedPriceInCents` o `expectedDurationMinutes` y no coinciden con el `priceInCents` o `durationMinutes` actuales del servicio (sin descuento), → `failed-precondition` con `reason: service_changed`. Sin esos campos no se compara, por compatibilidad. |
| S-3 | **Registro `Customer` en la primera reserva (AC-KAN-148-09, 11, AS-4):** si no existe `businesses/{businessId}/customers/{uid}`, se crea en la misma transacción con `userId`, `fullName`, `phone` y `email` del perfil `users/{uid}`, `status: active` y `createdAt`. Si ya existe no se toca. |
| S-4 | Tests nuevos en `createBooking.test.ts` (emulador) para S-1, S-2 y S-3. Los handlers ya los usa también Vercel (#87). |

### 6. Preguntas para decidir

| Id | Pregunta | Opciones |
| --- | --- | --- |
| **P-1** | **Políticas (KAN-147).** `BookingPolicy` solo aparece en el glosario como "campo de `Business`", sin campos definidos, y ninguna pantalla permite configurarla. | **A (recomendada):** se lee `Business.bookingPolicy` con una forma mínima provisional, `{ cancellationWindowHours: number, penaltyDescription: string }`. Si falta, como hoy en todos los negocios, se muestra `policies.noPolicyEmpty` sin casilla (147-03). Si existe, se muestra con la casilla obligatoria (147-01, 02). La forma se anota en el glosario como propuesta. **B:** solo `noPolicyEmpty` y dejar 147-01, 02 y 04 para cuando exista la historia que la configura. |
| **P-2** | **Precio con descuento (AC-KAN-146-06).** El precio final con descuento solo se calcula en el servidor (`buildServiceSnapshot`). | **A (recomendada):** un espejo puro `resolveServicePrice` en el cliente (`// Mirror of buildServiceSnapshot — keep in sync`), con tests de los mismos casos, que muestra el precio original tachado y el precio con descuento. La pantalla de confirmación muestra el precio guardado en la reserva. **B:** el resumen muestra solo el precio base y la confirmación el precio real guardado (146-06 parcial). |

### 7. Claves i18n nuevas (es, en)

`customer:bookingCheckout.{title, subtitle, changeTimeAction, changeServiceAction, retryAction}`, `summary.{label, business, service, date, time, duration, price, originalPrice, collaborator, anyCollaborator, timeZoneNote}`, `policies.{title, window, penalty, acknowledge, noPolicyEmpty}`, `confirm.{action, submitting, slotTakenError, customerBlockedError, unavailableError, serviceChangedError, chooseAnotherTime}`, `success.{confirmedTitle, pendingTitle, myBookingsAction, backToBusinessAction}`. Reutilizadas: `common:errors.{network, notFound, unknown, permissionDenied}`.

### 8. Pruebas

| Test | Comprueba |
| --- | --- |
| `BookingCheckoutPage.test.tsx` | AC-KAN-146-01 a 05 y 07; 147-01 a 03 (según P-1); 148-03 a 08; botón ocupado y deshabilitado; mismo `requestId` al reintentar |
| `BookingConfirmationPage.test.tsx` | AC-KAN-149-01, 02, 04 y 05 |
| `resolveServicePrice.test.ts` | Descuento porcentual, fijo, vencido y sin descuento (según P-2) |
| `mapCreateBookingError.test.ts` | `reason` → mensaje y acción |
| `functions/.../createBooking.test.ts` | S-1 (mismo `requestId` → una sola reserva), S-2 (`service_changed`), S-3 (registro `Customer` creado una vez) |

### 9. Verificación

`npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test:run`, `npm run test:functions`. A mano con emuladores: horarios → resumen → confirmar → confirmación, y recargar la confirmación.

### 10. Fuera de alcance

Paso de colaborador (KAN-136 a 138), correo de confirmación (KAN-164, bloqueado por Q9), configurar `BookingPolicy` desde el portal del negocio.
