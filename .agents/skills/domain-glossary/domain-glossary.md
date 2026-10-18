Domain Glossary

This skill is the single source of truth for:

The English identifier of every business concept that appears in the backlog (Jira project KAN, written in Spanish).
Firestore collection names and the tenant key.
The status values of each entity and the only transitions allowed between them.

Precedence

Topic	Owner
Domain names, status values, transitions	this skill (wins over every other skill)
Who may trigger a transition, Firestore rules, tenant isolation	auth-and-roles
Visible labels for statuses and entities ("Confirmada", "No show")	i18n-standards — labels never live in these constants
File naming, as const, alphabetical keys, barrel exports	constants-standards
Reading/writing the entities	api-query-standards / api-mutation-standards

If another skill's example uses a name that contradicts this glossary, the glossary wins and the other skill must be fixed.

1. Actors and roles

Backlog (ES)	Code (EN)	Auth role (custom claim role)	Portal
Super administrador	super admin	super_admin	admin
Suscriptor (dueño del negocio)	subscriber	subscriber	business (everything of their own business)
Cliente (con cuenta)	customer	customer	customer
Visitante (sin cuenta)	visitor	— (unauthenticated, not a role)	landing, customer (read-only). Cannot book: signs in or signs up as a customer first (Q6)
Colaborador (empleado del negocio que atiende clientes, por ejemplo un barbero)	collaborator	collaborator (claims businessId, collaboratorId)	business, limited to the permissions the subscriber enables (CollaboratorPermission, KAN-86). Q1, 2026-09-28

2. Portals

Backlog (ES)	Code (EN)	Folder
Landing	landing	src/portals/landing/
Negocio	business	src/portals/business/ (subscriber and collaborators)
Cliente	customer	src/portals/customer/ (routes under /:businessSlug, Q4)
Admin	admin	src/portals/admin/

3. Entities

Backlog (ES)	Code (EN)	Firestore path	Notes
Negocio	Business	businesses/{businessId}	The tenant. Owned by one subscriber (ownerUserId). slug: unique, lowercase, URL-safe; the business page is /<slug> (Q4, see "Business slug" below). Created pending at subscriber sign-up (KAN-25) with planCheckoutId; the super admin approves it (activatedAt) or rejects it (rejectionReason), §4.3.
Usuario / cuenta	User	users/{userId}	Platform-wide account (subscriber, collaborator, customer or super admin). A customer's User stores fullName and phone (both required, KAN-123, Q6); email and password live in Firebase Auth.
Cliente del negocio	Customer	businesses/{businessId}/customers/{customerId}	Business-scoped record. userId is Nullable because a subscriber can add customers without an account (KAN-88). Blocking (KAN-93) and anonymizing (KAN-98) apply here only, never to User.
Servicio	Service	businesses/{businessId}/services/{serviceId}	collaboratorSelection (KAN-61): customer_choice (the customer may pick a collaborator or "any available", KAN-137, KAN-138) or automatic (the system assigns one, KAN-138). Which collaborators serve it is Collaborator.serviceIds.
Descuento / promoción	ServiceDiscount	field discounts on Service	KAN-60
Colaborador	Collaborator	businesses/{businessId}/collaborators/{collaboratorId}	Employee of the business who serves customers (Q1). userId is Nullable: set when the collaborator accepts the invitation (KAN-79). Fields: fullName, email, phone, status (§4.6), permissions (CollaboratorPermission[]), serviceIds (services they can serve, KAN-78, KAN-61). Written only by Cloud Functions (they also set claims).
Permiso del colaborador	CollaboratorPermission	values in Collaborator.permissions	Closed list (KAN-86): manage_bookings, manage_customers, manage_schedule_blocks, manage_services, view_reports. Never granted: subscription, business settings, business profile, collaborators.
Reserva / reservación / cita	Booking	businesses/{businessId}/bookings/{bookingId}	Stores serviceSnapshot (name, price, duration at booking time, KAN-62). customerUserId is the customer's account, Nullable only for bookings created by the subscriber for customers without an account (KAN-69). No guest fields: a booking from the customer portal always has customerUserId (Q6). collaboratorId is who serves it; Nullable only when the service has no collaborator assigned (the business serves it as one resource). Automatic assignment (KAN-138) is always resolved to one collaborator when the booking is created, so it is never null in that case.
Horario de atención	BusinessHours	field on Business	KAN-64
Bloqueo de agenda / día bloqueado	ScheduleBlock	businesses/{businessId}/scheduleBlocks/{scheduleBlockId}	Partial (KAN-65) or full-day (KAN-66). collaboratorId Nullable: null blocks the whole business; set, it is that collaborator's absence (vacation, sick leave, KAN-66).
Agenda	Schedule	— (view, not stored)	Bookings + schedule blocks in a calendar.
Horario disponible	TimeSlot	— (computed)	KAN-141
Políticas de reservación	BookingPolicy	field on Business	Cancellation/reschedule window and penalty (KAN-147, KAN-160).
Plan	Plan	plans/{planId}	Includes limits: maxBookings, maxCollaborators (KAN-181, KAN-85).
Contratación de plan (checkout)	PlanCheckout	planCheckouts/{planCheckoutId}	Created by the simulated checkout from the landing when the payment succeeds (KAN-22, Q7), before any account exists: planId, email, amountInCents, paidAt, termsAcceptedAt (KAN-23), signUpCompletedAt (Nullable; single use, KAN-25). The KAN-24 email links to the sign-up with it. Written only by Cloud Functions.
Suscripción	Subscription	businesses/{businessId}/subscription/current	One active subscription per business. Created active when the super admin approves the business (the period starts at approval, KAN-176); a pending or rejected business has none.
Pago / cobro	Payment	businesses/{businessId}/payments/{paymentId}	Simulated gateway (success or failure only, Q5). The checkout payment is copied here at sign-up. refundedAt (Nullable) is set when a pending business is rejected (simulated refund).
Comprobante	PaymentReceipt	— (generated file)	KAN-45
Ticket / consulta de soporte	SupportTicket	supportTickets/{supportTicketId}	Created by subscribers (PROP-3), answered by super admin (KAN-191).
Auditoría / log	AuditLogEntry	auditLog/{auditLogEntryId}	actionType from AUDIT_LOG_ACTION_TYPE (Q3, KAN-194): business_approved, business_rejected, business_suspended, business_reactivated, plan_created, plan_updated, plan_activated, plan_deactivated, plan_price_changed, platform_settings_updated.
Parámetros globales	PlatformSettings	platformSettings/current	Idle timeout, grace days, limits (KAN-182).
Notificación / alerta interna	Notification	users/{userId}/notifications/{notificationId}	KAN-101
Recordatorio	Reminder	— (scheduled Cloud Function)	KAN-100, KAN-165
Reporte	Report	— (computed)	KAN-102

Business public profile (KAN-199)

Business stores `name` and the optional public fields `logoUrl`, `description`, `contactPhone`, `contactEmail` and `socialLinks`. `socialLinks` is a list of `{ network, url }`, where `network` is one of `facebook`, `instagram`, `tiktok`, `website` or `whatsapp`, and `url` is HTTPS. The subscriber may edit these fields for their own active business. `slug`, `status` and `ownerUserId` remain protected.

Naming rules

The tenant key is always businessId. Never tenantId, companyId, shopId or storeId.
Use Booking everywhere. Never Appointment, Reservation or Cita in identifiers.
Use Customer for the person who books. Never Client (it clashes with queryClient and HTTP clients).
Prices are integers in minor units: priceInCents. Durations are integers with their unit: durationMinutes.
Dates are Date objects in domain models (startsAt, endsAt, createdAt). Converting from Firestore Timestamp belongs to the adapter in api-query-standards.
Every business stores its IANA timeZone. Never compute slots in the browser's time zone.

Business slug (Q4)

The customer portal lives under /:businessSlug/..., for example /barberia-centro/.... The slug identifies the business in the URL of the customer portal only; the business portal still takes businessId from the session (auth-and-roles).
Business.slug is unique across the platform, lowercase and URL-safe. The exact character rules and length are an assumption of the spec that creates the slug.
Static top-level routes (landing, auth, business, admin) win over the dynamic segment in React Router. Their segments are reserved slugs: RESERVED_BUSINESS_SLUG in src/shared/domain/business/BusinessSlug.constants.ts, checked with isReservedBusinessSlug. A business can never take one.
A new static top-level route adds its segment to RESERVED_BUSINESS_SLUG in the same PR (a unit test compares it with ROUTE_PATH).
The slug is chosen at subscriber sign-up (KAN-25, Q7), checked on the server against isReservedBusinessSlug and against existing slugs, and cannot be changed afterwards (PROP-4 shows it read-only).

Collaborators and availability (Q1)

Each active collaborator serves one booking at a time. A time slot is free for a service when at least one active collaborator who serves it (serviceIds) has no overlapping pending or confirmed booking and no ScheduleBlock of their own or of the whole business, inside the business hours.
With a chosen collaborator (KAN-137, KAN-142) only that collaborator's time counts. With "any available" or automatic (KAN-138) the server picks one free collaborator when the booking is created and stores it in collaboratorId.
A business with no collaborators, or a service with no collaborator assigned, is served by the business as one resource: one booking at a time, collaboratorId: null (assumption, collaborators spec AS-6).
An inactive or invited collaborator is never offered and never assigned. Deactivating a collaborator does not cancel their bookings (collaborators spec).

4. Status machines

Each machine lives in src/shared/domain/<entity>/ as:

<Entity>Status.constants.ts — the status object, its derived type and its transition map.
Everything is re-exported from src/shared/domain/index.ts and imported as @/shared/domain.

Terminal statuses have an empty transition list. A transition that is not in the map is forbidden in the UI and in firestore.rules.

4.1 Booking

created, business requires manual confirmation (KAN-70)
created, auto-confirmation (KAN-70)
subscriber confirms (KAN-70)
subscriber or customer cancels (KAN-72, KAN-159)
subscriber or customer cancels (KAN-72, KAN-159)
subscriber marks it done (KAN-73)
subscriber marks absence (KAN-74)
pending
confirmed
cancelled
completed
no_show

Rescheduling is not a status. It changes startsAt/endsAt on a pending or confirmed future booking and appends to rescheduleHistory (KAN-71, KAN-158).
A cancellation stores cancellation: { cancelledBy, isPenalized, note } (KAN-72, KAN-161).
completed and no_show are only allowed once startsAt has passed.

4.2 Subscription

super admin approves the business (PROP-1, KAN-176)
renewal charge failed (simulated gateway, Q5)
manual payment succeeds (KAN-45)
grace days exhausted (KAN-182)
period ends with cancelAtPeriodEnd = true (KAN-47)
new payment (KAN-45)
new payment (KAN-45)
active
past_due
expired
cancelled

The first Subscription is created active when the super admin approves a pending business (Q2, PROP-1, KAN-176). The plan comes from the business's PlanCheckout, and the period starts at approval: currentPeriodEndsAt = approval time + the plan's billing period. The checkout payment (KAN-22) pays that first period. There is no subscription status for "awaiting approval": a pending business simply has no Subscription yet.
If the business is rejected, no Subscription is ever created and its checkout Payment gets refundedAt (simulated refund). These two rules are assumptions of the admin businesses spec (AS-9, AS-10).
Cancelling (KAN-47) does not change the status immediately. It sets cancelAtPeriodEnd: true, and access stays full until currentPeriodEndsAt.
expired and cancelled make the business read-only (KAN-49). Enforcement belongs to auth-and-roles.
The simulated gateway only returns a successful or a failed payment (Q5, 2026-09-28). A failed renewal charge moves the subscription to past_due.
past_due stays in the machine, but nothing in the MVP drives retries: automatic renewal retries (KAN-48, duplicate KAN-50) are deferred (out of MVP). A past_due subscription leaves that status by a manual payment (KAN-45) or becomes expired when the grace days run out (KAN-182). Do not add retry counters, intervals or per-attempt notifications.

4.3 Business

subscriber signs up after a paid checkout (KAN-22, KAN-25)
super admin approves (PROP-1, KAN-176)
super admin rejects with a reason (PROP-1)
subscription becomes expired or cancelled (KAN-49)
subscription becomes active again (KAN-45)
super admin suspends (PROP-2)
super admin suspends (PROP-2)
super admin reactivates (KAN-179)
pending
active
rejected
inactive
suspended

pending means "paid, awaiting approval" (Q2, 2026-09-28). The subscriber can sign in and sees only the "under review" notice (KAN-33); the business has no public page and accepts no bookings.
rejected is terminal. Rejecting requires a reason (rejectionReason), which is emailed to the owner. The slug of a rejected business stays taken (assumption, admin businesses spec).
Approving and rejecting email the owner and write an AuditLogEntry (business_approved, business_rejected) in the same function transaction.
inactive is automatic (it follows the subscription). suspended is a manual super admin action (PROP-2), audited as business_suspended; KAN-179 reactivates (business_reactivated).
Only active is writable. pending, rejected, inactive and suspended are read-only for the business portal (auth-and-roles).

4.4 Support ticket

subscriber creates it (PROP-3)
super admin replies (KAN-191)
super admin resolves (KAN-192)
super admin resolves (KAN-192)
open
in_progress
resolved

"Cerrar" and "marcar como resuelto" (KAN-192) are the same transition. There is no reopen in the backlog.

4.5 Simple two-state entities

Entity	Statuses	Stories
Service	active ↔ inactive; delete only when inactive and without pending/confirmed bookings	KAN-57, KAN-58, KAN-59
Customer	active ↔ blocked; both directions require a note	KAN-93, KAN-94
Plan	active ↔ inactive; inactive plans are hidden from the catalog but keep their subscribers	KAN-184

4.6 Collaborator

subscriber registers the collaborator (KAN-78), invitation emailed (KAN-79)
collaborator accepts the invitation and sets a password (KAN-79)
subscriber deactivates (KAN-81)
subscriber reactivates (KAN-82)
invited
active
inactive

Only an active collaborator can sign in to the business portal, appears in the customer flow (KAN-136) and can be assigned bookings. firestore.rules check the status on every read.
An invited collaborator can be edited (KAN-80) and the invitation resent (KAN-84); there is no transition from invited to inactive in the backlog.
invited and active collaborators count against Plan.limits.maxCollaborators (KAN-85); reactivating checks the limit again.

Incorrect

ts
// Ad-hoc literals, a synonym for Booking, and an unchecked transition
const cancelAppointment = (appointment: { status: string }): void => {
  if (appointment.status === "confirmed" || appointment.status === "pending") {
    appointment.status = "canceled";
  }
};

Problems: appointment is a forbidden synonym, "canceled" does not exist (the value is "cancelled"), the allowed transitions are duplicated by hand, and the status type is a plain string.

Correct

ts
// src/shared/domain/stateMachine.ts
export type TransitionMap<Status extends string> = Readonly<
  Record<Status, readonly Status[]>
>;

export const canTransition = <Status extends string>(
  transitionMap: TransitionMap<Status>,
  currentStatus: Status,
  nextStatus: Status,
): boolean => transitionMap[currentStatus].includes(nextStatus);

ts
// src/shared/domain/booking/BookingStatus.constants.ts
import type { TransitionMap } from "../stateMachine";

export const BOOKING_STATUS = {
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  CONFIRMED: "confirmed",
  NO_SHOW: "no_show",
  PENDING: "pending",
} as const;

export type BookingStatus =
  (typeof BOOKING_STATUS)[keyof typeof BOOKING_STATUS];

export const CANCELLATION_ACTOR = {
  BUSINESS: "business",
  CUSTOMER: "customer",
} as const;

export type CancellationActor =
  (typeof CANCELLATION_ACTOR)[keyof typeof CANCELLATION_ACTOR];

export const BOOKING_STATUS_TRANSITIONS: TransitionMap<BookingStatus> = {
  [BOOKING_STATUS.CANCELLED]: [],
  [BOOKING_STATUS.COMPLETED]: [],
  [BOOKING_STATUS.CONFIRMED]: [
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.COMPLETED,
    BOOKING_STATUS.NO_SHOW,
  ],
  [BOOKING_STATUS.NO_SHOW]: [],
  [BOOKING_STATUS.PENDING]: [
    BOOKING_STATUS.CANCELLED,
    BOOKING_STATUS.CONFIRMED,
  ],
};

ts
// src/shared/domain/booking/Booking.interface.ts
import type { Nullable } from "@/shared/types";
import type {
  BookingStatus,
  CancellationActor,
} from "./BookingStatus.constants";

export interface ServiceSnapshot {
  durationMinutes: number;
  name: string;
  priceInCents: number;
}

export interface BookingCancellation {
  cancelledBy: CancellationActor;
  isPenalized: boolean;
  note: Nullable<string>;
}

export interface Booking {
  businessId: string;
  cancellation: Nullable<BookingCancellation>;
  collaboratorId: Nullable<string>;
  customerId: string;
  customerUserId: Nullable<string>;
  endsAt: Date;
  id: string;
  serviceId: string;
  serviceSnapshot: ServiceSnapshot;
  startsAt: Date;
  status: BookingStatus;
}

ts
// Consumer (for example, inside a ViewModel)
import {
  BOOKING_STATUS,
  BOOKING_STATUS_TRANSITIONS,
  canTransition,
  type Booking,
} from "@/shared/domain";

export const isBookingCancellable = (booking: Booking): boolean =>
  canTransition(
    BOOKING_STATUS_TRANSITIONS,
    booking.status,
    BOOKING_STATUS.CANCELLED,
  );

The TransitionMap<BookingStatus> annotation makes tsc fail if a status is missing from the map or an unknown status appears in it.

5. Decisions (log)

Source: docs/decisions/open-questions.md. No question is open: Q1–Q7 were decided on 2026-09-28. The table is kept as a decision log. If a new question opens, add it here as "Open" and, while it is open, do not invent names, statuses or fields for it; specs that depend on it are marked BLOCKED by backlog-to-spec.

Id	Question	Status	What it put in this glossary
Q1	Is the collaborator a fifth actor?	Decided (2026-09-28): yes, an employee of the business who serves customers; uses the business portal with the permissions the subscriber enables	Role collaborator (§1), Collaborator and CollaboratorPermission (§3), collaborator machine (§4.6), Booking.collaboratorId, ScheduleBlock.collaboratorId, Service.collaboratorSelection, Plan.limits.maxCollaborators, "Collaborators and availability" (§3).
Q2	Does a pending business status exist?	Decided (2026-09-28): yes, "paid, awaiting approval"; the super admin approves or rejects	Business pending and rejected (§4.3); first Subscription created at approval (§4.2).
Q3	Which "approvals" does KAN-194 audit?	Decided (2026-09-28): approval and rejection of new businesses, plus the other critical actions of KAN-194	AUDIT_LOG_ACTION_TYPE values on AuditLogEntry (§3).
Q4	How is a business page reached: slug, subdomain or search?	Decided (2026-09-28): slug in the path	Business.slug and the /:businessSlug segment (§2, §3). The slug is set at subscriber sign-up.
Q5	What does the simulated gateway do on automatic renewals? (KAN-48)	Decided (2026-09-28): success or failure only; retries deferred (out of MVP)	Nothing in the MVP. Retry count, interval and per-attempt notifications are out of MVP, not blocked (§4.2).
Q6	Can a visitor book without an account? (KAN-116)	Decided (2026-09-28): no, a customer account is mandatory	Booking has no guest fields; the customer's User has fullName and phone (§3).
Q7	Does the MVP include checkout, or start with a business created by hand?	Decided (2026-09-28): plan checkout from the landing with the simulated gateway	PlanCheckout (§3); [*] → pending for Business (§4.3).

When a decision is recorded, update this section and the affected machine in the same PR. A partially decided question stays BLOCKED for everything not yet decided.

6. Enforced by

Rule	Mechanism
No appointment, reservation or tenant in declared names	ESLint id-match (see eslint.config.js); property names are checked in review
Every status present in its transition map	tsc via the TransitionMap<Status> annotation
Alphabetical keys in status objects	ESLint sort-keys (see constants-standards)
Forbidden transitions rejected on the server	firestore.rules (see auth-and-roles)
Customer over Client	Code review only (no lint rule, because queryClient is legitimate)
Reserved slugs cover every static top-level route	Unit test src/shared/domain/tests/isReservedBusinessSlug.test.ts against ROUTE_PATH
Allowed and forbidden transitions of every machine	Unit test src/shared/domain/tests/canTransition.test.ts
A collaborator reads only inside their business, only while active, and only what their permissions allow	firestore.rules and tests/rules/collaborators.rules.test.ts

7. Checklist

 Every new identifier for a business concept matches the English name in §3.
 The tenant key is businessId.
 Status values come from <ENTITY>_STATUS constants. No string literals such as "confirmed".
 Status changes go through canTransition with the entity's transition map.
 No status, field or entity was added for an open question in §5 (none is open today; a new one is added there first).
 A collaborator-aware feature handles collaboratorId: null (business served as one resource) and never offers an invited or inactive collaborator.
 Super admin actions use an AUDIT_LOG_ACTION_TYPE value; a new audited action adds its value here and in the constant in the same PR.
 A new static top-level route has its segment in RESERVED_BUSINESS_SLUG.
 Visible labels for statuses come from i18n-standards, never from these constants.
 Money uses priceInCents, durations use durationMinutes, dates are Date in domain models.
