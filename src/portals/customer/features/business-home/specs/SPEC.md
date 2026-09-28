# Business home page (KAN-111)

| Field | Value |
| --- | --- |
| Portal | customer |
| Feature folder | `src/portals/customer/features/business-home/` |
| Stories | KAN-112, KAN-113, KAN-114, KAN-115, KAN-116 |
| Status | Draft |
| Depends on | Q4 decided 2026-09-28 (business pages under `/:businessSlug`, `Business.slug`); Q6 decided 2026-09-28 (a customer account is mandatory to book); customer sign-up spec (KAN-122) and customer sign-in (KAN-128, `src/features/auth`) for the visitor path of KAN-116; KAN-30 service management (catalog data, discounts KAN-60); KAN-64 business hours; `service-selection` spec (KAN-134); customer layout spec (KAN-96, KAN-117) |

## Intent
A person who opens a business's page in the customer portal learns what the business is and what it offers: general information, the catalog of active services with their details and current promotions. A signed-in customer can start a booking directly from the service they want; a visitor who tries to book is asked to sign in or sign up first and then continues at the same service (Q6).

## Actors and permissions
| Actor | Can |
| --- | --- |
| visitor (not signed in) | See the business information, catalog, service details and discounts (public, read-only). Choosing to book sends them to sign in or sign up (Q6) |
| customer | Everything a visitor can, plus start a booking from a service |

## In scope
- General business information on the business home page.
- Catalog of the business's `active` services.
- Service detail: name, description, price, duration.
- Current discounts on services.
- Starting the booking flow from a service for a signed-in customer.
- Identifying the business from the slug in the URL (`/<businessSlug>`, Q4).
- The visitor path of KAN-116: sign in or sign up, then return to the booking flow at the same service (Q6).

## Out of scope
- Booking without an account: not offered (Q6 decided: a customer account is mandatory).
- The sign-in and sign-up screens themselves (KAN-128, KAN-122); this spec only sends the visitor there and defines where they return.
- Creating or changing a business slug (set when the business is created, KAN-176 / Q7).
- The booking steps after the service is chosen (KAN-134, KAN-139, KAN-145).
- Search or filters in the catalog (no story asks for them).
- How the subscriber enters the business profile or services (KAN-30).

## Data
- `Business` (public read): `slug` (looked up from the URL, `domain-glossary` §3), `name`, `status`, `timeZone`, `currency` (AS-1), `BusinessHours` (KAN-64), and the public profile fields `logoUrl`, `description` (AS-1).
- `Service` (`businesses/{businessId}/services/{serviceId}`, public read when `active`): `name`, `description`, `priceInCents`, `durationMinutes`, `status`, `discounts` (`ServiceDiscount`, KAN-60), image (AS-5).
- `Customer` (`businesses/{businessId}/customers/{customerId}`): its `blocked` status is checked on the server (customers cannot read this collection) to decide whether a booking can start (AS-8).
- No writes.

## Acceptance criteria

### KAN-112 — See the business's general information
- [ ] **AC-KAN-112-01** · happy · Given a visitor or customer on a business's pages, when the business home page loads, then it shows the business `name`, logo, `description` and its business hours, with times in the business `timeZone`. [KAN-112]
- [ ] **AC-KAN-112-02** · error · Given the business does not exist, when the customer opens its home page, then `common:errors.notFound` is shown and no catalog is shown. [KAN-112]
- [ ] **AC-KAN-112-03** · error · Given the business data cannot be loaded because of the network, when the page loads, then `common:errors.network` is shown with a retry action. [KAN-112]
- [ ] **AC-KAN-112-04** · edge · Given a customer whose device is in a different time zone from the business, when business hours are shown, then they are shown in the business `timeZone` and that time zone is indicated. [KAN-112]
- [ ] **AC-KAN-112-05** · edge · Given a business with no `description` or no logo, when the page loads, then the missing parts are hidden without empty placeholders. [KAN-112]
- [ ] **AC-KAN-112-06** · edge · Given a business whose status is `inactive` or `suspended`, when the customer opens its home page, then `customer:businessHome.business.unavailable` is shown and no booking can be started. See AS-2. [KAN-112, KAN-49]
- [ ] **AC-KAN-112-07** · happy · Given a business whose `slug` is `<businessSlug>`, when a visitor or customer opens `/<businessSlug>`, then the home page of that business loads, and every page of the customer portal for that business stays under `/<businessSlug>/...`. [KAN-112]
- [ ] **AC-KAN-112-08** · edge · Given a URL whose slug differs from an existing business's `slug` only in letter case, when it is opened, then the person is redirected to the lowercase URL of that business. See AS-10. [KAN-112]
- [ ] **AC-KAN-112-09** · edge · Given a top-level segment that is a reserved slug (`RESERVED_BUSINESS_SLUG`, for example the business or admin portal), when it is opened, then the matching static page opens and never a business home page. [KAN-112]

### KAN-113 — Browse the catalog of available services
- [ ] **AC-KAN-113-01** · happy · Given a business with `active` services, when the customer is on its home page, then the catalog lists only its `active` services, each with name, price (from `priceInCents` in the business currency) and `durationMinutes`. [KAN-113]
- [ ] **AC-KAN-113-02** · error · Given the catalog cannot be loaded because of the network, when the page loads, then `common:errors.network` is shown with a retry action and the business information stays visible. [KAN-113]
- [ ] **AC-KAN-113-03** · edge · Given a business with no `active` services, when the catalog loads, then the empty state `customer:businessHome.catalog.empty` is shown and no booking action is offered. [KAN-113]
- [ ] **AC-KAN-113-04** · edge · Given a business with more `active` services than one page holds, when the customer reaches the end of the loaded list, then they can load the next page; the whole collection is never loaded at once. See AS-3. [KAN-113]
- [ ] **AC-KAN-113-05** · edge · Given a service that is `inactive`, when the catalog loads, then it does not appear, not even to a signed-in customer who booked it before. [KAN-113, KAN-58]

### KAN-114 — See the details of a service
- [ ] **AC-KAN-114-01** · happy · Given an `active` service in the catalog, when the customer opens its details, then they see its name, description, price (from `priceInCents` in the business currency) and duration (`durationMinutes`). [KAN-114]
- [ ] **AC-KAN-114-02** · error · Given a service that was deactivated or deleted after the catalog was loaded, when the customer opens its details, then `common:errors.notFound` is shown and the catalog is refreshed. [KAN-114, KAN-58]
- [ ] **AC-KAN-114-03** · error · Given the details cannot be loaded because of the network, when the customer opens them, then `common:errors.network` is shown with a retry action. [KAN-114]
- [ ] **AC-KAN-114-04** · edge · Given a service with a duration of 60 minutes or more, when its duration is shown, then it is shown in hours and minutes. See AS-4. [KAN-114]
- [ ] **AC-KAN-114-05** · edge · Given a service without an image or description, when its details are shown, then the missing parts are hidden without empty placeholders. See AS-5. [KAN-114]

### KAN-115 — See current discounts and promotions
- [ ] **AC-KAN-115-01** · happy · Given an `active` service with a percentage or fixed-amount discount whose validity period includes today (in the business `timeZone`), when the catalog or the service details are shown, then the original price is shown struck through next to the discounted price and a discount badge (`customer:businessHome.discount.badge`). [KAN-115, KAN-60]
- [ ] **AC-KAN-115-02** · error · Given a discount whose data is incomplete or invalid (no value, or a validity end before its start), when the service is shown, then the discount is ignored and the service is shown at its regular price. [KAN-115]
- [ ] **AC-KAN-115-03** · edge · Given a discount whose validity period has ended or not started yet in the business `timeZone`, when the service is shown, then no discount is shown. [KAN-115]
- [ ] **AC-KAN-115-04** · edge · Given a fixed-amount discount larger than the service price, when the discounted price is shown, then it is never below zero. See AS-6. [KAN-115]
- [ ] **AC-KAN-115-05** · edge · Given a service with more than one current discount, when it is shown, then only one discounted price is shown. See AS-7. [KAN-115]

### KAN-116 — Start a booking from a service (signed-in customer)
- [ ] **AC-KAN-116-01** · happy · Given a signed-in customer on a business's pages and an `active` service, when they choose to book that service (from the catalog or its details), then the booking flow opens with that service already selected (KAN-135). [KAN-116, KAN-135]
- [ ] **AC-KAN-116-02** · error · Given the service was deactivated after the page was loaded, when the customer chooses to book it, then the booking flow does not open, `customer:businessHome.booking.serviceUnavailable` is shown and the catalog is refreshed. [KAN-116, KAN-58]
- [ ] **AC-KAN-116-03** · error · Given a signed-in customer whose `Customer` record at this business is `blocked` (KAN-93), when they choose to book a service, then the booking flow does not open and `customer:businessHome.booking.customerBlocked` is shown. See AS-8. [KAN-116, KAN-93]
- [ ] **AC-KAN-116-04** · error · Given a business whose status is `inactive` or `suspended`, when the customer is on its pages, then no book action is offered. See AS-2. [KAN-116, KAN-49]
- [ ] **AC-KAN-116-05** · happy · Given a visitor (not signed in) on a business's pages and an `active` service, when they choose to book that service, then the booking flow does not open, they are sent to sign-in with `customer:businessHome.booking.signInRequired` and an action to sign up instead, and, after signing in as a `customer`, they return to the booking flow of the same business with that service already selected (KAN-135). See AS-11. [KAN-116, KAN-128, KAN-135]
- [ ] **AC-KAN-116-06** · happy · Given a visitor without an account who chose to book a service and then chose to sign up, when they finish sign-up (KAN-123) and sign in (KAN-127), then they return to the booking flow of the same business with that service already selected. See AS-12. [KAN-116, KAN-123, KAN-127]
- [ ] **AC-KAN-116-07** · error · Given a visitor sent to sign-in from a book action, when they sign in with an account whose role is not `customer` (`subscriber` or `super_admin`), then the booking flow does not open and they go to their own portal (`auth-and-roles` §3). [KAN-116]
- [ ] **AC-KAN-116-08** · error · Given a visitor chose to book a service that is deactivated while they sign in or sign up, when they return, then the booking flow does not open with that service, `customer:businessHome.booking.serviceUnavailable` is shown and the catalog is refreshed. [KAN-116, KAN-58]
- [ ] **AC-KAN-116-09** · edge · Given a visitor sent to sign-in from a book action, when they cancel and go back, then they are on the same business's pages, still signed out, and nothing was stored. [KAN-116]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| — | — | None. Q4 (URL `/<businessSlug>`) and Q6 (account mandatory; visitor path AC-KAN-116-05 … AC-KAN-116-09) were decided on 2026-09-28. |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | `Business` has public fields `currency` (ISO 4217 code), `logoUrl` and `description`; the names are proposals to add to `domain-glossary`. | AC-KAN-112-01, AC-KAN-113-01, AC-KAN-114-01 |
| AS-2 | A business that is `inactive` or `suspended` keeps its page visible (read-only, KAN-49) but accepts no new bookings from customers; the page shows `customer:businessHome.business.unavailable`. | AC-KAN-112-06, AC-KAN-116-04 |
| AS-3 | The catalog loads with cursor pagination, `PAGINATION.DEFAULT_PAGE_SIZE` per page, ordered by service name, with a "load more" action. | AC-KAN-113-04 |
| AS-4 | Durations under 60 minutes are shown in minutes; 60 or more as hours and minutes. | AC-KAN-114-04 |
| AS-5 | The service image from KAN-54 is shown in the details when present; it is optional. | AC-KAN-114-05 |
| AS-6 | A discounted price is floored at zero. | AC-KAN-115-04 |
| AS-7 | When several discounts are current, the one giving the lowest price is shown. Discounts of the "reservas" type in KAN-60 are not shown until that type is clarified (see Backlog issues). | AC-KAN-115-01, AC-KAN-115-05 |
| AS-8 | Blocking (KAN-93) is checked when the customer starts a booking, as a courtesy; the binding check is at confirmation (KAN-148). | AC-KAN-116-03 |
| AS-9 | Discounts shown here are informational; the price applied to the booking is decided in the booking flow (KAN-145, KAN-62). | AC-KAN-115-01 |
| AS-10 | Slug lookups ignore letter case and redirect to the stored lowercase `slug`; the slug character rules and length are defined where the slug is created (KAN-176, Q7). | AC-KAN-112-08 |
| AS-11 | The return destination is the booking flow URL of the same business with the chosen service (`redirectTo`); nothing is stored before the customer confirms (KAN-148). | AC-KAN-116-05 |
| AS-12 | The sign-in screen's link to sign-up keeps the same return destination, so the visitor comes back to the booking flow after signing in (sign-up itself ends on sign-in, KAN-127). | AC-KAN-116-06 |

## Backlog issues
- KAN-112 says "general information … to know the services it offers", which overlaps KAN-113 (catalog). KAN-112 is treated as the business information block only.
- KAN-116 (start booking from a service) and KAN-135 (select the service to start booking) describe the same step from two epics. KAN-116 is the entry point on the home page; KAN-135 is the selection inside the flow.
- KAN-115 depends on KAN-60, where "reservas" as a discount type is unclear (percentage, fixed amount or "reservas"). See AS-7.
- KAN-114 lists name, description, price and duration, but KAN-54 also defines an image; the image is optional here (AS-5).
- No business-portal story lets the subscriber write the business description, logo or currency shown on this page.
- KAN-93 (subscriber blocks a customer) does not say what the customer sees when blocked.
- KAN-116 does not say what a visitor sees when choosing to book. Q6 (2026-09-28) decided that an account is mandatory; AC-KAN-116-05 to AC-KAN-116-09 specify the visitor path.

## Non-functional
- i18n prefixes (new): `customer:businessHome.business.*`, `customer:businessHome.catalog.*`, `customer:businessHome.discount.*`, `customer:businessHome.booking.*` (including `customer:businessHome.booking.signInRequired`). Reused: `common:errors.network`, `common:errors.notFound`.
- Public page under `/:businessSlug`: no guard, no reCAPTCHA. Reads only `active` services (Firestore rules, `auth-and-roles` §4). The booking flow it opens is private (`RequireRole` for `customer`).
- Money is shown from `priceInCents` in the business currency; times in the business `timeZone`, formatted for the active language.
- Catalog pagination follows `api-query-standards` §5 (cursor pages, never the whole collection).
- Accessibility: struck-through original prices are announced as "original price" and "discounted price", not only by style; service cards are keyboard reachable; images have alternative text; works at phone width.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-112 | AC-KAN-112-01 … AC-KAN-112-09 | `tests/BusinessHomePage.test.tsx` |
| KAN-113 | AC-KAN-113-01 … AC-KAN-113-05 | `tests/BusinessHomePage.test.tsx` |
| KAN-114 | AC-KAN-114-01 … AC-KAN-114-05 | `tests/ServiceDetails.test.tsx` |
| KAN-115 | AC-KAN-115-01 … AC-KAN-115-05 | `tests/ServiceDetails.test.tsx`, `tests/BusinessHomePage.test.tsx` |
| KAN-116 | AC-KAN-116-01 … AC-KAN-116-09 | `tests/BusinessHomePage.test.tsx` |
