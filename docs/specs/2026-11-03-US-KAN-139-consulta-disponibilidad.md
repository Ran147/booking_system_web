# Software Design Document (SDD) — KAN-139
## Consulta de disponibilidad del cliente (motor de horarios libres y revalidación)

| Metadato | Valor |
|---|---|
| **Épica / Historias** | KAN-139 (KAN-140 fecha, KAN-141 solo horarios libres, KAN-142 por colaborador, KAN-143 bloqueos y descansos, KAN-144 revalidar al confirmar) |
| **Portal** | Customer (interfaz) y servidor (`functions/src/bookings/`) |
| **Fecha de Especificación** | 2026-11-03 |
| **Estado** | Borrador para revisión: D-1 a D-6 pendientes de confirmar |
| **Spec funcional (criterios AC)** | `src/modules/customer/features/availability/specs/SPEC.md` (este documento **no** los repite, los implementa) |
| **Preguntas abiertas** | Ninguna `BLOCKED`. Q1 y Q4 decididas el 2026-09-28. Q8 decidida el 2026-10-24 (dónde corre el servidor), con implementación pendiente |
| **Épica que depende de esta** | KAN-145 (resumen, políticas y confirmación de la reserva) |

---

### 1. Resumen y Propósito
Tras elegir un servicio, el cliente elige una fecha y ve solo los horarios en los que el negocio puede atenderlo, en la zona horaria del negocio. Justo antes de crear la reserva, el servidor vuelve a comprobar que el horario sigue libre.

El cálculo vive **solo en el servidor** (el cliente no lee reservas ajenas) y se construye en este orden, para poder probarlo sin depender del resto:
1. Un **motor puro** que, con los datos ya leídos, devuelve los horarios libres. No importa Firebase.
2. La **revalidación** dentro de `createBooking`, que usa el mismo motor.
3. La función **`getAvailability`**, un envoltorio fino que lee los datos y llama al motor.
4. La **interfaz** de fecha y horarios.

### 2. Estado actual del repo (verificado el 2026-11-03)
- **Datos que ya existen:**
  - `Business.businessHours`: un objeto por día de la semana en inglés (`monday` … `sunday`), con una lista de rangos `{ opensAt, closesAt }` en formato `"HH:mm"`. Un día cerrado es una lista vacía. Lo escriben el registro de suscriptor y la semilla.
  - `Business.timeZone` (zona IANA) y `Business.status`.
  - `Booking`: `startsAt`, `endsAt`, `status`, `collaboratorId` (`Nullable`), `serviceSnapshot.durationMinutes`.
  - `Collaborator` en `businesses/{id}/collaborators/{id}`, con `fullName`, `status` y `serviceIds`.
- **Datos que no existen en código:** `ScheduleBlock` (solo la constante de colección; sin reglas ni tipos) y la pantalla de horario del negocio (KAN-64 a 66). El motor recibe los bloqueos como datos de entrada, así que se puede construir y probar sin ellos.
- **Librerías de fecha:** `functions/` no tiene ninguna (solo `firebase-admin`, `firebase-functions` y `zod`). El front resuelve zonas horarias con `Intl` en `zonedDayBounds`; el motor usa la misma técnica y **no puede importar de `src/`**, así que se copia a `functions/src/shared/`.
- **`createBooking` hoy** (`functions/src/bookings/createBooking.ts`) cumple casi nada de KAN-144:
  - No revisa cruces con otras reservas, ni el horario del negocio, ni bloqueos, ni que el inicio esté en el futuro.
  - Acepta `endsAt` del cliente. La duración debería salir del servicio.
  - Acepta `collaboratorId` sin comprobar que esté `active` ni que atienda ese servicio, y no asigna colaborador para "cualquiera disponible".
  - Acepta `customerId` del payload sin relacionarlo con quien llama (`customerUserId` sí sale de la sesión).
  - Crea siempre la reserva como `confirmed`, sin considerar el modo de confirmación manual (KAN-70).

### 3. Diseño

#### 3.1 Archivos nuevos en `functions/src/bookings/`
| Archivo | Rol |
|---|---|
| `availability/computeFreeSlots.ts` | Motor puro: datos de entrada a lista de horarios libres |
| `availability/models/Availability.model.ts` | Tipos de entrada y salida con JSDoc |
| `availability/constants/Availability.constants.ts` | Intervalo de 30 min, ventana de 60 días, nombres de día (A→Z, congeladas) |
| `shared/zonedTime.ts` | Convertir hora local de una zona IANA a instante UTC, sin librerías |
| `availability/tests/computeFreeSlots.test.ts` | Tests con datos de ejemplo |

#### 3.2 Contrato del motor
Entrada: la fecha local `YYYY-MM-DD`, la zona horaria del negocio, la duración del servicio, el instante actual, `businessHours`, y una lista de **recursos**. Un recurso es un colaborador activo que atiende el servicio, o el propio negocio (`id: null`) si el servicio no tiene colaboradores. Cada recurso trae sus reservas abiertas (`pending` y `confirmed`) y sus bloqueos; los bloqueos del negocio entero se suman a todos.

Salida: lista de horarios `{ startsAt, endsAt, freeResourceIds }`. `freeResourceIds` lo usa el servidor para asignar colaborador y **nunca** sale al cliente (AC-KAN-142-02).

#### 3.3 Algoritmo
1. Tomar los rangos del día de la semana de la fecha local. Si no hay, no hay horarios (AC-KAN-143-03).
2. Dentro de cada rango, generar inicios cada 30 min desde la apertura. Un horario cabe solo si termina antes o justo al cierre del mismo rango (AC-KAN-141-01, 141-05). Un hueco entre dos rangos del mismo día es un descanso.
3. Convertir cada hora local a instante UTC. En un cambio de horario de verano, un horario que no existe se salta y uno ambiguo se toma una sola vez (AC-KAN-141-07).
4. Descartar los que empiezan antes de ahora (AC-KAN-141-04).
5. Para cada recurso, descartar los horarios que se cruzan con una reserva abierta suya o con un bloqueo, aunque sea en parte (AC-KAN-143-01, 143-06). Las reservas `cancelled`, `completed` y `no_show` no cuentan (AC-KAN-141-06).
6. Un horario sale si **al menos un recurso** queda libre (AC-KAN-141-09). Con un colaborador elegido, el motor recibe solo ese recurso (AC-KAN-142-01).
7. Un servicio cuyos colaboradores están todos `inactive` o `invited` no tiene recursos, y la función responde que no hay colaborador (AC-KAN-141-10).

#### 3.4 Revalidación (KAN-144)
`createBooking` ya corre en una transacción. Se agrega, dentro de ella:
- Calcular `endsAt` desde el servicio y descartar el del payload.
- Leer las reservas abiertas y bloqueos del día, llamar al motor y comprobar que el inicio pedido sigue libre. Si no, responder con el error de horario ocupado (`slotTakenError`, AC-KAN-144-02, 144-03).
- Con colaborador elegido, validar que esté `active` y atienda el servicio; si no está libre, fallar sin cambiarlo (AC-KAN-144-09).
- Con "cualquiera" o servicio automático, asignar entre los libres el que tenga menos reservas ese día, y en empate el primero por nombre (AS-9 de la spec funcional, AC-KAN-144-08).
- La transacción evita que dos clientes tomen el mismo horario (AC-KAN-144-07). El doble clic (AC-KAN-144-06) lo cubre la misma revisión de cruce.

#### 3.5 `getAvailability`
Callable que valida el payload con Zod, exige sesión de `customer`, lee negocio, servicio, colaboradores, reservas y bloqueos del día, y devuelve solo los horarios (`startsAt`, `endsAt`). Según Q8 corre en el dispatcher de Vercel; mientras ese dispatcher no exista se prueba con los emuladores.

### 4. Plan de PRs
Cada PR es pequeño, con su spec primero y los criterios que cubre en la descripción.

| PR | Contenido | Criterios |
|---|---|---|
| 1 | Este SDD | — |
| 2 | Motor puro, `zonedTime` y sus tests | AC-KAN-141-01, 04 a 07, 09, 10; 142-01, 02; 143-01, 03, 06 |
| 3 | Revalidación en `createBooking` y arreglo de sus huecos | AC-KAN-144-01 a 04, 06 a 09; 143-05 |
| 4 | `getAvailability` | AC-KAN-140-01 a 03, 141-03, 143-02, 143-04, 143-07 |
| 5 | Interfaz: selector de fecha y horarios | AC-KAN-140-01 a 10, 141-08, 142-03 a 05 |

### 5. Decisiones y dudas por confirmar
| Id | Duda | Propuesta |
|---|---|---|
| D-1 | **Cómo se guardan los descansos.** La spec habla de "tiempos de descanso" y `businessHours` ya admite varios rangos por día. | Un descanso es un hueco entre rangos, o un bloqueo parcial. No hay campo nuevo. |
| D-2 | **Forma de `ScheduleBlock`.** Nadie la ha definido en código; la spec de horario solo dice "inicio y fin". | El motor acepta `{ startsAt, endsAt, collaboratorId }` como instantes. Un bloqueo de día completo lo convierte quien lo lee (inicio y fin del día en la zona del negocio). Confirmar con quien construya KAN-64 a 66. |
| D-3 | **Supuestos AS-1, AS-3 y AS-5.** | Ventana de 60 días, intervalo de 30 min, sin antelación mínima. Quedan en constantes, fáciles de cambiar. |
| D-4 | **Los huecos de `createBooking`** (`endsAt` y `collaboratorId` del cliente, `customerId` libre). | Corregirlos en el PR 3, porque KAN-144 no se cumple sin ello. `customerId` necesita saber qué es ese documento antes de validarlo. |
| D-5 | **Estado inicial de la reserva.** Hoy siempre es `confirmed`. KAN-70 (modo manual) no tiene campo definido. | Mantener `confirmed` y dejar KAN-70 para su propia historia. |
| D-6 | **Dónde corre el servidor.** | El motor es independiente de dónde corra. El PR 4 espera al dispatcher de Q8, o usa el camino que acuerde el equipo con el PR de Marco (#64). |

### 6. Pruebas
- **Motor:** tests de Vitest con datos de ejemplo y sin Firebase. Cubren un día normal, cierre, descanso, bloqueo parcial que corta un servicio, día sin horario, hoy con horarios pasados, varios colaboradores, cambio de horario de verano en una zona con DST (por ejemplo `America/New_York`) y duración que no cabe.
- **`createBooking`:** tests del emulador o de `firebase-functions-test` con la transacción: cruce, bloqueo nuevo, doble envío y asignación automática.
- **Verificación:** un test que rompe el motor a propósito y comprueba que falla, como en los PR anteriores.

### 7. Fuera de alcance
- Las pantallas del horario del negocio (KAN-64 a 66) y de colaboradores (KAN-77, 81).
- La selección de servicio y colaborador (KAN-134 a 138).
- Reprogramar (KAN-157, 158), que reutilizará este motor en su propia spec.
- El modo de confirmación manual (KAN-70) y el correo de confirmación (KAN-163, bloqueado por Q9).
