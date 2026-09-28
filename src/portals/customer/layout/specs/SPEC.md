# Customer navbar and footer (KAN-96, KAN-117)

| Field | Value |
| --- | --- |
| Portal | customer |
| Feature folder | `src/portals/customer/layout/` |
| Stories | KAN-107, KAN-108, KAN-109, KAN-110 (epic KAN-96 — Navbar); KAN-118, KAN-119, KAN-120, KAN-121 (epic KAN-117 — Footer) |
| Status | Draft |
| Depends on | Q4 decided 2026-09-28 (business pages under `/:businessSlug`, `Business.slug`); KAN-128 sign-in (`src/features/auth`); KAN-150 my bookings; KAN-168 profile; landing KAN-9 terms page |

## Intent
A person on a business's pages in the customer portal always knows which business they are booking with, can reach their bookings and profile, and can sign in or out from the top of the page. At the bottom of every page they find the business's contact details, social networks and the terms that apply.

## Actors and permissions
| Actor | Can |
| --- | --- |
| visitor (not signed in) | See the business name and logo, the footer contact details, social links and terms; use the sign-in action |
| customer | Everything a visitor can, plus open "my bookings" and "profile", and sign out |
| subscriber / super admin signed in on a customer page | See the public content only; see AS-4 |

## In scope
- Navbar shown on every page of a business in the customer portal: business name and logo, links to my bookings and profile, sign-in / sign-out action.
- Footer shown on the same pages: business contact information (phone, email), logo, social network links when present, link to terms and conditions.
- Behavior of these links for a visitor versus a signed-in customer.
- Keeping every navbar link inside the business's slug (`/<businessSlug>/...`, Q4).

## Out of scope
- Creating or changing a business slug (set when the business is created, KAN-176 / Q7).
- The sign-in form, password recovery and idle logout themselves (KAN-128, `src/features/auth`).
- The content of the my-bookings (KAN-150) and profile (KAN-168) screens.
- Language and theme switches (KAN-172, KAN-173 in the profile epic).
- Editing the business's name, logo, contact data or social links (no business-portal story defines it; see Backlog issues).

## Data
- `Business` (`businesses/{businessId}`, public read, found by its `slug` from the URL): `name`, `status`, plus the public profile fields below.
- New public profile fields on `Business`, proposed names to be added to `domain-glossary` §3 (AS-1): `logoUrl` (Nullable), `contactPhone` (Nullable), `contactEmail` (Nullable), `socialLinks` (list of `{ network, url }`, may be empty).
- Session (`auth-and-roles` §2): `signed_out` or `signed_in` with role `customer`.
- No writes.

## Acceptance criteria

### KAN-107 — See the business name and logo in the navbar
- [ ] **AC-KAN-107-01** · happy · Given a visitor or customer on a business's pages and the business has a `name` and a `logoUrl`, when any page of that business loads, then the navbar shows the business logo (with the business name as its accessible text) and the business name. [KAN-107]
- [ ] **AC-KAN-107-02** · error · Given the business data cannot be loaded because of the network, when the page loads, then the navbar shows no business name or logo, `common:errors.network` is shown with a retry action, and the sign-in / sign-out action stays usable. [KAN-107]
- [ ] **AC-KAN-107-03** · error · Given the business does not exist, when the customer opens its pages, then `common:errors.notFound` is shown and no business name or logo appears in the navbar. [KAN-107]
- [ ] **AC-KAN-107-04** · edge · Given the business has no `logoUrl`, or the logo image fails to load, when the navbar renders, then only the business name is shown, with no broken image. [KAN-107]
- [ ] **AC-KAN-107-05** · edge · Given a business name longer than the navbar can show on a phone-width screen, when the navbar renders, then the name is shortened visually and the full name stays available to assistive technology. See AS-2. [KAN-107]
- [ ] **AC-KAN-107-06** · edge · Given a business whose status is `inactive` or `suspended`, when the customer opens its pages, then the navbar still identifies the business and the message `customer:layout.business.unavailable` is shown. See AS-3. [KAN-107, KAN-49]
- [ ] **AC-KAN-107-07** · edge · Given a person on the pages of the business with slug `<businessSlug>`, when they use the navbar links (business home, my bookings, profile) or sign in and come back, then they stay under `/<businessSlug>/...` and the navbar keeps showing the same business. See AS-9. [KAN-107, KAN-108, KAN-109, KAN-110]

### KAN-108 — Go to my bookings from the navbar
- [ ] **AC-KAN-108-01** · happy · Given a signed-in customer on a business's pages, when they choose the my-bookings link in the navbar, then the my-bookings screen (KAN-150) opens. [KAN-108]
- [ ] **AC-KAN-108-02** · error · Given a visitor, when they choose the my-bookings link, then they are sent to sign-in and, after signing in as a customer, they land on my bookings. [KAN-108, KAN-128]
- [ ] **AC-KAN-108-03** · error · Given the customer's session has ended (idle logout, KAN-133) while the page stayed open, when they choose the my-bookings link, then they are sent to sign-in and no booking data is shown before that. [KAN-108, KAN-133]

### KAN-109 — Go to my profile from the navbar
- [ ] **AC-KAN-109-01** · happy · Given a signed-in customer on a business's pages, when they choose the profile link in the navbar, then the profile screen (KAN-168) opens. [KAN-109]
- [ ] **AC-KAN-109-02** · error · Given a visitor, when they try to open the profile (from the navbar or by going straight to it), then they are sent to sign-in and, after signing in as a customer, they land on the profile. [KAN-109, KAN-128]
- [ ] **AC-KAN-109-03** · edge · Given a visitor, when the navbar renders, then the profile link is not shown as a profile of a signed-in user (no customer name or account menu appears). See AS-5. [KAN-109]

### KAN-110 — Sign in or sign out from the navbar
- [ ] **AC-KAN-110-01** · happy · Given a visitor on a business's pages, when they choose sign-in in the navbar, then the sign-in screen opens and, after a successful customer sign-in, they return to the business page they were on. [KAN-110, KAN-128]
- [ ] **AC-KAN-110-02** · happy · Given a signed-in customer, when they choose sign-out in the navbar, then the session ends, no data from their account stays on screen or in the cached data, and the sign-in screen is shown. [KAN-110]
- [ ] **AC-KAN-110-03** · error · Given sign-out fails because of the network, when the customer chooses sign-out, then `common:errors.network` is shown and the navbar keeps showing the signed-in state until sign-out succeeds. [KAN-110]
- [ ] **AC-KAN-110-04** · edge · Given the session state is still loading, when the navbar renders, then neither sign-in nor sign-out is offered until the state is known (no flash of the wrong action). [KAN-110]
- [ ] **AC-KAN-110-05** · edge · Given the customer is signed out by idle timeout (`PlatformSettings.idleTimeoutMinutes`, KAN-133), when that happens, then the navbar switches to the visitor state. [KAN-110, KAN-133]

### KAN-118 — See the business contact information in the footer
- [ ] **AC-KAN-118-01** · happy · Given a business with `contactPhone` and `contactEmail`, when any page of that business loads, then the footer shows both; the phone opens the device's call action and the email opens the device's mail action. [KAN-118]
- [ ] **AC-KAN-118-02** · error · Given the business data cannot be loaded because of the network, when the page loads, then the footer shows no business contact data and still shows the terms link (KAN-119). [KAN-118]
- [ ] **AC-KAN-118-03** · edge · Given a business with only one of `contactPhone` or `contactEmail`, when the footer renders, then only the available one is shown, with no empty label. [KAN-118]
- [ ] **AC-KAN-118-04** · edge · Given a business with neither `contactPhone` nor `contactEmail`, when the footer renders, then the contact section is hidden. [KAN-118]

### KAN-119 — Open the terms and conditions from the footer
- [ ] **AC-KAN-119-01** · happy · Given a visitor or customer on a business's pages, when they choose the terms link in the footer, then the platform terms and conditions page opens. See AS-6. [KAN-119]
- [ ] **AC-KAN-119-02** · error · Given the terms page cannot be loaded because of the network, when the customer opens it, then `common:errors.network` is shown with a retry action and the navbar still lets them go back to the business's pages. [KAN-119]
- [ ] **AC-KAN-119-03** · edge · Given a customer in the middle of choosing a service or a time slot, when they open the terms, then the terms open without discarding their progress. See AS-7. [KAN-119]

### KAN-120 — Open the business's social networks from the footer
- [ ] **AC-KAN-120-01** · happy · Given a business with one or more entries in `socialLinks`, when the footer renders, then one link per entry is shown with the network's icon and an accessible name, and it opens in a new tab. [KAN-120]
- [ ] **AC-KAN-120-02** · error · Given an entry in `socialLinks` whose `url` is not a valid `https` address, when the footer renders, then that entry is not shown and the other entries are. [KAN-120]
- [ ] **AC-KAN-120-03** · edge · Given a business with no `socialLinks`, when the footer renders, then the social section is hidden. [KAN-120]

### KAN-121 — See basic information (phone, email, logo) in the footer
- [ ] **AC-KAN-121-01** · happy · Given a business with `logoUrl`, `contactPhone` and `contactEmail`, when the footer renders, then it shows the business logo together with the phone and email of KAN-118. [KAN-121]
- [ ] **AC-KAN-121-02** · error · Given the logo image fails to load, when the footer renders, then the business name is shown in its place and the phone and email are still shown. [KAN-121]
- [ ] **AC-KAN-121-03** · edge · Given a business without `logoUrl`, when the footer renders, then the business name is shown instead of a logo. [KAN-121]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| — | — | None. Q4 was decided on 2026-09-28: the business is identified by the slug in `/<businessSlug>`. |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | The business public profile fields are named `logoUrl`, `contactPhone`, `contactEmail` and `socialLinks` (`{ network, url }[]`) on `Business`, and are publicly readable like the rest of the business profile. | AC-KAN-107-01, AC-KAN-118-01, AC-KAN-120-01, AC-KAN-121-01 |
| AS-2 | On narrow screens the business name is truncated with an ellipsis; no length limit is enforced on the name itself here. | AC-KAN-107-05 |
| AS-3 | Pages of an `inactive` or `suspended` business stay reachable for identification, but show `customer:layout.business.unavailable` and offer no booking (see `business-home` spec). | AC-KAN-107-06 |
| AS-4 | A subscriber or super admin who opens a customer page sees it as a visitor would, with sign-out available; the my-bookings and profile links send them to their own portal (wrong role, `auth-and-roles` §3). | Actors table |
| AS-5 | For a visitor the navbar shows only the sign-in action; my-bookings and profile links are shown to signed-in customers only (AC-KAN-108-02 and AC-KAN-109-02 still cover direct access). | AC-KAN-109-03 |
| AS-6 | "Terms and conditions related to the platform and bookings" means the platform terms page from landing KAN-9. The business's own booking policies (`BookingPolicy`) are shown in the booking flow (KAN-147, KAN-160), not in the footer. | AC-KAN-119-01 |
| AS-7 | The terms open in a new tab so the booking flow is not interrupted. | AC-KAN-119-03 |
| AS-8 | After sign-out the customer goes to the sign-in screen, as for every role (`auth-and-roles` §5), not back to the business page. | AC-KAN-110-02 |
| AS-9 | My bookings and profile are reached under the business the customer is visiting (`/<businessSlug>/...`); which bookings they list is defined in their own specs. | AC-KAN-107-07 |

## Backlog issues
- KAN-121 (phone, email and logo) overlaps KAN-118 (contact information) and, for the logo, KAN-107 (navbar). Kept as separate stories; KAN-121 only adds the logo in the footer.
- KAN-119 mixes platform terms (landing KAN-9) and booking terms (`BookingPolicy`, KAN-147 and KAN-160). See AS-6.
- No business-portal story lets the subscriber enter the business logo, phone, email or social networks (KAN-39 only shows name and logo in the sidebar; KAN-31 Settings covers language, theme and password). The data this footer shows has no source story.
- KAN-110 (sign in from the navbar) overlaps the customer login epic KAN-128; the navbar only provides the entry point.
- The epic KAN-96 is titled "Navbar (Clientes)" but its first story (KAN-107) is about the business identity, not the customer.

## Non-functional
- i18n prefixes (new): `customer:layout.navbar.*`, `customer:layout.footer.*`, `customer:layout.business.*`. Reused: `common:errors.network`, `common:errors.notFound`.
- Idle logout for customers uses `PlatformSettings.idleTimeoutMinutes` (KAN-182, KAN-133); the navbar reflects the resulting signed-out state.
- No pagination, export or reCAPTCHA in this feature. Business data is read once per business and shared by navbar and footer.
- Accessibility: navbar is a `nav` landmark and footer a `contentinfo` landmark; logo images have the business name as alternative text; social icons have accessible names; external links announce that they open in a new tab; keyboard reachable in visual order; works at phone width.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-107 | AC-KAN-107-01 … AC-KAN-107-07 | `tests/CustomerNavbar.test.tsx` |
| KAN-108 | AC-KAN-108-01, AC-KAN-108-02, AC-KAN-108-03 | `tests/CustomerNavbar.test.tsx` |
| KAN-109 | AC-KAN-109-01, AC-KAN-109-02, AC-KAN-109-03 | `tests/CustomerNavbar.test.tsx` |
| KAN-110 | AC-KAN-110-01 … AC-KAN-110-05 | `tests/CustomerNavbar.test.tsx` |
| KAN-118 | AC-KAN-118-01 … AC-KAN-118-04 | `tests/CustomerFooter.test.tsx` |
| KAN-119 | AC-KAN-119-01, AC-KAN-119-02, AC-KAN-119-03 | `tests/CustomerFooter.test.tsx` |
| KAN-120 | AC-KAN-120-01, AC-KAN-120-02, AC-KAN-120-03 | `tests/CustomerFooter.test.tsx` |
| KAN-121 | AC-KAN-121-01, AC-KAN-121-02, AC-KAN-121-03 | `tests/CustomerFooter.test.tsx` |
