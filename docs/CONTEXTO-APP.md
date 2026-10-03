# Contexto de la Aplicacion — Booking System Web

Este documento proporciona una vision ejecutiva, compacta y arquitectonica de **Booking System Web** para desarrolladores y agentes de IA.

---

## 1. Vision General del Dominio

**Booking System Web** es una plataforma SaaS multitenant de gestion de citas y reservas para negocios de servicios (barberias, clinicas, consultorios, esteticas, etc.).

### Actores del Sistema
1. **Visitante (Visitor):** Usuario publico sin sesion. Navega por la landing, consulta catalogo de planes de suscripcion (US-07), catalogo publico de un negocio y disponibilidad de turnos.
2. **Suscriptor / Dueno de Negocio (Subscriber):** Dueno del negocio (tenant). Se suscribe a un plan, configura sus servicios, horarios, bloqueos de agenda y gestiona reservas y clientes.
3. **Cliente Final (Customer):** Usuario registrado que agenda citas en los negocios de la plataforma, consulta su historial, reagenda o cancela segun politicas.
4. **Super Administrador (Super Admin):** Operador de la plataforma SaaS. Administra negocios registrados, planes de suscripcion, parametros globales y tickets de soporte.

---

## 2. Portales de la Aplicacion

| Portal | Ruta Base | Rol Requerido | Descripcion |
| --- | --- | --- | --- |
| `landing` | `/` | Publico (Visitante) | Home comercial, catalogo de planes, contacto y onboarding |
| `business` | `/business` | `subscriber` | Gestion B2B: agenda, servicios, clientes, reportes, suscripcion |
| `customer` | `/customer` | `customer` | Portal B2C: perfil, mis reservas, exploracion y reserva de citas |
| `admin` | `/admin` | `super_admin` | Gobernanza SaaS: auditoria, negocios, planes, configuracion |
| `auth` | `/auth` | Compartido | Login, registro, reseteo de contrasena, proteccion con reCAPTCHA |

---

## 3. Modelo de Datos y Colecciones Firestore

El aislamiento multitenant se basa estrictamente en la clave `businessId`.

```text
businesses/{businessId}                             # Documento del negocio (tenant)
├── customers/{customerId}                          # Clientes registrados o manuales del negocio
├── services/{serviceId}                            # Servicios ofrecidos (duracion, precio en centavos)
├── bookings/{bookingId}                            # Reservas con snapshot del servicio
├── scheduleBlocks/{scheduleBlockId}                # Bloqueos de agenda parciales o totales
├── payments/{paymentId}                            # Pagos registrados a traves de pasarela simulada
└── subscription/current                            # Estado de la suscripcion activa del negocio

users/{userId}                                      # Cuentas globales de usuario (con custom claims de rol)
plans/{planId}                                      # Catalogo comercial de planes de suscripcion
platformSettings/current                            # Parametros globales del SaaS
supportTickets/{supportTicketId}                    # Tickets de soporte tecnico
auditLog/{auditLogEntryId}                          # Trazabilidad de operaciones sensibles
```

---

## 4. Convenciones de Nomenclatura del Dominio

- **Tenant Key:** `businessId` (nunca `tenantId`, `companyId` o `shopId`).
- **Reserva:** `Booking` (nunca `Appointment`, `Reservation` o `Cita`).
- **Cliente:** `Customer` (nunca `Client`).
- **Valores Monetarios:** Enteros en centavos (`priceInCents`).
- **Tiempos y Duraciones:** Enteros en minutos (`durationMinutes`).
- **Zona Horaria:** Se almacena el identificador IANA del negocio (`timeZone`).
