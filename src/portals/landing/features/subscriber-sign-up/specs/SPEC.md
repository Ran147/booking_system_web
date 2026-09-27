# Subscriber sign-up (KAN-26)

| Field | Value |
| --- | --- |
| Portal | landing |
| Feature folder | `src/portals/landing/features/subscriber-sign-up/` |
| Stories | KAN-25, KAN-27 |
| Status | BLOCKED (partially) |
| Depends on | Q7 (how the subscriber reaches the form; role and business linking); KAN-20 plan checkout (KAN-24 email, Q7); KAN-28 sign-in (`src/features/auth`); KAN-176 business creation (admin, Q7) |

## Intent
A future subscriber (business owner) creates their platform account by filling a form with their personal data, email and a password whose strength they can see, and is then sent to sign-in to enter their business panel.

## Actors and permissions
| Actor | Can |
| --- | --- |
| visitor | Open the sign-up form (reached as decided by Q7) and create a `User` account |
| subscriber, customer, super admin (signed in) | Nothing here: a signed-in user who opens the form is sent to their own portal |

## In scope
- The sign-up form: personal data, email, password with show / hide and strength feedback, reCAPTCHA (KAN-25).
- Creating the `User` account with email and password.
- Redirecting to sign-in after a successful sign-up (KAN-27).

## Out of scope
- How the subscriber reaches the form, and whether the email was confirmed before (after payment email KAN-24, invitation, or open link): Q7.
- Assigning the `subscriber` role claim and linking the account to a `Business` (`ownerUserId`): set by a Cloud Function when the first payment is confirmed (KAN-176), Q7.
- Customer sign-up (KAN-122, customer portal).
- Terms acceptance (KAN-23, Q7).

## Data
- `User` (`users/{userId}`): created with the personal data of the form, the email and the preferred `language` (AS-4). No role claim is set by this flow (Q7).
- No `Business`, `Subscription` or `Payment` is created or changed here.
- Password rules: `PASSWORD_RULE` (minimum 8 characters, lowercase, uppercase, digit, symbol) from `forms-validation-standards` §5.

## Acceptance criteria

### KAN-25 — Sign-up form with personal data, email, visible password and its strength
- [ ] **AC-KAN-25-01** · happy · Given a visitor on the sign-up form, when they fill first name, last name, phone (AS-1), email and a password that meets every `PASSWORD_RULE`, confirm the password (AS-2), solve the reCAPTCHA and submit, then a `User` account is created with that data and the flow continues as in KAN-27. [KAN-25]
- [ ] **AC-KAN-25-02** · happy · Given the visitor types a password, when each character is entered, then a strength indicator shows which `PASSWORD_RULE` items are met and a strength level (`landing:subscriberSignUp.form.strength.*`), using the same rules as the validation. [KAN-25]
- [ ] **AC-KAN-25-03** · happy · Given a password field, when the visitor activates show / hide, then the password becomes readable or masked, the control's accessible name reflects the state, and the typed value and cursor position are kept. [KAN-25]
- [ ] **AC-KAN-25-04** · error · Given a required field is empty, when it loses focus or the form is submitted, then `validation:required` is shown on that field and no account is created. [KAN-25]
- [ ] **AC-KAN-25-05** · error · Given the email is not a valid address, when the field loses focus, then `validation:emailInvalid` is shown. [KAN-25]
- [ ] **AC-KAN-25-06** · error · Given a password that fails any `PASSWORD_RULE`, when the form is validated, then `validation:passwordTooWeak` is shown and the strength indicator marks the missing rules. [KAN-25]
- [ ] **AC-KAN-25-07** · error · Given the confirmation does not match the password, when the confirmation field loses focus, then `landing:subscriberSignUp.form.passwordMismatch` is shown. [KAN-25]
- [ ] **AC-KAN-25-08** · error · Given the reCAPTCHA is not solved, then submit is disabled; and given the token is rejected by the server, when the visitor submits, then no account is created, the reCAPTCHA is reset and `validation:recaptchaRequired` is shown. [KAN-25]
- [ ] **AC-KAN-25-09** · error · Given the email already belongs to an account, when the visitor submits, then no account is created and the neutral message `landing:subscriberSignUp.form.cannotCreateAccount` is shown with a link to sign-in and password recovery. See AS-5. [KAN-25]
- [ ] **AC-KAN-25-10** · error · Given the request fails because of the network, when the visitor submits, then no account is created, the entered values except the passwords are kept and `common:errors.network` is shown. [KAN-25]
- [ ] **AC-KAN-25-11** · edge · Given names or phone outside their limits (AS-3), when the field is validated, then `validation:tooShort` or `validation:tooLong` is shown. [KAN-25]
- [ ] **AC-KAN-25-12** · edge · Given an email with surrounding spaces or upper-case letters, when the account is created, then it is stored trimmed and in lower case. [KAN-25]
- [ ] **AC-KAN-25-13** · edge · Given the visitor double-clicks submit, when the first request is in progress, then the button is disabled and only one account is created. [KAN-25]

### KAN-27 — Automatic redirect to sign-in after finishing sign-up
- [ ] **AC-KAN-27-01** · happy · Given the account was created (AC-KAN-25-01), when the sign-up finishes, then the visitor is taken to the sign-in page, which shows `landing:subscriberSignUp.success` and has the email field filled in with the new email. See AS-6. [KAN-27, KAN-28]
- [ ] **AC-KAN-27-02** · happy · Given the visitor lands on sign-in after sign-up, when they look at the session, then they are not signed in yet; they must sign in with the new credentials. See AS-6. [KAN-27]
- [ ] **AC-KAN-27-03** · error · Given the account creation fails (AC-KAN-25-09, AC-KAN-25-10), when the error is shown, then no redirect happens and the visitor stays on the form. [KAN-27]
- [ ] **AC-KAN-27-04** · edge · Given a signed-in subscriber, customer or super admin opens the sign-up form, when the page loads, then they are redirected to the home of their own portal and the form is not shown. [KAN-27]
- [ ] **AC-KAN-27-05** · edge · Given the visitor uses the browser's back button after the redirect, when they return to the sign-up form, then it is empty and does not submit again. [KAN-27]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| KAN-25 (how the subscriber reaches the form, and whether the email is confirmed before) | Q7 — checkout in the MVP | The entry point of the form (link in the KAN-24 payment email, invitation from a business created by hand, or open link) and any pre-filled email. |
| KAN-25 / KAN-27 (role and business of the new account) | Q7 — checkout in the MVP | Setting the `subscriber` claim and linking the `User` to a `Business`, which decides where sign-in sends a new subscriber (see the `src/features/auth` spec). |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | "Personal data" means first name, last name and phone; phone is optional. | AC-KAN-25-01 |
| AS-2 | The form has a password confirmation field. | AC-KAN-25-01, AC-KAN-25-07 |
| AS-3 | Limits: first and last name 2–60 characters each; phone 7–20 characters (digits, spaces, `+`, `-`). | AC-KAN-25-11 |
| AS-4 | The `User.language` is set from the language active on the landing at sign-up. | Data |
| AS-5 | Sign-up does not reveal whether an email is already registered; a neutral message is shown, consistent with `auth-and-roles` §5. | AC-KAN-25-09 |
| AS-6 | After sign-up the new account is signed out and the email is passed to sign-in; the success message is shown once. | AC-KAN-27-01, AC-KAN-27-02 |

## Backlog issues
- The Jira epic title is "Registro del usuario una vez confirmado correo" ("sign-up once the email is confirmed"); the epic map calls it "Registro del usuario". Which email is confirmed (the KAN-24 payment email or an email verification) is not stated and depends on Q7.
- KAN-25 says "usuario"; in this epic it is the future subscriber (business owner), not a `customer` (customer sign-up is KAN-122).
- KAN-27 says the redirect is "to enter the panel", but a new account has no `subscriber` role until the first payment is confirmed (KAN-176, Q7).

## Non-functional
- i18n keys: new prefix `landing:subscriberSignUp.*` (`landing:subscriberSignUp.form.*`, `landing:subscriberSignUp.form.strength.*`, `landing:subscriberSignUp.success`). Reused: `validation:required`, `validation:emailInvalid`, `validation:tooShort`, `validation:tooLong`, `validation:passwordTooWeak`, `validation:recaptchaRequired`, `common:errors.network`.
- reCAPTCHA required on the form; submit disabled until there is a token; token verified on the server before the account is created (`auth-and-roles` §5).
- Sign-up is a guest-only page: signed-in users are redirected to their portal.
- No pagination, export, realtime or idle timeout (no session yet).
- Accessibility: labels on every field, errors linked to their field and announced, the strength indicator is readable by screen readers (not colour only), usable at 360 px width.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-25 | AC-KAN-25-01 … AC-KAN-25-13 | `tests/SubscriberSignUpPage.test.tsx` |
| KAN-27 | AC-KAN-27-01 … AC-KAN-27-05 | `tests/SubscriberSignUpPage.test.tsx` |
