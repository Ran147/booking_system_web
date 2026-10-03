# Customer sign-up (KAN-122)

| Field | Value |
| --- | --- |
| Portal | customer |
| Feature folder | `src/portals/customer/features/customer-sign-up/` |
| Stories | KAN-123, KAN-124, KAN-125, KAN-126, KAN-127 |
| Status | Draft |
| Depends on | Q4 decided 2026-09-28 (business pages under `/:businessSlug`); Q6 decided 2026-09-28 (a customer account is mandatory to book; full name and phone are collected); `business-home` spec (KAN-116 visitor path); KAN-128 customer login (`src/features/auth`); `forms-validation-standards` password rules; `auth-and-roles` (role claim, reCAPTCHA, `GuestOnly`) |

## Intent
A person who wants to book and manage bookings creates a customer account with their full name, phone, email and a password; an account is mandatory to book (Q6). They see how strong their password is, can show or hide it, verify their email, and are then sent to sign in.

## Actors and permissions
| Actor | Can |
| --- | --- |
| visitor (not signed in) | Open the sign-up form and create a customer account |
| signed-in user (any role) | Cannot use the sign-up form; is redirected to their own portal (`GuestOnly`) |

## In scope
- Sign-up form: full name, phone, email, password, reCAPTCHA (Q6).
- Live password strength feedback and show / hide toggle.
- Email verification after sign-up.
- Redirect to sign-in after a successful sign-up.

## Out of scope
- Sign-in, password recovery and idle logout (KAN-128).
- Editing profile data after sign-up (KAN-168).
- Linking the new account to a `Customer` record a subscriber created earlier (KAN-88, KAN-97). See Backlog issues.
- Any other personal data (birth date, address): not collected (Q6).

## Data
- `User` (`users/{userId}`): created on sign-up with `fullName` and `phone` (both required, Q6, `domain-glossary` §3) and the role `customer`. The `customer` role claim is set by a Cloud Function when sign-up finishes (`auth-and-roles` §1).
- Firebase Auth account: email, password, email-verified flag.
- No business-scoped `Customer` record is created by sign-up (AS-2).

## Acceptance criteria

### KAN-123 — Sign up with personal data and email
- [ ] **AC-KAN-123-01** · happy · Given a visitor on the sign-up form, when they enter a valid full name and phone (Q6), a valid email and a password that meets every password rule, solve the reCAPTCHA and submit, then a `User` with role `customer` is created and the flow continues as in KAN-126 and KAN-127. [KAN-123]
- [ ] **AC-KAN-123-02** · error · Given a required field is empty, when the visitor submits, then nothing is created and `validation:required` is shown on that field. [KAN-123]
- [ ] **AC-KAN-123-03** · error · Given an email with an invalid format, when the visitor leaves the field or submits, then `validation:emailInvalid` is shown and nothing is created. [KAN-123]
- [ ] **AC-KAN-123-04** · error · Given a name or phone longer than its limit (AS-3), when the visitor submits, then `validation:tooLong` is shown on that field and nothing is created. [KAN-123]
- [ ] **AC-KAN-123-05** · error · Given the reCAPTCHA is not solved, when the visitor tries to submit, then submit stays disabled and `validation:recaptchaRequired` is shown; if the reCAPTCHA check fails on the server, no account is created. [KAN-123, KAN-5]
- [ ] **AC-KAN-123-06** · error · Given the email already belongs to an account, when the visitor submits, then no second account is created and the result shown does not reveal whether the email exists. See AS-4. [KAN-123]
- [ ] **AC-KAN-123-07** · error · Given the request fails because of the network, when the visitor submits, then no account is created, `common:errors.network` is shown and the entered data (except the reCAPTCHA) is kept. [KAN-123]
- [ ] **AC-KAN-123-08** · edge · Given a signed-in user of any role, when they open the sign-up form, then they are redirected to their own portal and the form is not shown. [KAN-123]
- [ ] **AC-KAN-123-09** · edge · Given an email typed with capital letters or leading and trailing spaces, when the account is created, then the email is stored trimmed and in lowercase. See AS-5. [KAN-123]
- [ ] **AC-KAN-123-10** · edge · Given the visitor double-clicks submit, when the request is in progress, then submit is disabled and only one account is created. [KAN-123]
- [ ] **AC-KAN-123-11** · happy · Given a valid sign-up, when the account is created, then the `User` stores `fullName` and `phone` as entered (trimmed), and the email and password belong to the Firebase Auth account; no other personal data is asked. [KAN-123]
- [ ] **AC-KAN-123-12** · error · Given the phone field is empty, when the visitor submits, then nothing is created and `validation:required` is shown on the phone field (the phone is required, Q6). [KAN-123]
- [ ] **AC-KAN-123-13** · error · Given a phone with characters other than digits, spaces, `+`, `-` and parentheses, or with fewer digits than AS-3 allows, when the visitor leaves the field or submits, then `validation:phoneInvalid` is shown and nothing is created. See AS-3. [KAN-123]

### KAN-124 — Password strength feedback during sign-up
- [ ] **AC-KAN-124-01** · happy · Given the visitor is typing a password, when each character changes, then a strength meter shows which password rules are met and which are not (minimum length, lowercase, uppercase, digit, symbol) and an overall strength level. [KAN-124]
- [ ] **AC-KAN-124-02** · error · Given a password that fails at least one rule, when the visitor submits, then nothing is created and `validation:passwordTooWeak` is shown on the password field. [KAN-124]
- [ ] **AC-KAN-124-03** · edge · Given a password that meets every rule shown by the meter, when the visitor submits, then no password error is shown (meter and validation never disagree). [KAN-124]
- [ ] **AC-KAN-124-04** · edge · Given an empty password field, when the form loads, then the meter shows every rule as not met without showing an error yet. [KAN-124]

### KAN-125 — Show or hide the password while signing up
- [ ] **AC-KAN-125-01** · happy · Given a password is typed and hidden, when the visitor uses the show / hide control, then the password is shown in plain text, and using it again hides it; the value does not change. [KAN-125]
- [ ] **AC-KAN-125-02** · error · Given the password is shown and the submit fails (validation or `common:errors.network`), when the error appears, then the typed password is kept and its visibility does not change. [KAN-125]
- [ ] **AC-KAN-125-03** · edge · Given the password is shown, when the account is created successfully, then the password is hidden before leaving the form. [KAN-125]
- [ ] **AC-KAN-125-04** · edge · Given a keyboard or screen-reader user, when they reach the show / hide control, then it is operable by keyboard and its accessible name says whether it will show or hide the password (`customer:signUp.form.showPassword` / `customer:signUp.form.hidePassword`). [KAN-125]

### KAN-126 — Verify my email
- [ ] **AC-KAN-126-01** · happy · Given an account was just created, when sign-up finishes, then a verification email is sent to the registered address and `customer:signUp.verification.sent` is shown. [KAN-126]
- [ ] **AC-KAN-126-02** · happy · Given the customer opens a valid verification link, when it is processed, then the account's email is marked as verified and `customer:signUp.verification.success` is shown with an action to go to sign-in. [KAN-126]
- [ ] **AC-KAN-126-03** · error · Given an expired, already used or invalid verification link, when the customer opens it, then the email is not marked as verified and `customer:signUp.verification.linkInvalid` is shown with an action to request a new email. [KAN-126]
- [ ] **AC-KAN-126-04** · error · Given the verification email could not be sent, when sign-up finishes, then the account still exists and `customer:signUp.verification.sendFailed` is shown with an action to resend. [KAN-126]
- [ ] **AC-KAN-126-05** · edge · Given a customer requests a new verification email several times in a row, when the resend limit is reached, then no more emails are sent for a while and `customer:signUp.verification.tooManyRequests` is shown. See AS-6. [KAN-126]
- [ ] **AC-KAN-126-06** · edge · Given a customer whose email is not verified yet, when they sign in, then they can sign in and see `customer:signUp.verification.pending` with an action to resend. See AS-7. [KAN-126, KAN-128]

### KAN-127 — Redirect to sign-in after sign-up
- [ ] **AC-KAN-127-01** · happy · Given the account was created successfully, when sign-up finishes, then the visitor is taken to the sign-in screen, is not signed in, and sees `customer:signUp.success`. See AS-8. [KAN-127]
- [ ] **AC-KAN-127-02** · error · Given sign-up fails for any reason, when the error is shown, then there is no redirect and the visitor stays on the form. [KAN-127]
- [ ] **AC-KAN-127-03** · edge · Given the visitor came to sign-up from a business's pages, when they sign in after sign-up, then they return to that business's pages. [KAN-127, KAN-128]
- [ ] **AC-KAN-127-04** · edge · Given the sign-in screen after sign-up, when it opens, then the email field is prefilled with the registered email. See AS-9. [KAN-127]
- [ ] **AC-KAN-127-05** · happy · Given the visitor came to sign-up from a book action on a service (KAN-116), when they sign in after sign-up, then they return to the booking flow of the same business (`/<businessSlug>/...`) with that service already selected. [KAN-127, KAN-116, KAN-135]
- [ ] **AC-KAN-127-06** · error · Given the visitor came from a book action and the service or the business can no longer be booked when they sign in, when they return, then the booking flow does not open and the matching message of the `business-home` spec is shown (AC-KAN-116-08, AC-KAN-112-06). [KAN-127, KAN-116]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| — | — | None. Q4 (the return destination is under `/<businessSlug>`) and Q6 (account mandatory, full name and phone) were decided on 2026-09-28. |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | ~~"Personal data" means full name (required) and phone (optional).~~ Replaced by the Q6 decision (2026-09-28): full name and phone are both required; no other fields are collected. | AC-KAN-123-01, AC-KAN-123-11, AC-KAN-123-12 |
| AS-2 | Sign-up creates only the platform-wide `User`. The business-scoped `Customer` record is created when the customer books with a business (KAN-145). | Data |
| AS-3 | Full name: 2 to 80 characters; phone: up to 20 characters with 7 to 15 digits (digits, spaces, `+`, `-` and parentheses allowed). | AC-KAN-123-04, AC-KAN-123-13 |
| AS-4 | To follow "never reveal whether an email exists" (`auth-and-roles` §5), an already registered email gets the same result screen as a successful sign-up (verification sent, redirect to sign-in); no email is sent to the existing account. | AC-KAN-123-06 |
| AS-5 | Emails are normalized (trimmed, lowercase) before the account is created. | AC-KAN-123-09 |
| AS-6 | Resending the verification email is limited by Firebase Auth's own rate limit; no custom limit is added. | AC-KAN-126-05 |
| AS-7 | An unverified customer can sign in. Whether an unverified email may confirm a booking is decided in the booking-checkout spec (KAN-148); nothing is blocked here. | AC-KAN-126-06 |
| AS-8 | The account created by Firebase is signed out right after sign-up so that the customer signs in explicitly (KAN-127). | AC-KAN-127-01 |
| AS-9 | The registered email is prefilled on the sign-in screen after sign-up; the password is never passed along. | AC-KAN-127-04 |
| AS-10 | There is no password confirmation field; the show / hide control (KAN-125) replaces it. | AC-KAN-123-01 |

## Backlog issues
- KAN-124 and KAN-125 repeat the subscriber sign-up (KAN-25) and login (KAN-35, KAN-37, KAN-131) stories. The same password field, meter and rules must be shared, not rebuilt.
- KAN-127 mirrors KAN-27 (subscriber redirect after sign-up).
- KAN-126 (email verification) has no equivalent for subscribers; the platform treats the two sign-ups differently without saying why.
- KAN-97 (subscriber invites a customer to register) and KAN-88 (customer without an account) do not say how a new customer account is linked to an existing `Customer` record. KAN-91 is also unclear about registered customers.
- KAN-123 does not say which "personal data" is collected. Q6 (2026-09-28) decided: full name and phone, plus the email and password of the account.

## Non-functional
- i18n prefixes (new): `customer:signUp.form.*`, `customer:signUp.verification.*`, `customer:signUp.success`. New: `validation:phoneInvalid`. Reused: `validation:required`, `validation:emailInvalid`, `validation:tooShort`, `validation:tooLong`, `validation:passwordTooWeak`, `validation:recaptchaRequired`, `common:errors.network`, `common:errors.unknown`.
- reCAPTCHA is required on this public form (KAN-5, `auth-and-roles` §5); submit stays disabled without a token and the token is verified on the server.
- The route is wrapped in `GuestOnly`.
- The `customer` role claim is set only by a Cloud Function; the client refreshes its token afterwards.
- Accessibility: every field has a visible label; errors are linked to their fields and announced; the strength meter is announced as text, not only by color; works at phone width.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-123 | AC-KAN-123-01 … AC-KAN-123-13 | `tests/CustomerSignUpPage.test.tsx`; role claim: `functions/src/auth/tests/setCustomerRole.test.ts` |
| KAN-124 | AC-KAN-124-01 … AC-KAN-124-04 | `tests/CustomerSignUpPage.test.tsx` |
| KAN-125 | AC-KAN-125-01 … AC-KAN-125-04 | `tests/CustomerSignUpPage.test.tsx` |
| KAN-126 | AC-KAN-126-01 … AC-KAN-126-06 | `tests/EmailVerificationPage.test.tsx` |
| KAN-127 | AC-KAN-127-01 … AC-KAN-127-06 | `tests/CustomerSignUpPage.test.tsx` |
