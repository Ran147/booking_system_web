# Home (KAN-1)

| Field | Value |
| --- | --- |
| Portal | landing |
| Feature folder | `src/portals/landing/features/home/` |
| Stories | KAN-2, KAN-3, KAN-4, KAN-5, KAN-6, KAN-7, KAN-9, KAN-12 (KAN-8, KAN-10, KAN-11, KAN-13 moved to KAN-196) |
| Status | Draft |
| Depends on | KAN-20 plan checkout (plan details KAN-21; checkout KAN-22, Q7 decided 2026-09-28), KAN-28 / KAN-128 sign-in (`src/features/auth`), KAN-14 contact (shared contact data), KAN-180 plans (admin, source of `Plan`) |

## Intent
The public landing page for business owners who are evaluating the platform. A visitor understands what the platform offers, sees the available plans and their prices, trusts it through testimonials, starts contracting a plan (Q7), and can sign in, read the legal terms or contact the platform team from one page.

## Actors and permissions
| Actor | Can |
| --- | --- |
| visitor | See every section of the home page, read the terms, send the contact form (with reCAPTCHA), go to sign-in |
| subscriber, customer, super admin (signed in) | Same as a visitor; the navbar offers a way back to their own portal instead of Sign In (AS-2) |

No actor writes platform data from this page. The contact form only sends a message.

## In scope
- Navbar with logo and Sign In (KAN-3, KAN-12).
- Hero section with a call to action (KAN-2).
- Short platform introduction with "Read more" (KAN-4).
- Contact form protected by reCAPTCHA (KAN-5).
- Testimonials (KAN-6).
- Catalog of `active` plans with price, features and limits, with a contract action on each plan (KAN-7, KAN-2).
- Footer: moved to Epic KAN-196 ([Landing] Footer, specified in `src/portals/landing/layout/specs/SPEC.md`).
- Terms and conditions page reachable from the home page (KAN-9).

## Out of scope
- The checkout itself (payment, terms acceptance before payment, confirmation email): KAN-22, KAN-23, KAN-24, specified in the KAN-20 spec.
- Plan detail page (KAN-21, specified in the KAN-20 spec).
- The sign-in form itself (KAN-28 / KAN-128 spec).
- Managing testimonials, plans or contact data from the admin portal (no story; plans are KAN-180).

## Data
- `Plan` (`plans/{planId}`): read only. Only plans with status `active` are shown (glossary §4.5, KAN-184). Fields shown: name, `priceInCents`, `billingPeriod`, features and main `limits` (KAN-181, as defined in the KAN-180 spec; AS-5).
- Testimonials, platform introduction, terms text, phone, contact email and social links have no glossary entity. They are static, translated content of the landing portal (AS-4). No new Firestore collection is added by this spec.
- Contact form message: no glossary entity. It is delivered, not stored as a domain entity (AS-8). If the team decides to store it, the entity must first be added to `domain-glossary`.

## Acceptance criteria

### KAN-2 — Hero section with a call to action to start contracting a plan
- [ ] **AC-KAN-2-01** · happy · Given a visitor opens the landing home, when the page loads, then the hero section is the first section below the navbar and shows a headline, a short tagline and one call-to-action button, all taken from `landing:home.hero.*` keys. [KAN-2]
- [ ] **AC-KAN-2-02** · happy · Given the hero is shown, when the visitor activates the call to action, then the page scrolls to the plans section (KAN-7) and moves focus to its heading. See AS-1. [KAN-2]
- [ ] **AC-KAN-2-03** · error · Given the plans cannot be loaded (network error), when the visitor activates the call to action, then they still reach the plans section, which shows `common:errors.network` with a retry action (AC-KAN-7-03). [KAN-2, KAN-7]
- [ ] **AC-KAN-2-04** · edge · Given a phone-width viewport (360 px), when the hero renders, then the headline and the call to action are visible without horizontal scrolling. [KAN-2]
- [ ] **AC-KAN-2-05** · happy · Given the call to action took the visitor to the plans section, when they activate `landing:home.plans.contract` on a plan, then the checkout of that plan opens (KAN-22): the call to action starts the contracting process. [KAN-2, KAN-7, KAN-22]
- [ ] **AC-KAN-2-06** · error · Given there are no `active` plans, when the visitor activates the call to action, then they reach the plans section with `landing:home.plans.empty` and no contract action. [KAN-2, KAN-7]

### KAN-3 — Navbar with a Sign In option
- [ ] **AC-KAN-3-01** · happy · Given a visitor on any landing page, when the page loads, then a navbar shows the logo (KAN-12), links to the home sections (AS-3) and a Sign In action labelled `landing:home.navbar.signIn`. [KAN-3]
- [ ] **AC-KAN-3-02** · happy · Given a visitor, when they activate Sign In, then the sign-in page of `src/features/auth` opens. [KAN-3, KAN-28]
- [ ] **AC-KAN-3-03** · error · Given the sign-in page fails to load (network error while loading the route), when the visitor activates Sign In, then `common:errors.network` is shown with a retry action and the navbar stays usable. [KAN-3]
- [ ] **AC-KAN-3-04** · edge · Given a signed-in subscriber, customer or super admin opens the landing home, when the navbar renders, then Sign In is replaced by `landing:home.navbar.goToPortal`, which opens the home of their own portal. See AS-2. [KAN-3]
- [ ] **AC-KAN-3-05** · edge · Given a phone-width viewport, when the navbar renders, then its links collapse into a menu button that opens and closes with keyboard and pointer and announces its expanded state. [KAN-3]

### KAN-4 — Short platform introduction with "Read more"
- [ ] **AC-KAN-4-01** · happy · Given a visitor on the home page, when the introduction section renders, then it shows a short summary (`landing:home.intro.summary`) and a "Read more" action (`landing:home.intro.readMore`). [KAN-4]
- [ ] **AC-KAN-4-02** · happy · Given the summary is shown, when the visitor activates "Read more", then the full introduction text is revealed in place and the action changes to `landing:home.intro.readLess`. See AS-6. [KAN-4]
- [ ] **AC-KAN-4-03** · error · Given the full introduction text is missing for the active language, when "Read more" would be shown, then the action is not rendered and only the summary is shown (no empty expansion). [KAN-4]
- [ ] **AC-KAN-4-04** · edge · Given the introduction is expanded, when the visitor activates `landing:home.intro.readLess`, then the text collapses and focus returns to the action. [KAN-4]

### KAN-5 — Contact form validated with reCAPTCHA
- [ ] **AC-KAN-5-01** · happy · Given a visitor fills name, email and message with valid values and solves the reCAPTCHA, when they submit, then the message is delivered to the platform team (AS-8), the form is cleared and `landing:home.contactForm.sent` is shown. [KAN-5]
- [ ] **AC-KAN-5-02** · error · Given a required field is empty, when the field loses focus or the form is submitted, then `validation:required` is shown on that field and nothing is sent. [KAN-5]
- [ ] **AC-KAN-5-03** · error · Given the email is not a valid address, when the field loses focus, then `validation:emailInvalid` is shown and nothing is sent. [KAN-5]
- [ ] **AC-KAN-5-04** · error · Given the name or message is shorter or longer than its limit (AS-7), when the field is validated, then `validation:tooShort` or `validation:tooLong` is shown. [KAN-5]
- [ ] **AC-KAN-5-05** · error · Given the reCAPTCHA has not been solved, when the visitor looks at the form, then the submit button is disabled; and given the reCAPTCHA token is rejected by the server, when they submit, then nothing is sent, the reCAPTCHA is reset and `validation:recaptchaRequired` is shown. [KAN-5]
- [ ] **AC-KAN-5-06** · error · Given the send fails because of the network, when the visitor submits, then the entered values are kept and `common:errors.network` is shown. [KAN-5]
- [ ] **AC-KAN-5-07** · edge · Given the visitor double-clicks submit, when the first send is in progress, then the button is disabled and only one message is delivered. [KAN-5]

### KAN-6 — Testimonials from other customers
- [ ] **AC-KAN-6-01** · happy · Given there are testimonials in the landing content (AS-4), when the testimonials section renders, then each shows the quote, the author's name and the author's business name. [KAN-6]
- [ ] **AC-KAN-6-02** · error · Given a testimonial has no quote text in the active language, when the section renders, then that testimonial is skipped instead of showing an empty card. [KAN-6]
- [ ] **AC-KAN-6-03** · edge · Given there are no testimonials, when the home renders, then the testimonials section and its navbar link are not shown. [KAN-6]
- [ ] **AC-KAN-6-04** · edge · Given more testimonials than fit the viewport, when the section renders, then the visitor can move through them with keyboard and pointer, and nothing moves automatically unless the visitor starts it. See AS-9. [KAN-6]

### KAN-7 — Available subscription plans on the home page
- [ ] **AC-KAN-7-01** · happy · Given there are `Plan`s with status `active`, when the plans section renders, then each plan shows its name, its price formatted from `priceInCents` (AS-10) with its billing period (`monthly` or `annual`), its main `limits` (AS-5) and its features, ordered by price ascending (AS-11). [KAN-7]
- [ ] **AC-KAN-7-02** · happy · Given a plan card, when the visitor activates `landing:home.plans.seeDetails`, then the plan detail page of that plan opens (KAN-21). [KAN-7, KAN-21]
- [ ] **AC-KAN-7-03** · error · Given the plans cannot be read (network or server failure), when the section renders, then `common:errors.network` (or `common:errors.unknown` for a server error) is shown with a retry action, and the rest of the home still renders. [KAN-7]
- [ ] **AC-KAN-7-04** · edge · Given a plan with status `inactive`, when the section renders, then that plan is not shown. [KAN-7, KAN-184]
- [ ] **AC-KAN-7-05** · edge · Given there are no `active` plans, when the section renders, then `landing:home.plans.empty` is shown instead of an empty grid. [KAN-7]
- [ ] **AC-KAN-7-06** · edge · Given the plans are loading, when the section renders, then placeholders of the same size are shown so the page does not jump when the plans arrive. [KAN-7]
- [ ] **AC-KAN-7-07** · happy · Given a plan card, when the visitor activates `landing:home.plans.contract`, then the checkout page of that plan opens (KAN-22). [KAN-7, KAN-22]
- [ ] **AC-KAN-7-08** · error · Given the plan was deactivated after the catalog loaded, when the visitor activates contract, then the checkout does not open and `landing:planCheckout.payment.planUnavailableError` is shown (AC-KAN-21-10). [KAN-7, KAN-184]
- [ ] **AC-KAN-7-09** · edge · Given a signed-in user, when they activate contract, then they see `landing:planCheckout.detail.signedInNotice` as in AC-KAN-21-11. [KAN-7, KAN-21]

### KAN-8 — Footer with general information (Moved to KAN-196)
Story moved to Epic KAN-196 (`[Landing] Footer`) in `docs/backlog/Jira-export2.csv`. See active criteria in `src/portals/landing/layout/specs/SPEC.md`.

### KAN-9 — Terms and conditions
- [ ] **AC-KAN-9-01** · happy · Given a visitor, when they activate `landing:home.footer.terms`, then the terms and conditions page opens with a title, the last-updated date and the full text in the active language. [KAN-9]
- [ ] **AC-KAN-9-02** · error · Given the terms page fails to load (network error while loading the route), when the visitor opens it, then `common:errors.network` is shown with a retry action. [KAN-9]
- [ ] **AC-KAN-9-03** · edge · Given a visitor opens the terms URL directly, when the page loads, then it renders without requiring sign-in, and a way back to the home page is available. [KAN-9]

### KAN-10 — Links to the company's social networks (Moved to KAN-196)
Story moved to Epic KAN-196 (`[Landing] Footer`) in `docs/backlog/Jira-export2.csv`. See active criteria in `src/portals/landing/layout/specs/SPEC.md`.

### KAN-11 — Phone number (Moved to KAN-196)
Story moved to Epic KAN-196 (`[Landing] Footer`) in `docs/backlog/Jira-export2.csv`. See active criteria in `src/portals/landing/layout/specs/SPEC.md`.

### KAN-12 — Company logo
- [ ] **AC-KAN-12-01** · happy · Given any landing page, when the navbar renders, then the platform logo is shown with the alternative text `landing:home.navbar.logoAlt`, and activating it opens the landing home. [KAN-12]
- [ ] **AC-KAN-12-02** · error · Given the logo image fails to load, when the navbar renders, then the platform name is shown as text in its place and the link still works. [KAN-12]
- [ ] **AC-KAN-12-03** · edge · Given the active theme is dark, when the logo renders, then the variant for dark backgrounds is used so it stays legible. See AS-12. [KAN-12]

### KAN-13 — Contact email (Moved to KAN-196)
Story moved to Epic KAN-196 (`[Landing] Footer`) in `docs/backlog/Jira-export2.csv`. See active criteria in `src/portals/landing/layout/specs/SPEC.md`.

## BLOCKED
None. Q7 was decided on 2026-09-28: the call to action and each plan card lead to the plan checkout (AC-KAN-2-05, AC-KAN-7-07).

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | The hero call to action scrolls to the plans section on the same page (not a separate pricing page). | AC-KAN-2-02 |
| AS-2 | A signed-in user who opens the landing home sees "Go to my portal" instead of Sign In; they are not redirected away from the landing. | AC-KAN-3-04 |
| AS-3 | Navbar links: Plans, Testimonials, Contact (home sections), plus the Contact epic pages (KAN-14) when they exist. | AC-KAN-3-01 |
| AS-4 | Testimonials, introduction, terms text, phone, contact email and social links are static, translated landing content (config + `landing` i18n keys), not managed by the super admin. | Data, AC-KAN-6-01, AC-KAN-10-01, AC-KAN-11-01, AC-KAN-13-01 |
| AS-5 | The plan card shows the plan's features and at most three of its `limits`; the full list is on the plan detail (KAN-21). | AC-KAN-7-01 |
| AS-6 | "Read more" expands the text in place instead of navigating to the About page (KAN-16). | AC-KAN-4-02 |
| AS-7 | Contact form limits: name 2–100 characters, message 10–2000 characters. | AC-KAN-5-04 |
| AS-8 | The contact message is sent by email to the platform contact address through a Cloud Function after reCAPTCHA verification; it is not stored as a domain entity. | AC-KAN-5-01, Data |
| AS-9 | Testimonials never auto-rotate. | AC-KAN-6-04 |
| AS-10 | Plan prices are shown in a single platform currency (there is no business currency on the landing; consistent with the KAN-180 spec), formatted with the active locale. | AC-KAN-7-01 |
| AS-11 | Plans are ordered by price ascending. | AC-KAN-7-01 |
| AS-12 | The logo has light and dark variants. | AC-KAN-12-03 |

## Backlog issues
- KAN-5 (contact form, Home epic) overlaps with KAN-17 (direct contact means, Contact epic KAN-14). This spec owns the form; the KAN-14 spec reuses it and does not define a second form.
- KAN-10, KAN-11 and KAN-13 show the same contact data as KAN-17. One source of contact data should serve both epics.
- KAN-2 says the call to action "starts the contracting process": it scrolls to the plans (AS-1), where each plan has the contract action (Q7).
- KAN-9 (read the terms) and KAN-23 (accept the terms before paying) show the same terms text.
- KAN-6 says "otros clientes": on the landing these are subscribers (business owners), not `customer`s.

## Non-functional
- i18n keys: new prefixes `landing:home.hero.*`, `landing:home.navbar.*`, `landing:home.intro.*`, `landing:home.contactForm.*`, `landing:home.testimonials.*`, `landing:home.plans.*`, `landing:home.footer.*`, `landing:home.terms.*`. Reused: `common:errors.network`, `common:errors.unknown`, `validation:required`, `validation:emailInvalid`, `validation:tooShort`, `validation:tooLong`, `validation:recaptchaRequired`.
- reCAPTCHA: the contact form includes the reCAPTCHA field; submit stays disabled until there is a token and the token is verified on the server before sending (KAN-5, `auth-and-roles` §5).
- No pagination, export, realtime or idle timeout (public page). The plan list is small and read once.
- Prices formatted with the locale formatter from `priceInCents`; never stored as formatted text.
- Accessibility: one `h1` (hero), landmarks for navbar, main and footer, visible focus, icon links with accessible names, the mobile menu announces its state, the page is usable at 360 px width without horizontal scroll.
- Both languages (`es`, `en`) must have every key.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-2 | AC-KAN-2-01 … AC-KAN-2-06 | `tests/HomePage.test.tsx` |
| KAN-3 | AC-KAN-3-01, AC-KAN-3-02, AC-KAN-3-03, AC-KAN-3-04, AC-KAN-3-05 | `tests/LandingNavbar.test.tsx` |
| KAN-4 | AC-KAN-4-01, AC-KAN-4-02, AC-KAN-4-03, AC-KAN-4-04 | `tests/HomePage.test.tsx` |
| KAN-5 | AC-KAN-5-01 … AC-KAN-5-07 | `tests/ContactForm.test.tsx`; `functions/src/contact/tests/sendContactMessage.test.ts` |
| KAN-6 | AC-KAN-6-01, AC-KAN-6-02, AC-KAN-6-03, AC-KAN-6-04 | `tests/HomePage.test.tsx` |
| KAN-7 | AC-KAN-7-01 … AC-KAN-7-09 | `tests/PlanCatalog.test.tsx` |
| KAN-8 | Moved to KAN-196 | `src/modules/landing/layout/specs/SPEC.md` |
| KAN-9 | AC-KAN-9-01, AC-KAN-9-02, AC-KAN-9-03 | `tests/TermsPage.test.tsx` |
| KAN-10 | Moved to KAN-196 | `src/modules/landing/layout/specs/SPEC.md` |
| KAN-11 | Moved to KAN-196 | `src/modules/landing/layout/specs/SPEC.md` |
| KAN-12 | AC-KAN-12-01, AC-KAN-12-02, AC-KAN-12-03 | `tests/LandingNavbar.test.tsx` |
| KAN-13 | Moved to KAN-196 | `src/modules/landing/layout/specs/SPEC.md` |
