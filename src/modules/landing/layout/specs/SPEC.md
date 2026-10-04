# Landing footer (KAN-196)

| Field | Value |
| --- | --- |
| Portal | landing |
| Feature folder | `src/portals/landing/layout/` |
| Stories | KAN-8, KAN-10, KAN-11, KAN-13 |
| Status | Ready |
| Depends on | KAN-12 company logo (`src/portals/landing/features/home/`); KAN-9 terms and conditions; KAN-14 platform contact |

## Intent
Provide a consistent, accessible, and responsive footer across every page of the public landing portal. Visitors and users can easily locate essential platform information, reach direct contact channels (phone and email), follow official social media channels, navigate to legal terms, and verify copyright details from any landing route.

## Actors and permissions
| Actor | Can |
| --- | --- |
| visitor | See every section of the footer, use navigation links, copy or activate telephone (`tel:`) and email (`mailto:`) links, follow official social network links. |
| subscriber, customer, collaborator, super admin | Same as a visitor when browsing the landing portal. |

No actor writes or updates data through the footer UI; it is a read-only layout component.

## In scope
- Persistent footer displayed at the bottom of all landing portal pages (`LandingLayout`).
- Platform branding: logo, accessible name, and a concise platform description (KAN-8).
- Quick navigation links to key landing sections and legal terms (referencing KAN-9).
- Official social network links with accessible labels opening securely in a new tab (KAN-10).
- Direct telephone contact in international format with callable `tel:` link (KAN-11).
- Direct email contact with `mailto:` link (KAN-13).
- Dynamic copyright notice displaying the current calendar year (AS-7).
- Resilient rendering: omission of unconfigured or invalid contact/social items without broken UI or dead links.
- Responsive layout adapting cleanly from 360 px mobile viewports to desktop.

## Out of scope
- The terms and conditions page content and route itself (specified under KAN-9 in `src/portals/landing/features/home/specs/SPEC.md`).
- The contact form and reCAPTCHA verification (specified under KAN-5 in `home` and KAN-14 in `contact`).
- The navbar header and portal routing (specified under KAN-3 and KAN-12).
- The customer portal footer (specified under KAN-117 in `src/portals/customer/layout/specs/SPEC.md`).
- Dynamic CMS or database administration of footer contents (landing content is static configuration and i18n-driven in the MVP; AS-2).

## Data
- Platform contact information (phone, email, social links, company summary) and navigation links have no Firestore domain entity. They are static, translated content of the landing portal defined in frozen constants (`@/constants`) and i18n keys (`landing:footer.*`) (AS-2).
- No Firestore read queries or mutations are performed by this component.

## Acceptance criteria

### KAN-8 — Footer with general information
- [x] **AC-KAN-8-01** · happy · Given any page of the landing portal, when the page renders, then the footer is displayed at the bottom containing the platform logo, a concise platform description, quick navigation links (Home, Plans, Contact, Terms), direct contact channels (phone, email), social network links, and a copyright notice with the current year. [KAN-8]
- [x] **AC-KAN-8-02** · happy · Given a visitor on any landing page, when they activate a footer navigation link (e.g., Plans, Contact, Terms), then the application navigates to the target page or scrolls smoothly to the target section and moves focus to its container. [KAN-8, KAN-9]
- [x] **AC-KAN-8-03** · error · Given an optional footer item (such as phone, email, or a specific social network link) is missing or unconfigured, when the footer renders, then that specific item is omitted gracefully without displaying broken layout gaps, empty labels, or dead links. [KAN-8]
- [x] **AC-KAN-8-04** · edge · Given a mobile viewport width (down to 360 px), when the footer renders, then all footer columns stack vertically without horizontal scrolling, and all interactive links maintain a minimum touch target size of 44x44 px. [KAN-8]
- [x] **AC-KAN-8-05** · edge · Given a visitor navigates through the footer using a keyboard (Tab key), when interactive elements receive focus, then a visible focus indicator conforming to the active theme tokens is displayed. [KAN-8]

### KAN-10 — Links to the company's social networks
- [ ] **AC-KAN-10-01** · happy · Given official social media accounts are configured for the platform (AS-4), when the footer renders, then each social network is rendered as an icon link with an accessible, localized label (`landing:footer.social.<network>`) announcing the network name. [KAN-10]
- [ ] **AC-KAN-10-02** · happy · Given a visitor activates any social network link, when the link is opened, then it opens the official external profile in a new browser tab with `target="_blank"` and `rel="noopener noreferrer"`, keeping the landing application tab open without granting the new page window access. [KAN-10]
- [ ] **AC-KAN-10-03** · error · Given a social network entry has an empty string or invalid URL format in configuration, when the footer renders, then that network's icon is excluded from the rendered social links list. [KAN-10]
- [ ] **AC-KAN-10-04** · edge · Given no social networks are configured in the platform settings or constants, when the footer renders, then the entire social links section and header are omitted cleanly from the footer layout. [KAN-10, KAN-8]

### KAN-11 — Phone number
- [ ] **AC-KAN-11-01** · happy · Given a platform contact phone number is configured (AS-5), when the footer renders, then the telephone number is displayed in human-readable international format alongside a phone icon and an accessible label (`landing:footer.contact.phoneLabel`). [KAN-11]
- [ ] **AC-KAN-11-02** · happy · Given a visitor activates the phone number link on a device supporting telephony actions, when clicked, then the device initiates a phone call using the standardized `tel:` protocol URL with the international dial code. [KAN-11]
- [ ] **AC-KAN-11-03** · error · Given no contact phone number is configured, when the footer renders, then the telephone line item is omitted entirely without displaying placeholder text or empty link targets. [KAN-11, KAN-8]
- [ ] **AC-KAN-11-04** · edge · Given a device without native calling capabilities (e.g. desktop browser without telephony client), when the visitor right-clicks or copies the phone link, then the plain telephone number text is easily selectable and copyable. [KAN-11]

### KAN-13 — Contact email
- [ ] **AC-KAN-13-01** · happy · Given an official contact email address is configured (AS-6), when the footer renders, then the email address is displayed visibly with an email icon and an accessible label (`landing:footer.contact.emailLabel`). [KAN-13]
- [ ] **AC-KAN-13-02** · happy · Given a visitor activates the contact email link, when clicked, then the user's default email client opens with a new draft message addressed to the platform contact address via a `mailto:` protocol URL. [KAN-13]
- [ ] **AC-KAN-13-03** · error · Given no contact email address is configured, when the footer renders, then the email line item is omitted entirely from the contact column. [KAN-13, KAN-8]
- [ ] **AC-KAN-13-04** · edge · Given an email address with extensive length, when rendered on a narrow screen (360 px width), then the text wraps or uses word-break so it does not overflow horizontally or clip. [KAN-13]

## BLOCKED
None. All open architectural questions (Q1–Q7) were resolved on 2026-09-28 and none block the landing footer layout.

## Deferred (out of MVP)
None.

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | The landing footer is a global layout element rendered by `LandingLayout.tsx` across all landing portal routes. | AC-KAN-8-01 |
| AS-2 | Platform contact information (phone, email, social links, company description) and navigation links are static, translated landing configurations (`landing:footer.*` and frozen constants in `@/constants/`), not dynamic tenant data from Firestore. | Data, AC-KAN-8-01, AC-KAN-10-01, AC-KAN-11-01, AC-KAN-13-01 |
| AS-3 | The Terms and Conditions link in the footer routes to `/terms` (referencing KAN-9). | AC-KAN-8-02 |
| AS-4 | Supported official social network platforms include Facebook, Instagram, LinkedIn, and X (Twitter) by default when configured. | AC-KAN-10-01 |
| AS-5 | Contact phone number follows standard international format (e.g., `+506 2222-0000`). | AC-KAN-11-01 |
| AS-6 | Contact email points to the official SaaS platform inquiry address (e.g., `soporte@bookingsystem.com`). | AC-KAN-13-01 |
| AS-7 | The copyright notice dynamically computes the current calendar year (`new Date().getFullYear()`) with the translated suffix. | AC-KAN-8-01 |
| AS-8 | The landing footer uses semantic Tailwind v4 design tokens and respects the active light/dark theme (`bg-muted/30` or `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`). | Non-functional, AC-KAN-8-05 |

## Backlog issues
- Epic KAN-196 was introduced in `docs/backlog/Jira-export2.csv` (`10216`) as `[Landing] Footer` to cleanly separate the layout footer from the home content epic KAN-1 (`[Landing] Home`), regrouping stories KAN-8, KAN-10, KAN-11, and KAN-13.
- In the initial export (`jira-export.csv`), KAN-8, 10, 11, 13 were listed as children of KAN-1. `docs/backlog/epic-map.md` is updated to reflect KAN-196 pointing to `portals/landing/layout`.
- KAN-9 (Terms and conditions) remains under KAN-1 in Jira; the landing footer includes the persistent navigation link to it without owning its page implementation.
- KAN-12 (Company logo) remains under KAN-1 for the header navbar; KAN-8 consumes the platform branding/logo for the footer block.
- Contact information in KAN-10, 11, 13 shares the same platform contact data source as KAN-17 in the Contact epic (KAN-14).

## Non-functional
- i18n keys: new prefixes under `landing:footer.*` (`landing:footer.description`, `landing:footer.links.*`, `landing:footer.contact.*`, `landing:footer.social.*`, `landing:footer.copyright`). Reused: `common:errors.network`.
- Theming: Full support for light and dark modes using Tailwind CSS v4 semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`). No static palette colors.
- Accessibility (WCAG 2.1 AA):
  - Semantic `<footer>` landmark element.
  - Descriptive `aria-label`s on icon-only links (e.g., social networks announce destination and external window opening).
  - Contrast ratio >= 4.5:1 for normal text and >= 3:1 for large text / graphical icons.
  - Minimum touch target size of 44x44 CSS pixels for all interactive links on mobile viewports.
  - Visible focus indicators on all focusable elements (`focus-visible:ring-2 focus-visible:ring-ring`).
- Responsiveness: Responsive CSS Grid / Flexbox wrapping cleanly from 360 px mobile viewports to large desktop displays (1440 px+) without horizontal scrolling.
- Both languages (`es`, `en`) must provide all keys.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-8 | AC-KAN-8-01, AC-KAN-8-02, AC-KAN-8-03, AC-KAN-8-04, AC-KAN-8-05 | `src/modules/landing/layout/tests/LandingFooter.test.tsx` |
| KAN-10 | AC-KAN-10-01, AC-KAN-10-02, AC-KAN-10-03, AC-KAN-10-04 | `src/modules/landing/layout/tests/LandingFooter.test.tsx` |
| KAN-11 | AC-KAN-11-01, AC-KAN-11-02, AC-KAN-11-03, AC-KAN-11-04 | `src/modules/landing/layout/tests/LandingFooter.test.tsx` |
| KAN-13 | AC-KAN-13-01, AC-KAN-13-02, AC-KAN-13-03, AC-KAN-13-04 | `src/modules/landing/layout/tests/LandingFooter.test.tsx` |
