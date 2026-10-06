# Service management (KAN-30)

| Field | Value |
| --- | --- |
| Portal | business |
| Feature folder | `src/modules/business/features/services/` |
| Stories | KAN-54, KAN-55, KAN-56, KAN-57, KAN-58, KAN-59, KAN-60, KAN-61, KAN-62 |
| Status | Ready |
| Depends on | KAN-28 (subscriber sign-in, session and `businessId` claim); KAN-32 / KAN-49 (read-only business); KAN-63 (bookings used by KAN-59 and KAN-62); KAN-111 (public catalog KAN-113, discounts shown in KAN-115); KAN-77 collaborators (Q1 decided 2026-09-28: `Collaborator.serviceIds`; permission `manage_services`, KAN-86) |

## Intent
The subscriber builds and maintains the catalog of services their business offers: creates, edits, lists, activates, deactivates and deletes services, and sets time-limited discounts. Bookings keep the price and duration that were valid when they were made, so later edits never change past bookings or revenue reports.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own business only) | Create, list, search, edit, activate, deactivate and delete their own business's services, and manage their discounts, while the business is `active`. Only list and view while the business is `inactive` or `suspended` (KAN-49). |
| customer / visitor | See only `active` services in the public catalog (KAN-113); not part of this spec. |
| super admin | Not part of this spec. |
| collaborator (own business, while `active`) | With `manage_services` (KAN-86): the same as the subscriber in this spec. Without it: nothing here. |

The business always comes from the session, never from the URL. A subscriber never sees or changes another business's services.

## In scope
- Service form (create and edit) with name, description, price, approximate duration, image and additional features (KAN-54, KAN-56).
- Paginated service list with search by name prefix and filter by status (KAN-55).
- Status changes `active` ↔ `inactive` (KAN-57, KAN-58).
- Deletion of `inactive` services without `pending` or `confirmed` bookings (KAN-59).
- Discounts on a service: percentage or fixed amount, with a validity date range (KAN-60).
- Assigning collaborators to a service and choosing whether the customer picks one or the system assigns one (KAN-61).
- Snapshot of name, price and duration on every booking (KAN-62).

## Out of scope
- Registering and managing collaborators (specified in KAN-77 epic).
- A discount type called "reservas" (see Backlog issues) until the product team clarifies it.
- Plan limits on the number of services (specified in KAN-181, admin plans epic).
- How customers see services and discounts (specified in KAN-113 to KAN-115).
- Booking creation flow itself (specified in KAN-69, KAN-148); this spec only defines what the booking stores from the service.

## Data
- `Service` at `businesses/{businessId}/services/{serviceId}` (`domain-glossary` §3). Fields used: `name`, `description`, `priceInCents`, `durationMinutes`, `status` (`active` | `inactive`, `domain-glossary` §4.5), `searchName` (normalized name for prefix search, `api-query-standards` §6), `discounts` (`ServiceDiscount`, KAN-60).
- **New fields:** `imageUrl` (Nullable, the service image), `features` (list of short text items for "more characteristics"). `ServiceDiscount`: `type` (`percentage` | `fixed_amount`), `value` (percent, or amount in cents), `startsAt`, `endsAt`.
- `Booking.serviceSnapshot` (`name`, `priceInCents`, `durationMinutes`) — `domain-glossary` §3 and the `Booking` interface (KAN-62).
- `Business` status (`active`, `inactive`, `suspended`) decides whether writes are allowed (KAN-49).
- **New field (KAN-61):** `collaboratorSelection` on `Service`: `customer_choice` | `automatic` (glossary §3). Which collaborators serve the service is stored in `Collaborator.serviceIds` (collaborators spec); this screen edits it from the service side.

## Acceptance criteria

### KAN-54 — Create a service
- [x] **AC-KAN-54-01** · happy · Given a subscriber of an `active` business on the new-service form, when they enter a name, description, price, approximate duration and optionally an image and additional features, and save, then the service is created in their business with those values (price stored as `priceInCents`, duration as `durationMinutes`), it appears in their service list, and its status is `active`. See AS-1. [KAN-54]
- [x] **AC-KAN-54-02** · error · Given the form with an empty name, price or duration, when the subscriber saves, then nothing is created and `validation:required` is shown next to each empty field. [KAN-54]
- [x] **AC-KAN-54-03** · error · Given a price below zero or a duration of zero or less, or a duration above the maximum, when the subscriber saves, then nothing is created and `validation:outOfRange` is shown next to the field. See AS-3. [KAN-54]
- [x] **AC-KAN-54-04** · error · Given a name or description longer than the allowed length, when the subscriber saves, then nothing is created and `validation:tooLong` is shown. See AS-4. [KAN-54]
- [x] **AC-KAN-54-05** · error · Given an image that is not an allowed image type or is larger than the allowed size, when the subscriber selects it, then it is not attached and `business:services.form.imageInvalidError` is shown; the rest of the form keeps its values. See AS-5. [KAN-54]
- [x] **AC-KAN-54-06** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to create a service, then the create action is disabled or rejected, nothing is created and `business:errors.readOnly` is shown. [KAN-54, KAN-49]
- [x] **AC-KAN-54-07** · error · Given the save request fails because of the network, when the subscriber saves, then no service is created, the form keeps the entered values and `common:errors.network` is shown. [KAN-54]
- [x] **AC-KAN-54-08** · edge · Given a price entered with decimals in the business currency (for example 12.50), when the service is saved, then it is stored as the matching whole number of cents (1250) and shown back formatted in the business currency. [KAN-54]
- [x] **AC-KAN-54-09** · edge · Given the subscriber adds several additional features, when they reorder or remove one before saving, then the saved service keeps exactly the remaining features in the chosen order; empty feature rows are discarded. See AS-6. [KAN-54]

### KAN-55 — View and filter services
- [ ] **AC-KAN-55-01** · happy · Given a subscriber whose business has services, when they open the service list, then they see one page of their own business's services with name, price in the business currency, duration and a status badge, and a total count. [KAN-55]
- [ ] **AC-KAN-55-02** · happy · Given the list, when the subscriber types part of a service name, then only services whose name starts with that text are listed, ignoring case and accents. See AS-7. [KAN-55]
- [ ] **AC-KAN-55-03** · happy · Given the list, when the subscriber filters by status `active` or `inactive`, then only services with that status are listed and the total count matches the filter. [KAN-55]
- [ ] **AC-KAN-55-04** · error · Given loading the list fails because of the network, when the subscriber opens it, then an error state with `common:errors.network` and a retry action is shown instead of an empty list. [KAN-55]
- [ ] **AC-KAN-55-05** · edge · Given a business with no services, when the subscriber opens the list, then an empty state with `business:services.list.emptyTitle` and a create action is shown. [KAN-55]
- [ ] **AC-KAN-55-06** · edge · Given a search or filter with no matches, when it is applied, then `business:services.list.noResults` is shown and the filters can be cleared. [KAN-55]
- [ ] **AC-KAN-55-07** · edge · Given more services than one page holds, when the subscriber moves to the next or previous page, then the next or previous page is shown and changing a filter or search returns to the first page. [KAN-55]
- [ ] **AC-KAN-55-08** · edge · Given a subscriber whose business is `inactive` or `suspended`, when they open the list, then they can still view and search their services, and the create, edit and status actions are disabled. [KAN-55, KAN-49]

### KAN-56 — Edit a service
- [ ] **AC-KAN-56-01** · happy · Given a subscriber and one of their services, when they change any of its fields and save, then the service shows the new values in the list and in its detail. [KAN-56]
- [ ] **AC-KAN-56-02** · error · Given an edit that clears a required field or puts a value out of range, when the subscriber saves, then the service is not changed and `validation:required` or `validation:outOfRange` is shown next to the field. [KAN-56]
- [ ] **AC-KAN-56-03** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to edit a service, then nothing changes and `business:errors.readOnly` is shown. [KAN-56, KAN-49]
- [ ] **AC-KAN-56-04** · error · Given the service was deleted in the meantime (for example in another tab), when the subscriber saves, then nothing is written and `common:errors.notFound` is shown. [KAN-56]
- [ ] **AC-KAN-56-05** · error · Given the save request fails because of the network, when the subscriber saves, then the service keeps its previous values, the form keeps the edited values and `common:errors.network` is shown. [KAN-56]
- [ ] **AC-KAN-56-06** · edge · Given a service with existing bookings, when its price or duration is edited, then those bookings keep their original values (KAN-62) and only bookings created afterwards use the new values. [KAN-56, KAN-62]

### KAN-57 — Activate a service
- [ ] **AC-KAN-57-01** · happy · Given a subscriber and an `inactive` service of their business, when they activate it, then its status becomes `active`, the badge updates immediately and the service appears in the public catalog (KAN-113). [KAN-57]
- [ ] **AC-KAN-57-02** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to activate a service, then nothing changes and `business:errors.readOnly` is shown. [KAN-57, KAN-49]
- [ ] **AC-KAN-57-03** · error · Given the request fails because of the network, when the subscriber activates a service, then the badge returns to `inactive` and `common:errors.network` is shown. [KAN-57]
- [ ] **AC-KAN-57-04** · edge · Given a newly created service, when it is saved, then it is already `active` without a separate activation step (AS-1); the activate action is only offered on `inactive` services. [KAN-57]

### KAN-58 — Deactivate a service
- [ ] **AC-KAN-58-01** · happy · Given a subscriber and an `active` service of their business, when they deactivate it and confirm, then its status becomes `inactive`, it disappears from the public catalog (KAN-113) and it stays visible in their own list with its status badge. [KAN-58]
- [ ] **AC-KAN-58-02** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to deactivate a service, then nothing changes and `business:errors.readOnly` is shown. [KAN-58, KAN-49]
- [ ] **AC-KAN-58-03** · error · Given the request fails because of the network, when the subscriber confirms, then the service keeps its previous status and `common:errors.network` is shown. [KAN-58]
- [ ] **AC-KAN-58-04** · edge · Given an `active` service with `confirmed` future bookings, when it is deactivated, then those bookings are kept. See AS-2. [KAN-58]
- [ ] **AC-KAN-58-05** · edge · Given the confirmation dialog, when the subscriber cancels it, then the service stays `active`. [KAN-58]

### KAN-59 — Delete a deactivated service
- [ ] **AC-KAN-59-01** · happy · Given a subscriber and an `inactive` service with no `pending` or `confirmed` bookings, when they delete it and confirm, then the service no longer appears in their list and the total count decreases by one. [KAN-59]
- [ ] **AC-KAN-59-02** · error · Given an `inactive` service with at least one `pending` or `confirmed` booking, when the subscriber tries to delete it, then the service is not deleted and `business:services.delete.hasBookingsError` is shown. [KAN-59]
- [ ] **AC-KAN-59-03** · error · Given an `active` service, when the subscriber looks for the delete action, then it is not offered; a delete request for an `active` service is rejected and `business:services.delete.mustBeInactiveError` is shown. [KAN-59]
- [ ] **AC-KAN-59-04** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to delete a service, then nothing is deleted and `business:errors.readOnly` is shown. [KAN-59, KAN-49]
- [ ] **AC-KAN-59-05** · error · Given the request fails because of the network, when the subscriber confirms the deletion, then the service is still listed and `common:errors.network` is shown. [KAN-59]
- [ ] **AC-KAN-59-06** · edge · Given an `inactive` service whose only bookings are `completed`, `cancelled` or `no_show`, when it is deleted, then the deletion succeeds and those past bookings still show the service name, price and duration from their snapshot (KAN-62). [KAN-59, KAN-62]
- [ ] **AC-KAN-59-07** · edge · Given a customer creates a `pending` booking for the service at the same moment the subscriber deletes it, when both requests arrive, then either the booking is rejected or the deletion is rejected with `business:services.delete.hasBookingsError`; never both succeed. [KAN-59]

### KAN-60 — Discounts and promotions on a service
- [ ] **AC-KAN-60-01** · happy · Given a subscriber and one of their services, when they add a percentage discount with a start and end date and save, then the discount is stored on the service and shown in the service detail with its value and validity dates in the business `timeZone`. [KAN-60]
- [ ] **AC-KAN-60-02** · happy · Given a subscriber and one of their services, when they add a fixed-amount discount with a validity range and save, then the discount is stored with its amount in cents and shown in the business currency. [KAN-60]
- [ ] **AC-KAN-60-03** · happy · Given a service with a discount valid today, when a booking for it is created within the validity range, then the price applied to the booking is the discounted price. See AS-9. [KAN-60, KAN-62]
- [ ] **AC-KAN-60-04** · error · Given a percentage outside 1–100, or a fixed amount of zero or greater than or equal to the service price, when the subscriber saves the discount, then it is not saved and `validation:outOfRange` is shown. See AS-8. [KAN-60]
- [ ] **AC-KAN-60-05** · error · Given an end date earlier than the start date, when the subscriber saves the discount, then it is not saved and `business:services.discounts.invalidDateRangeError` is shown. [KAN-60]
- [ ] **AC-KAN-60-06** · error · Given a discount whose validity overlaps another discount of the same service, when the subscriber saves it, then it is not saved and `business:services.discounts.overlapError` is shown. See AS-10. [KAN-60]
- [ ] **AC-KAN-60-07** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to add, change or remove a discount, then nothing changes and `business:errors.readOnly` is shown. [KAN-60, KAN-49]
- [ ] **AC-KAN-60-08** · error · Given the request fails because of the network, when the subscriber saves a discount, then the service keeps its previous discounts and `common:errors.network` is shown. [KAN-60]
- [ ] **AC-KAN-60-09** · edge · Given a discount whose end date has passed, when the subscriber views the service, then the discount is shown as expired and is no longer applied to new bookings; dates are evaluated in the business `timeZone`, including the full end day. See AS-11. [KAN-60]
- [ ] **AC-KAN-60-10** · edge · Given an `inactive` service, when it has a valid discount, then the discount is not shown to customers because the service is not in the public catalog. [KAN-60, KAN-58]

### KAN-61 — Assign one or more collaborators to a service and decide whether the customer chooses or the system assigns one
- [ ] **AC-KAN-61-01** · happy · Given a service and the business's `active` and `invited` collaborators, when the subscriber selects which collaborators serve it and saves, then each selected collaborator's `serviceIds` includes the service, each unselected one's does not, and the service detail lists them. [KAN-61]
- [ ] **AC-KAN-61-02** · happy · Given a service with collaborators, when the subscriber chooses `business:services.collaborators.selection.customerChoice` or `business:services.collaborators.selection.automatic` and saves, then `collaboratorSelection` is stored as `customer_choice` or `automatic`, and the customer flow offers a collaborator choice only for `customer_choice` (KAN-137, KAN-138). [KAN-61]
- [ ] **AC-KAN-61-03** · edge · Given a service with no collaborator selected, when it is saved, then it is served by the business as one resource (`Booking.collaboratorId` = `null`, glossary §3) and the selection option is hidden. [KAN-61]
- [ ] **AC-KAN-61-04** · edge · Given a collaborator with future `pending` or `confirmed` bookings of the service, when the subscriber removes them from it, then those bookings are kept and `business:collaborators.edit.serviceHasBookingsWarning` shows their count (AC-KAN-80-04). [KAN-61, KAN-80]
- [ ] **AC-KAN-61-05** · error · Given a subscriber whose business is `inactive` or `suspended`, when they try to change the collaborators or the selection mode, then nothing changes and `business:errors.readOnly` is shown. [KAN-61, KAN-49]
- [ ] **AC-KAN-61-06** · error · Given the request fails because of the network, when the subscriber saves, then the service and the collaborators keep their previous values and `common:errors.network` is shown. [KAN-61]
- [ ] **AC-KAN-61-07** · error · Given a collaborator without `manage_services`, when they open the service collaborators screen, then they are sent to the business portal home and a direct write is rejected with `common:errors.permissionDenied`. [KAN-61, KAN-86]

### KAN-62 — Keep price and duration as they were at booking time
- [ ] **AC-KAN-62-01** · happy · Given a service with a name, price and duration, when a booking for it is created (by a customer or by the subscriber, KAN-69), then the booking stores a snapshot of the name, price (`priceInCents`) and duration (`durationMinutes`) valid at that moment. [KAN-62]
- [ ] **AC-KAN-62-02** · happy · Given existing bookings of a service, when the subscriber later changes its name, price or duration, then those bookings and any revenue figure built from them (KAN-103) still show the values of their snapshot. [KAN-62]
- [ ] **AC-KAN-62-03** · error · Given a service that is `inactive` or was deleted, when a new booking for it is requested, then no booking and no snapshot are written and `business:services.snapshot.serviceUnavailableError` is shown to whoever requested it. [KAN-62]
- [ ] **AC-KAN-62-04** · edge · Given the subscriber saves a new price at the same moment a booking is being created, when both complete, then the booking snapshot holds exactly one consistent version of the service (all old values or all new values), never a mix. [KAN-62]
- [ ] **AC-KAN-62-05** · edge · Given a booking whose service was later deleted (KAN-59), when it is shown in the agenda or history, then its name, price and duration come from the snapshot and no `common:errors.notFound` is shown. [KAN-62, KAN-59]

## BLOCKED
None. All open architectural questions (Q1–Q7) were resolved on 2026-09-28 and none block service management.

## Deferred (out of MVP)
None.

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | A newly created service starts as `active`. KAN-57 says "activate new services", which could mean new services start `inactive`; the team confirms. | AC-KAN-54-01, AC-KAN-57-04 |
| AS-2 | Deactivating a service does not cancel existing bookings; it only hides the service for new bookings. | AC-KAN-58-04 |
| AS-3 | Duration is between 5 and 480 minutes in steps of 5; price is 0 or more (0 allowed for free services). | AC-KAN-54-03, AC-KAN-56-02 |
| AS-4 | Name 2–80 characters, description up to 1000 characters, each additional feature up to 80 characters. | AC-KAN-54-02, AC-KAN-54-04 |
| AS-5 | One image per service, JPEG, PNG or WebP, up to 2 MB. The image is optional; KAN-54 writes "(imagen)" after the duration, which is read as a separate optional field. | AC-KAN-54-05 |
| AS-6 | "More characteristics" means a free list of up to 10 short text items (`features`), not structured attributes. | AC-KAN-54-09 |
| AS-7 | Search is by name prefix only (normalized `searchName`), not by description. | AC-KAN-55-02 |
| AS-8 | A fixed-amount discount must be lower than the service price, so the final price is never zero or negative. | AC-KAN-60-04 |
| AS-9 | The booking snapshot `priceInCents` stores the final price after the discount. Whether the original price is also kept is for the team to decide. | AC-KAN-60-03 |
| AS-10 | At most one discount is valid per service on a given day; overlapping ranges are rejected, discounts never stack. | AC-KAN-60-06 |
| AS-11 | A discount is valid from 00:00 of its start date to 23:59 of its end date in the business `timeZone`, evaluated on the booking's creation time (not on the booking date). | AC-KAN-60-03, AC-KAN-60-09 |
| AS-12 | The default `collaboratorSelection` is `customer_choice`; with `customer_choice` the customer may still choose "any available" (KAN-138). | AC-KAN-61-02 |
| AS-13 | Assignments are stored on the collaborator side only (`Collaborator.serviceIds`); `Service` keeps no list of collaborators, so there is one source of truth. | AC-KAN-61-01 |

## Backlog issues
- KAN-60 lists "reservas" as a discount type next to percentage and fixed amount. Its meaning is unclear (for example "N bookings for the price of M", or "a discount for the first N bookings"). Only percentage and fixed amount are specified; the product owner should clarify or remove it.
- KAN-57 "activar servicios ya sean nuevos o desactivados" suggests new services start inactive, which conflicts with the usual create flow; recorded as AS-1.
- KAN-54 writes "duración aproximada (imagen)", mixing the duration and the image in one phrase; read as two separate fields (AS-5).
- KAN-61 (collaborator assignment) belongs to the collaborator topic (KAN-77 epic) but sits in this epic; it edits the same `Collaborator.serviceIds` as KAN-78 / KAN-80.
- KAN-62 is a system rule shared with booking creation (KAN-69, KAN-148); it is specified here and referenced from those specs to avoid duplicate criteria.
- KAN-60 overlaps KAN-115 (customer sees discounts): this spec only covers how the subscriber sets them.

## Non-functional
- i18n keys (new prefixes): `business:services.form.*`, `business:services.list.*`, `business:services.delete.*`, `business:services.discounts.*`, `business:services.snapshot.*`, `business:services.status.*` (activate / deactivate confirmation texts), `business:services.collaborators.*`. Reused: `validation:required`, `validation:outOfRange`, `validation:tooLong`, `common:errors.network`, `common:errors.notFound`, `business:errors.readOnly`.
- Theming: Full support for light and dark modes using Tailwind CSS v4 semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-card`). No static palette colors.
- Pagination: cursor pagination with `PAGINATION.DEFAULT_PAGE_SIZE`, total count from the server, filters and search kept in the URL and reset to page one on change (`api-query-standards` §5–6). Search input debounced.
- Delete runs through the `deleteService` callable so the booking check happens on the server; status toggles (KAN-57/58) may update optimistically with rollback (`api-mutation-standards`).
- Snapshot (KAN-62) is written inside the booking transaction on the server.
- Tenant isolation: every read and write uses the session `businessId`; Firestore rules deny writes when the business is not `active`.
- Money shown from `priceInCents` in the business currency; discount dates in the business `timeZone`.
- Idle logout (KAN-38) applies on every screen of this feature; no reCAPTCHA (authenticated screens).
- Accessibility (WCAG 2.1 AA):
  - Status badges have an explicit text label and icon, not relying on color alone.
  - Confirmation dialogs for deactivate and delete trap focus, announce headings via ARIA, and are fully keyboard operable (Escape to dismiss, Tab/Shift-Tab cycle).
  - The image upload field has alt text taken from the service name and accessible drag-and-drop / file selector controls.
  - Interactive table rows, pagination controls, and action buttons meet minimum touch target sizes (44x44 CSS px) and show visible focus indicators (`focus-visible:ring-2`).

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-54 | AC-KAN-54-01 … AC-KAN-54-09 | `src/modules/business/features/services/tests/ServiceFormPage.test.tsx` |
| KAN-55 | AC-KAN-55-01 … AC-KAN-55-08 | `src/modules/business/features/services/tests/ServiceListPage.test.tsx` |
| KAN-56 | AC-KAN-56-01 … AC-KAN-56-06 | `src/modules/business/features/services/tests/ServiceFormPage.test.tsx` |
| KAN-57 | AC-KAN-57-01 … AC-KAN-57-04 | `src/modules/business/features/services/tests/ServiceListPage.test.tsx` |
| KAN-58 | AC-KAN-58-01 … AC-KAN-58-05 | `src/modules/business/features/services/tests/ServiceListPage.test.tsx` |
| KAN-59 | AC-KAN-59-01 … AC-KAN-59-05 | `src/modules/business/features/services/tests/ServiceListPage.test.tsx` |
| KAN-59 | AC-KAN-59-02, AC-KAN-59-06, AC-KAN-59-07 | `functions/src/services/tests/deleteService.test.ts` |
| KAN-60 | AC-KAN-60-01, AC-KAN-60-02, AC-KAN-60-04 … AC-KAN-60-10 | `src/modules/business/features/services/tests/ServiceDiscountsPage.test.tsx` |
| KAN-60 | AC-KAN-60-03 | `functions/src/bookings/tests/createBooking.test.ts` |
| KAN-61 | AC-KAN-61-01 … AC-KAN-61-07 | `src/modules/business/features/services/tests/ServiceCollaboratorsPage.test.tsx` |
| KAN-62 | AC-KAN-62-01, AC-KAN-62-03, AC-KAN-62-04 | `functions/src/bookings/tests/createBooking.test.ts` |
| KAN-62 | AC-KAN-62-02, AC-KAN-62-05 | `src/modules/business/features/services/tests/ServiceFormPage.test.tsx` |
