# Contact and company information (KAN-14)

| Field | Value |
| --- | --- |
| Portal | landing |
| Feature folder | `src/portals/landing/features/contact/` |
| Stories | KAN-15, KAN-16, KAN-17, KAN-18, KAN-19 |
| Status | Draft |
| Depends on | KAN-1 Home (contact form KAN-5, shared contact data KAN-10, KAN-11, KAN-13), KAN-189 support tickets (admin) for signed-in subscribers |

## Intent
Visitors who want to know who is behind the platform, or who have a question, find the company's mission and vision, its story, the ways to reach the team, answers to frequent questions and a help section, all on public landing pages without signing in.

## Actors and permissions
| Actor | Can |
| --- | --- |
| visitor | Read the About (mission, vision, company) pages, the contact page, the FAQ and the help section; use the contact means |
| subscriber, customer, super admin (signed in) | Same as a visitor |

Nothing on these pages writes platform data. The only form (KAN-5) belongs to the Home spec.

## In scope
- Mission and vision (KAN-15).
- Company information: history and what it offers (KAN-16).
- Contact page with the direct contact means: email, phone, social links, and the contact form from KAN-5 (KAN-17).
- Frequently asked questions (KAN-18).
- Help section with orientation and a route to technical support (KAN-19).

## Out of scope
- The contact form's fields and validation (owned by KAN-5, Home spec; reused here).
- Support tickets created by signed-in subscribers (KAN-189 epic, admin and business portals).
- Live chat or phone call-back (no story).
- Managing this content from the admin portal (no story).

## Data
- No glossary entity. Mission, vision, company text, FAQ entries, help topics and contact data are static, translated landing content (AS-1). The contact data (email, phone, social links) is the same source used by the Home footer (KAN-10, KAN-11, KAN-13).
- No new Firestore collection or field.

## Acceptance criteria

### KAN-15 — Company mission and vision
- [ ] **AC-KAN-15-01** · happy · Given a visitor, when they open the About page from the navbar or footer, then a section shows the mission (`landing:contact.about.mission`) and the vision (`landing:contact.about.vision`), each under its own heading. [KAN-15]
- [ ] **AC-KAN-15-02** · error · Given the About page fails to load (network error while loading the route), when the visitor opens it, then `common:errors.network` is shown with a retry action. [KAN-15]
- [ ] **AC-KAN-15-03** · edge · Given the visitor switches the language between `es` and `en`, when the page re-renders, then the mission and vision appear in the selected language without reloading. [KAN-15]

### KAN-16 — Detailed information about the company
- [ ] **AC-KAN-16-01** · happy · Given a visitor on the About page, when it renders, then a company section shows its history and what the platform offers (`landing:contact.about.company.*`), with a link to the plans section of the home page (KAN-7). [KAN-16]
- [ ] **AC-KAN-16-02** · error · Given a visitor opens an About sub-path that does not exist, when the page loads, then `common:errors.notFound` is shown with a link back to the home page. [KAN-16]
- [ ] **AC-KAN-16-03** · edge · Given a phone-width viewport, when the About page renders, then the text and any images stack in one column without horizontal scrolling, and every image has alternative text. [KAN-16]

### KAN-17 — Direct contact means
- [ ] **AC-KAN-17-01** · happy · Given contact data is configured, when a visitor opens the contact page, then it shows the contact email (mailto link), the phone (tel link) and the social links (new tab), taken from the same source as the Home footer. [KAN-17, KAN-10, KAN-11, KAN-13]
- [ ] **AC-KAN-17-02** · happy · Given the contact page, when it renders, then it also shows the contact form of KAN-5 with the same validation, reCAPTCHA and messages. [KAN-17, KAN-5]
- [ ] **AC-KAN-17-03** · error · Given one contact mean has no value configured, when the page renders, then that item is omitted and no empty label or dead link is shown. [KAN-17]
- [ ] **AC-KAN-17-04** · edge · Given no contact mean is configured at all, when the page renders, then only the contact form is shown with `landing:contact.page.formOnly`. [KAN-17]

### KAN-18 — Frequently asked questions
- [ ] **AC-KAN-18-01** · happy · Given FAQ entries exist (AS-1), when a visitor opens the FAQ, then each question is listed and activating it expands its answer; activating it again collapses it. [KAN-18]
- [ ] **AC-KAN-18-02** · happy · Given the FAQ is grouped by topic (AS-2), when it renders, then each group has its own heading. [KAN-18]
- [ ] **AC-KAN-18-03** · error · Given an entry has a question but no answer in the active language, when the FAQ renders, then that entry is skipped. [KAN-18]
- [ ] **AC-KAN-18-04** · edge · Given there are no FAQ entries, when the FAQ is opened, then `landing:contact.faq.empty` is shown with a link to the contact page. [KAN-18]
- [ ] **AC-KAN-18-05** · edge · Given a keyboard user, when they move through the questions, then each question is reachable with Tab, toggles with Enter or Space and announces whether it is expanded. [KAN-18]

### KAN-19 — Help section for orientation and technical support
- [ ] **AC-KAN-19-01** · happy · Given a visitor opens the help section, when it renders, then it shows help topics (AS-3), a link to the FAQ (KAN-18) and a link to the contact page (KAN-17). [KAN-19]
- [ ] **AC-KAN-19-02** · happy · Given a signed-in subscriber opens the help section, when it renders, then it also shows `landing:contact.help.openTicket`, which opens support tickets in the business portal (KAN-189 epic). See AS-4. [KAN-19]
- [ ] **AC-KAN-19-03** · error · Given the help section fails to load (network error while loading the route), when the visitor opens it, then `common:errors.network` is shown with a retry action. [KAN-19]
- [ ] **AC-KAN-19-04** · edge · Given a visitor who is not signed in, when the help section renders, then the support-ticket link is not shown. [KAN-19]

## BLOCKED
None. No story in this epic depends on Q1–Q7.

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | Mission, vision, company text, FAQ entries and help topics are static, translated content in `landing` i18n files, not editable from the admin portal. | Data, AC-KAN-18-01, AC-KAN-19-01 |
| AS-2 | FAQ entries are grouped by topic (for example plans, bookings, account). | AC-KAN-18-02 |
| AS-3 | The help section is a list of short guides (getting started, managing the schedule, subscription) on the landing, not a searchable knowledge base. | AC-KAN-19-01 |
| AS-4 | "Technical support" for a signed-in subscriber means the support tickets of the KAN-189 epic; visitors get the contact means. | AC-KAN-19-02, AC-KAN-19-04 |
| AS-5 | Mission, vision and company information share one About page (KAN-15 and KAN-16); FAQ and help are separate pages. | AC-KAN-15-01, AC-KAN-16-01 |

## Backlog issues
- KAN-17 (direct contact means) overlaps with KAN-5 (contact form, Home epic) and with KAN-10, KAN-11, KAN-13 (social links, phone, email in the Home footer). This spec reuses them; it does not define a second form or a second source of contact data.
- The epic is named "Contacto" but three of its five stories (KAN-15, KAN-16, KAN-18) are about company information and FAQ, not contact.
- KAN-19 "soporte técnico" is unclear: a public help page or the subscriber support tickets (KAN-189 epic). See AS-4.

## Non-functional
- i18n keys: new prefixes `landing:contact.about.*`, `landing:contact.page.*`, `landing:contact.faq.*`, `landing:contact.help.*`. Reused: `common:errors.network`, `common:errors.notFound`, and all KAN-5 keys (`landing:home.contactForm.*`).
- reCAPTCHA: applies through the KAN-5 form embedded in the contact page.
- No pagination, export, realtime or idle timeout (public pages).
- Accessibility: FAQ follows the disclosure pattern (button with expanded state), one `h1` per page, headings in order, icon links with accessible names, usable at 360 px width.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-15 | AC-KAN-15-01, AC-KAN-15-02, AC-KAN-15-03 | `tests/AboutPage.test.tsx` |
| KAN-16 | AC-KAN-16-01, AC-KAN-16-02, AC-KAN-16-03 | `tests/AboutPage.test.tsx` |
| KAN-17 | AC-KAN-17-01, AC-KAN-17-02, AC-KAN-17-03, AC-KAN-17-04 | `tests/ContactPage.test.tsx` |
| KAN-18 | AC-KAN-18-01 … AC-KAN-18-05 | `tests/FaqPage.test.tsx` |
| KAN-19 | AC-KAN-19-01, AC-KAN-19-02, AC-KAN-19-03, AC-KAN-19-04 | `tests/HelpPage.test.tsx` |
