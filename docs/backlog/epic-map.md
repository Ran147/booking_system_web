# Epic map

Each Jira epic (project KAN) maps to one feature folder. `backlog-to-spec` writes the epic's `SPEC.md` into `<folder>/specs/`.
Source: `docs/backlog/jira-export.csv` (31 epics, 164 stories, exported 2026-09).

| Epic | Name (backlog) | Portal | Folder |
|---|---|---|---|
| KAN-1 | Home | landing | `portals/landing/features/home` |
| KAN-14 | Contacto | landing | `portals/landing/features/contact` |
| KAN-20 | Contratación de planes | landing | `portals/landing/features/plan-checkout` |
| KAN-26 | Registro del usuario | landing | `portals/landing/features/subscriber-sign-up` |
| KAN-196 | Footer | landing | `portals/landing/layout` |
| KAN-28 | Login (suscriptor) | shared | `features/auth` |
| KAN-29 | Sidebar (Logout) | business | `portals/business/layout` |
| KAN-30 | Gestión de servicio | business | `portals/business/features/services` |
| KAN-31 | Settings | business | `portals/business/features/settings` |
| KAN-32 | Gestión de suscripción | business | `portals/business/features/subscription` |
| KAN-63 | Agenda y reservas | business | `portals/business/features/schedule` |
| KAN-77 | Colaboradores | business | `portals/business/features/collaborators` |
| KAN-87 | Clientes | business | `portals/business/features/customers` |
| KAN-99 | Notificaciones | business | `portals/business/features/notification-settings` |
| KAN-102 | Reportes | business | `portals/business/features/reports` |
| PROP-3 | Soporte (Proposed — not in Jira yet) | business | `portals/business/features/support` |
| PROP-4 | Perfil público del negocio (Proposed — not in Jira yet) | business | `portals/business/features/business-profile` |
| KAN-96 | Navbar | customer | `portals/customer/layout` |
| KAN-111 | Página principal del negocio | customer | `portals/customer/features/business-home` |
| KAN-117 | Footer | customer | `portals/customer/layout` |
| KAN-122 | Registro del cliente | customer | `portals/customer/features/customer-sign-up` |
| KAN-128 | Login (cliente) | shared | `features/auth` |
| KAN-134 | Selección de servicio y colaborador | customer | `portals/customer/features/service-selection` |
| KAN-139 | Consulta de disponibilidad | customer | `portals/customer/features/availability` |
| KAN-145 | Gestión de reservaciones | customer | `portals/customer/features/booking-checkout` |
| KAN-150 | Mis reservaciones | customer | `portals/customer/features/my-bookings` |
| KAN-155 | Reprogramación y cancelación | customer | `portals/customer/features/booking-changes` |
| KAN-163 | Notificaciones y recordatorios | customer | `functions/src/notifications` (emails only) |
| KAN-168 | Settings / Perfil | customer | `portals/customer/features/profile` |
| KAN-174 | Gestión de negocios | admin | `portals/admin/features/businesses` |
| KAN-180 | Planes de suscripción | admin | `portals/admin/features/plans` |
| KAN-186 | Dashboard global | admin | `portals/admin/features/dashboard` |
| KAN-189 | Ticketing | admin | `portals/admin/features/support-tickets` |
| KAN-193 | Auditoría | admin | `portals/admin/features/audit-log` |

Proposed stories (`PROP-n`, `docs/decisions/open-questions.md`) are not Jira epics: PROP-3 and PROP-4 have their own folders above; PROP-1 (approve or reject a pending business) and PROP-2 (suspend a business) live in the KAN-174 spec, `portals/admin/features/businesses`. Each PROP story must be created in Jira before it is implemented.
