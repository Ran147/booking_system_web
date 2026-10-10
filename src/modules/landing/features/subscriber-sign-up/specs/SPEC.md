# Subscriber sign-up (KAN-26)

| Field | Value |
| --- | --- |
| Portal | landing |
| Feature folder | `src/modules/landing/features/subscriber-sign-up/` |
| Stories | KAN-25, KAN-27 |
| Status | Draft |
| Depends on | Q7 decided 2026-09-28 (the form is reached from the KAN-24 payment email); Q4 decided 2026-09-28 (the business `slug` is set here); Q2 decided 2026-09-28 (the new business is `pending` until approval); KAN-20 plan checkout (`PlanCheckout`, KAN-24 email); KAN-28 sign-in (`src/features/auth`, KAN-33 "under review" screen); KAN-174 admin businesses (approval PROP-1, KAN-176); `cloud-functions-standards` (proposed in PR #17) for the three functions below |

## Intent
A future subscriber (business owner) who has paid a plan on the landing (KAN-22) opens the link of the payment email (KAN-24) and creates their platform account and their business: personal data, a password whose strength they can see, the business name and its `slug` (the address `/<slug>` of its customer pages). They are then sent to sign-in; until the super admin approves the business (Q2), signing in shows an "under review" screen.

## Actors and permissions
| Actor | Can |
| --- | --- |
| visitor with a valid sign-up link (KAN-24) | Create a `User` account with the checkout email, and a `pending` `Business` with its name and `slug` |
| visitor without a link | Nothing but a notice that sign-up starts by choosing a plan (AC-KAN-25-21) |
| subscriber, collaborator, customer, super admin (signed in) | Nothing here: a signed-in user who opens the form is sent to their own portal |
| system (Cloud Functions) | Validates the link, the slug and the reCAPTCHA, creates the account, the business and its payment record, and sets the claims |

## In scope
- The sign-up form: personal data, email (pre-filled from the checkout, read-only), password with show / hide and strength feedback, business name and `slug`, reCAPTCHA (KAN-25).
- Validating the sign-up link from the KAN-24 email.
- Creating the `User` account, the `pending` `Business` and the claims `{ role: "subscriber", businessId }` in one server call.
- Redirecting to sign-in after a successful sign-up (KAN-27).

## Out of scope
- Plan choice, terms and payment (KAN-21 to KAN-24, plan-checkout spec).
- Approving the business (PROP-1, KAN-176, admin businesses spec) and the "under review" screen after sign-in (KAN-33, auth spec).
- Changing the `slug` later (never allowed; the business profile shows it read-only, PROP-4).
- Customer sign-up (KAN-122, customer portal) and collaborator invitations (KAN-79).

## Data
- `User` (`users/{userId}`, `userId` = the Firebase Auth uid): `fullName` (first and last name of the form joined by one space, as the glossary names it), `phone` (`null` when empty, AS-1), `email` (the checkout email), `language` (AS-4), `createdAt`.
- `Business` (`businesses/{businessId}`, glossary §3): created with `status` `pending`, `name`, `slug`, `ownerUserId`, `planCheckoutId`, `timeZone` (AS-8), `createdAt`. No `Subscription` is created: it is created when the super admin approves the business (KAN-176).
- `Payment` (`businesses/{businessId}/payments/{paymentId}`): the checkout payment is copied here (amount, plan, date, result `succeeded`, reference) so it appears in the payment histories (KAN-46, KAN-178).
- `PlanCheckout` (`planCheckouts/{planCheckoutId}`): found by `signUpTokenHash` (the SHA-256 hash of the link token, plan-checkout spec "Data"); valid while `signUpCompletedAt` is `null` and `signUpLinkExpiresAt` has not passed. Sign-up sets `signUpCompletedAt`; the link stops working.
- `BusinessSlug` lock (`businessSlugs/{slug}`, decided 2026-10-10): `businessId`, `createdAt`. Created in the sign-up transaction; if the document already exists the slug is taken. It makes the slug unique even when two sign-ups run at the same time (AC-KAN-25-18). Written only by functions; denied to clients by the default rule of `firestore.rules`. New collection: to be added to `domain-glossary` §3 (proposed in PR #17).
- Custom claims `{ role: "subscriber", businessId }` (`auth-and-roles` §1), set by the sign-up function.
- `slug`: lowercase letters `a–z`, digits and single hyphens, 3–40 characters, not starting or ending with a hyphen (AS-7); never in `RESERVED_BUSINESS_SLUG` (`isReservedBusinessSlug`); unique across all businesses in any status.
- Password rules: `PASSWORD_RULE` (minimum 8 characters, lowercase, uppercase, digit, symbol) from `forms-validation-standards` §5.

## Acceptance criteria

### KAN-25 — Sign-up form with personal data, email, visible password and its strength
- [ ] **AC-KAN-25-01** · happy · Given a visitor on the sign-up form, when they fill first name, last name, phone (AS-1), email and a password that meets every `PASSWORD_RULE`, confirm the password (AS-2), solve the reCAPTCHA and submit, then a `User` account is created with that data and the flow continues as in KAN-27. [KAN-25]
- [ ] **AC-KAN-25-02** · happy · Given the visitor types a password, when each character is entered, then a strength indicator shows which `PASSWORD_RULE` items are met and a strength level (`landing:subscriberSignUp.form.strength.*`), using the same rules as the validation. [KAN-25]
- [ ] **AC-KAN-25-03** · happy · Given a password field, when the visitor activates show / hide, then the password becomes readable or masked, the control's accessible name reflects the state, and the typed value and cursor position are kept. [KAN-25]
- [ ] **AC-KAN-25-04** · error · Given a required field is empty, when it loses focus or the form is submitted, then `validation:required` is shown on that field and no account is created. [KAN-25]
- [ ] ~~**AC-KAN-25-05** · error · Given the email is not a valid address, when the field loses focus, then `validation:emailInvalid` is shown. [KAN-25]~~ Invalidated by Q7: the email comes from the checkout and is read-only here (AC-KAN-25-14); it is validated at checkout (AC-KAN-22-05).
- [ ] **AC-KAN-25-06** · error · Given a password that fails any `PASSWORD_RULE`, when the form is validated, then `validation:passwordTooWeak` is shown and the strength indicator marks the missing rules. [KAN-25]
- [ ] **AC-KAN-25-07** · error · Given the confirmation does not match the password, when the confirmation field loses focus, then `landing:subscriberSignUp.form.passwordMismatch` is shown. [KAN-25]
- [ ] **AC-KAN-25-08** · error · Given the reCAPTCHA is not solved, then submit is disabled; and given the token is rejected by the server, when the visitor submits, then no account is created, the reCAPTCHA is reset and `validation:recaptchaRequired` is shown. [KAN-25]
- [ ] **AC-KAN-25-09** · error · Given the email already belongs to an account, when the visitor submits, then no account is created and the neutral message `landing:subscriberSignUp.form.cannotCreateAccount` is shown with a link to sign-in and password recovery. See AS-5. [KAN-25]
- [ ] **AC-KAN-25-10** · error · Given the request fails because of the network, when the visitor submits, then no account is created, the entered values except the passwords are kept and `common:errors.network` is shown. [KAN-25]
- [ ] **AC-KAN-25-11** · edge · Given names or phone outside their limits (AS-3), when the field is validated, then `validation:tooShort` or `validation:tooLong` is shown. [KAN-25]
- [ ] ~~**AC-KAN-25-12** · edge · Given an email with surrounding spaces or upper-case letters, when the account is created, then it is stored trimmed and in lower case. [KAN-25]~~ Invalidated by Q7: the email is normalized at checkout (AC-KAN-22-11).
- [ ] **AC-KAN-25-13** · edge · Given the visitor double-clicks submit, when the first request is in progress, then the button is disabled and only one account is created. [KAN-25]
- [ ] **AC-KAN-25-14** · happy · Given a valid sign-up link from the KAN-24 email, when the visitor opens it, then the form shows the plan they paid for and the checkout email, pre-filled and read-only. [KAN-25, KAN-24]
- [ ] **AC-KAN-25-15** · happy · Given the business name field, when the visitor types a name, then a `slug` is suggested from it (lowercase, accents removed, spaces as hyphens), the visitor can edit it, the page shows the resulting address `/<slug>` and an availability check shows `landing:subscriberSignUp.form.slugAvailable` or the matching error. [KAN-25]
- [ ] **AC-KAN-25-16** · happy · Given every field is valid, when the visitor submits, then in one server call the account is created, a `Business` with `status` `pending`, the name and the `slug` is created and linked to the checkout, the checkout payment is copied to the business's payments, the claims `{ role: "subscriber", businessId }` are set, the link stops working, and the flow continues as in KAN-27. [KAN-25, KAN-27]
- [ ] **AC-KAN-25-17** · error · Given a `slug` that is a reserved slug (for example `admin` or `sign-in`, `RESERVED_BUSINESS_SLUG`), when the field is validated or the form is submitted, then nothing is created and `landing:subscriberSignUp.form.slugReservedError` is shown. [KAN-25]
- [ ] **AC-KAN-25-18** · error · Given a `slug` already used by another business in any status (including `pending` and `rejected`), when the field is checked or the form is submitted, then nothing is created and `landing:subscriberSignUp.form.slugTakenError` is shown; the server checks again inside the transaction, so two sign-ups can never get the same slug. [KAN-25]
- [ ] **AC-KAN-25-19** · error · Given a `slug` with characters or a length outside AS-7, or a business name outside AS-3, when the field is validated, then `landing:subscriberSignUp.form.slugInvalidError`, `validation:tooShort` or `validation:tooLong` is shown and nothing is created. [KAN-25]
- [ ] **AC-KAN-25-20** · error · Given a sign-up link that is expired, already used or malformed, when the visitor opens it, then no form is shown and `landing:subscriberSignUp.link.invalid` is shown; for an expired, unused link it offers to send a new link to the checkout email (AS-6 of the plan-checkout spec). [KAN-25, KAN-24]
- [ ] **AC-KAN-25-21** · edge · Given a visitor opens the sign-up page without a link, when the page loads, then no form is shown and `landing:subscriberSignUp.link.missing` explains that sign-up starts by choosing a plan, with a link to the plans (KAN-7). [KAN-25, KAN-7]
- [ ] **AC-KAN-25-22** · edge · Given the server fails after the account was created but before the business was stored, when the error happens, then nothing is kept (no account without a business), the link stays valid and `common:errors.unknown` is shown. [KAN-25]

### KAN-27 — Automatic redirect to sign-in after finishing sign-up
- [ ] **AC-KAN-27-01** · happy · Given the account was created (AC-KAN-25-01), when the sign-up finishes, then the visitor is taken to the sign-in page, which shows `landing:subscriberSignUp.success` and has the email field filled in with the new email. See AS-6. [KAN-27, KAN-28]
- [ ] **AC-KAN-27-02** · happy · Given the visitor lands on sign-in after sign-up, when they look at the session, then they are not signed in yet; they must sign in with the new credentials. See AS-6. [KAN-27]
- [ ] **AC-KAN-27-03** · error · Given the account creation fails (AC-KAN-25-09, AC-KAN-25-10), when the error is shown, then no redirect happens and the visitor stays on the form. [KAN-27]
- [ ] **AC-KAN-27-04** · edge · Given a signed-in subscriber, customer or super admin opens the sign-up form, when the page loads, then they are redirected to the home of their own portal and the form is not shown. [KAN-27]
- [ ] **AC-KAN-27-05** · edge · Given the visitor uses the browser's back button after the redirect, when they return to the sign-up form, then it is empty and does not submit again. [KAN-27]
- [ ] **AC-KAN-27-06** · happy · Given the new subscriber signs in with the new credentials, when their business is still `pending`, then they land on the "under review" screen of the business portal (AC-KAN-33-09), not on the portal home. [KAN-27, KAN-33]

## BLOCKED
None. Q7 was decided on 2026-09-28: the form is reached from the KAN-24 payment email, and the sign-up creates the account and the `pending` business with its `slug`.

## Assumptions
AS-1 to AS-9 were confirmed by the KAN-25 owner on 2026-10-10; the team can still correct them in the PR.

| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | "Personal data" means first name, last name and phone; phone is optional. | AC-KAN-25-01 |
| AS-7 | Slug rules: 3–40 characters, lowercase `a–z`, digits and single hyphens, not starting or ending with a hyphen; unique across all businesses in any status; never a reserved slug. | AC-KAN-25-15, AC-KAN-25-17 … AC-KAN-25-19 |
| AS-8 | The business `timeZone` defaults to the browser's IANA time zone at sign-up and can be changed later in settings (KAN-31). | Data |
| AS-9 | The business name is 2–80 characters. | AC-KAN-25-19 |
| AS-2 | The form has a password confirmation field. | AC-KAN-25-01, AC-KAN-25-07 |
| AS-3 | Limits: first and last name 2–60 characters each; phone 7–20 characters (digits, spaces, `+`, `-`); business name AS-9. | AC-KAN-25-11, AC-KAN-25-19 |
| AS-4 | The `User.language` is set from the language active on the landing at sign-up. | Data |
| AS-5 | Sign-up does not reveal whether an email is already registered; a neutral message is shown, consistent with `auth-and-roles` §5. | AC-KAN-25-09 |
| AS-6 | After sign-up the new account is signed out and the email is passed to sign-in; the success message is shown once. | AC-KAN-27-01, AC-KAN-27-02 |

## Backlog issues
- The Jira epic title is "Registro del usuario una vez confirmado correo" ("sign-up once the email is confirmed"); the epic map calls it "Registro del usuario". The confirmed email is the KAN-24 payment email (Q7).
- KAN-25 says "usuario"; in this epic it is the future subscriber (business owner), not a `customer` (customer sign-up is KAN-122).
- KAN-25 does not mention the business name or its `slug`; Q4 and Q7 place them here (AC-KAN-25-15 … AC-KAN-25-19). The Jira story should say so.
- `domain-glossary` §3 lists fewer `PlanCheckout` fields than the plan-checkout spec (`termsVersion`, `paymentReference`, `language`, `signUpTokenHash`, `signUpLinkExpiresAt` are missing) and has no `businessSlugs` lock. To be aligned in the glossary (PR #17 or a follow-up).
- KAN-27 says the redirect is "to enter the panel"; until the super admin approves the business (Q2), the panel shows only the "under review" screen (AC-KAN-27-06).

## Non-functional
- i18n keys: new prefix `landing:subscriberSignUp.*` (`landing:subscriberSignUp.form.*`, `landing:subscriberSignUp.form.strength.*`, `landing:subscriberSignUp.link.*`, `landing:subscriberSignUp.success`). Also `common:errors.unknown`. Reused: `validation:required`, `validation:emailInvalid`, `validation:tooShort`, `validation:tooLong`, `validation:passwordTooWeak`, `validation:recaptchaRequired`, `common:errors.network`.
- reCAPTCHA required on the form; submit disabled until there is a token; the token is verified **inside** `completeSubscriberSignUp`, before the account is created, with the shared `assertRecaptcha` helper (`auth-and-roles` §5, `cloud-functions-standards` §5, proposed in PR #17).
- The account, the business, the payment copy and the claims are created by one callable function (`api-mutation-standards` §1); the slug availability check is a callable that returns only available / taken / reserved.
- **Server functions** (`functions/src/billing/`, decided 2026-10-10). All three are public (no signed-in user) and need a valid `signUpToken`; error `details.reason` values come from `SIGN_UP_ERROR_REASON` (`LINK_EXPIRED`, `LINK_INVALID`, `ACCOUNT_EXISTS`, `SLUG_RESERVED`, `SLUG_TAKEN`), mirrored in the client.

  | Function | Payload | Response | Errors (`HttpsError` code · reason) |
  | --- | --- | --- | --- |
  | `validateSignUpLink` | `{ signUpToken }` | `{ checkoutEmail, planName, amountInCents, billingPeriod }` | `invalid-argument` (no token) · `failed-precondition` · `LINK_INVALID` (unknown or used) / `LINK_EXPIRED` |
  | `checkBusinessSlug` | `{ signUpToken, businessSlug }` | `{ availability: "available" \| "taken" \| "reserved" }` | `invalid-argument` (slug outside AS-7) · `failed-precondition` · `LINK_INVALID` / `LINK_EXPIRED` |
  | `completeSubscriberSignUp` | `{ signUpToken, recaptchaToken, firstName, lastName, phone, password, businessName, businessSlug, language, timeZone }` (no email: it comes from the checkout; no confirmation: checked in the form) | `{ email }` (to pre-fill sign-in, KAN-27) | `invalid-argument` (payload outside AS-3, AS-7, AS-9 or `PASSWORD_RULE`) · `permission-denied` / `unavailable` (reCAPTCHA) · `failed-precondition` · `LINK_INVALID` / `LINK_EXPIRED` / `SLUG_RESERVED` · `already-exists` · `SLUG_TAKEN` / `ACCOUNT_EXISTS` (shown with the neutral message, AS-5) · `internal` (`common:errors.unknown`) |

- **Order and rollback of `completeSubscriberSignUp`** (AC-KAN-25-16, AC-KAN-25-22): (1) parse and normalize the payload; (2) verify the reCAPTCHA; (3) find the `PlanCheckout` by `signUpTokenHash` and reject a used or expired link; (4) create the Firebase Auth user with the checkout email (an existing email ⇒ `ACCOUNT_EXISTS`, the link stays valid); (5) in one transaction: re-read the `PlanCheckout` (still unused), `get` `businessSlugs/{slug}` (must not exist), then create the `Business` (`pending`), the `User`, the `businessSlugs/{slug}` lock and the `Payment` copy, and set `signUpCompletedAt`; (6) if the transaction fails, delete the Auth user and re-throw, so no account is left without its business and the link stays valid; (7) after the commit, set the claims `{ role: "subscriber", businessId }` (a failure is logged and repaired from the stored documents; the account and business stay).
- Sign-up is a guest-only page: signed-in users are redirected to their portal.
- No pagination, export, realtime or idle timeout (no session yet).
- Accessibility: labels on every field, errors linked to their field and announced, the strength indicator is readable by screen readers (not colour only), usable at 360 px width.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-25 | AC-KAN-25-01 … AC-KAN-25-15, AC-KAN-25-17, AC-KAN-25-19 … AC-KAN-25-21 (AC-KAN-25-05 and AC-KAN-25-12 struck through) | `tests/SubscriberSignUpPage.test.tsx` |
| KAN-25 | AC-KAN-25-16, AC-KAN-25-18, AC-KAN-25-22 | `functions/src/billing/tests/completeSubscriberSignUp.test.ts` |
| KAN-25 | AC-KAN-25-14, AC-KAN-25-20 (server side) | `functions/src/billing/tests/validateSignUpLink.test.ts` |
| KAN-25 | AC-KAN-25-15, AC-KAN-25-17, AC-KAN-25-18 (availability check) | `functions/src/billing/tests/checkBusinessSlug.test.ts` |
| KAN-25 | `planCheckouts`, `businessSlugs`, `users` denied to clients | `tests/rules/planCheckouts.rules.test.ts` |
| KAN-27 | AC-KAN-27-01 … AC-KAN-27-06 | `tests/SubscriberSignUpPage.test.tsx` |

