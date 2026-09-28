# Login: subscriber and customer sign-in (KAN-28, KAN-128)

| Field | Value |
| --- | --- |
| Portal | shared (used from landing, business, customer and admin) |
| Feature folder | `src/features/auth/` |
| Stories | KAN-33, KAN-34, KAN-35, KAN-36, KAN-37, KAN-38 (KAN-28); KAN-129, KAN-130, KAN-131, KAN-132, KAN-133 (KAN-128) |
| Status | Draft |
| Depends on | KAN-182 platform settings (`PlatformSettings.idleTimeoutMinutes`, admin); KAN-26 subscriber sign-up; KAN-122 customer sign-up; KAN-29 / KAN-110 sign-out; Q7 and Q2 decided 2026-09-28 (a subscriber whose business is `pending` lands on the "under review" screen); Q1 decided 2026-09-28 (collaborators sign in to the business portal); KAN-174 admin businesses (approval PROP-1) |

## Intent
Every account holder (subscriber, collaborator, customer and super admin) signs in with email and password through one flow protected by reCAPTCHA, gets clear errors that never reveal whether an email is registered, can show or hide the password, can recover a forgotten password with a strong new one, and is signed out automatically after a period of inactivity. After sign-in each role lands in its own portal.

## Actors and permissions
| Actor | Can |
| --- | --- |
| visitor | Sign in, request a password reset, set a new password from a valid reset link |
| subscriber | Sign in; lands in the business portal of their own business (`businessId` from the session, never from the URL), or on the "under review" / "rejected" screen while the business is `pending` / `rejected` |
| collaborator | Sign in; lands in the business portal of their business, limited to their permissions (KAN-86) |
| customer | Sign in; lands in the customer portal (my bookings) or back where they were |
| super admin | Sign in with the same flow; lands in the admin portal |
| any signed-in user | Is signed out after `PlatformSettings.idleTimeoutMinutes` without activity |

Signed-in users who open sign-in or password recovery are sent to their own portal.

## In scope
- Sign-in form: email, password with show / hide, reCAPTCHA, error messages (KAN-33, KAN-34, KAN-35, KAN-129, KAN-130, KAN-131).
- Redirect after sign-in by role, or to the page that required sign-in (`redirectTo`).
- Password recovery request by email (KAN-36, KAN-132) and setting a new password with strength feedback (KAN-37).
- Inactivity warning and automatic sign-out (KAN-38, KAN-133).

## Out of scope
- Account creation (KAN-26 subscriber, KAN-122 customer).
- Manual sign-out from the sidebar or navbar (KAN-29, KAN-110), except that idle sign-out follows the same steps.
- Changing the password from the profile while signed in (KAN-168 epic).
- Editing `idleTimeoutMinutes` (KAN-182, admin).
- Social sign-in, multi-factor authentication (no story).

## Data
- `User` (`users/{userId}`): read after sign-in for `language`.
- Session from Firebase Auth custom claims: `role` (`subscriber`, `collaborator`, `customer`, `super_admin`), `businessId` for subscribers and collaborators, `collaboratorId` for collaborators (`auth-and-roles` §1).
- `Business.status` (`pending`, `rejected`, `active`, `inactive`, `suspended`) and `rejectionReason`, read after a subscriber signs in to decide the landing screen (KAN-33).
- `PlatformSettings` (`platformSettings/current`): `idleTimeoutMinutes`, read only. Fallback `DEFAULT_PLATFORM_SETTINGS.IDLE_TIMEOUT_MINUTES` when it cannot be read.
- Password rules: `PASSWORD_RULE` (`forms-validation-standards` §5).
- No new entity or field.

## Acceptance criteria

### KAN-33 — Sign in validating a reCAPTCHA (subscriber)
- [ ] **AC-KAN-33-01** · happy · Given a subscriber with a valid account and a business, when they enter their email and password, solve the reCAPTCHA and submit, then they are signed in and taken to the business portal home of their own business. [KAN-33]
- [ ] **AC-KAN-33-02** · happy · Given a super admin, when they sign in with the same form, then they are taken to the admin portal home. [KAN-33]
- [ ] **AC-KAN-33-03** · happy · Given a signed-out user was sent to sign-in from a protected page (`redirectTo`), when they sign in with a role allowed on that page, then they return to that page; if their role is not allowed there, they go to their own portal home. [KAN-33, KAN-129]
- [ ] **AC-KAN-33-04** · error · Given the reCAPTCHA is not solved, when the user looks at the form, then submit is disabled; and given the token is rejected by the server, when they submit, then they are not signed in, the reCAPTCHA is reset and `validation:recaptchaRequired` is shown. [KAN-33]
- [ ] **AC-KAN-33-05** · error · Given the request fails because of the network, when the user submits, then they stay signed out, the email is kept, the password is cleared and `common:errors.network` is shown. [KAN-33]
- [ ] **AC-KAN-33-06** · edge · Given a subscriber whose business is `inactive` or `suspended`, when they sign in, then sign-in succeeds and they reach the business portal, which is read-only (`business:errors.readOnly`, KAN-49). [KAN-33, KAN-49]
- [ ] **AC-KAN-33-07** · edge · Given a user who is already signed in, when they open the sign-in page, then they are redirected to their own portal home. [KAN-33]
- [ ] **AC-KAN-33-08** · edge · Given the user double-clicks submit, when the first request is in progress, then the button is disabled and shows a loading state; only one attempt is made. [KAN-33]
- [ ] **AC-KAN-33-09** · happy · Given a subscriber whose business is `pending` (paid and signed up, awaiting approval, Q2), when they sign in, then they land on the "under review" screen `business:pendingApproval.*` with the business name, the plan and the sign-up date and a sign-out action; no other screen of the business portal is reachable. [KAN-33, KAN-176]
- [ ] **AC-KAN-33-10** · happy · Given the "under review" screen is open, when the super admin approves the business, then the next status check (on reload or when the screen checks again, AS-9) shows the full business portal without signing in again. [KAN-33, KAN-176]
- [ ] **AC-KAN-33-11** · edge · Given a subscriber whose business is `rejected`, when they sign in, then they land on the "rejected" screen `business:rejected.*` with the rejection reason, the platform contact and a sign-out action. [KAN-33, PROP-1]
- [ ] **AC-KAN-33-12** · error · Given the business status cannot be read after sign-in (network), when the subscriber lands, then no business data is shown and `common:errors.network` is shown with a retry action. [KAN-33]
- [ ] **AC-KAN-33-13** · happy · Given an `active` collaborator, when they sign in with the same form, then they land on the business portal home of their business, showing only what their permissions allow (KAN-86). [KAN-33, KAN-86]
- [ ] **AC-KAN-33-14** · error · Given a collaborator who is `inactive` (KAN-81), when they sign in with the right password, then they are not signed in and `common:auth.signIn.accountDisabled` is shown. [KAN-33, KAN-81]

### KAN-34 — Clear error messages for wrong data (subscriber)
- [ ] **AC-KAN-34-01** · happy · Given the user corrects a field that showed an error, when the value becomes valid, then the error disappears from that field without submitting. [KAN-34]
- [ ] **AC-KAN-34-02** · error · Given an empty email or password, when the field loses focus or the form is submitted, then `validation:required` is shown on that field and no sign-in attempt is made. [KAN-34]
- [ ] **AC-KAN-34-03** · error · Given an email that is not a valid address, when the field loses focus, then `validation:emailInvalid` is shown. [KAN-34]
- [ ] **AC-KAN-34-04** · error · Given an email that is not registered, or a registered email with a wrong password, when the user submits, then the same message `common:auth.signIn.invalidCredentials` is shown in both cases, so the form never reveals whether the email exists. [KAN-34]
- [ ] **AC-KAN-34-05** · error · Given too many failed attempts (Firebase rate limit), when the user submits again, then `common:auth.signIn.tooManyAttempts` is shown with a link to password recovery. [KAN-34]
- [ ] **AC-KAN-34-06** · error · Given an unexpected server error, when the user submits, then `common:errors.unknown` is shown and the user stays signed out. [KAN-34]
- [ ] **AC-KAN-34-07** · edge · Given a server error, when it is shown, then it appears in a message area above the form that is announced to screen readers, and focus moves to it. [KAN-34]

### KAN-35 — Show or hide the password while typing (subscriber)
- [ ] **AC-KAN-35-01** · happy · Given the password field is masked, when the user activates the show / hide control, then the password is readable; activating it again masks it. The typed value and the cursor position are kept. [KAN-35]
- [ ] **AC-KAN-35-02** · happy · Given the control, when its state changes, then its accessible name changes between `common:auth.password.show` and `common:auth.password.hide` and it reports its pressed state. [KAN-35]
- [ ] **AC-KAN-35-03** · error · Given the password is empty and visible, when the user submits, then `validation:required` is shown on the password field and the control keeps its state. [KAN-35]
- [ ] **AC-KAN-35-04** · edge · Given the password is visible, when the user submits, then it is masked again before the request is sent, so the browser does not offer to save it as plain text. See AS-1. [KAN-35]

### KAN-36 — Request password recovery by email (subscriber)
- [ ] **AC-KAN-36-01** · happy · Given a user on sign-in, when they activate `common:auth.signIn.forgotPassword`, then the recovery page opens with the email field pre-filled if they had typed one. [KAN-36]
- [ ] **AC-KAN-36-02** · happy · Given a valid email and a solved reCAPTCHA, when the user submits, then a password-reset email is sent in the account's language if the account exists, and in every case the neutral message `common:auth.passwordReset.requestSent` is shown. [KAN-36]
- [ ] **AC-KAN-36-03** · error · Given an empty or invalid email, when the user submits, then `validation:required` or `validation:emailInvalid` is shown and no email is sent. [KAN-36]
- [ ] **AC-KAN-36-04** · error · Given the reCAPTCHA is not solved or is rejected, when the user submits, then no email is sent and `validation:recaptchaRequired` is shown. [KAN-36]
- [ ] **AC-KAN-36-05** · error · Given the request fails because of the network, when the user submits, then `common:errors.network` is shown and the email is kept. [KAN-36]
- [ ] **AC-KAN-36-06** · edge · Given the user asks again within the waiting time (AS-2), when they submit, then the submit button stays disabled with a countdown until they can ask again. [KAN-36]

### KAN-37 — Password strength feedback when setting a new password (subscriber)
- [ ] **AC-KAN-37-01** · happy · Given a valid reset link, when the user types a new password, then a strength indicator shows which `PASSWORD_RULE` items are met, using the same rules as the validation, and a show / hide control is available (KAN-35). [KAN-37]
- [ ] **AC-KAN-37-02** · happy · Given a new password that meets every rule and a matching confirmation (AS-3), when the user submits, then the password is changed, they are taken to sign-in and `common:auth.passwordReset.success` is shown. [KAN-37]
- [ ] **AC-KAN-37-03** · error · Given a password that fails any rule, when the form is validated, then `validation:passwordTooWeak` is shown and the indicator marks the missing rules. [KAN-37]
- [ ] **AC-KAN-37-04** · error · Given the confirmation does not match, when it loses focus, then `common:auth.passwordReset.mismatch` is shown. [KAN-37]
- [ ] **AC-KAN-37-05** · error · Given a reset link that is expired, already used or malformed, when the page opens, then `common:auth.passwordReset.linkInvalid` is shown with an action to request a new link, and no password form is shown. [KAN-37]
- [ ] **AC-KAN-37-06** · error · Given the request fails because of the network, when the user submits, then the password is not changed and `common:errors.network` is shown. [KAN-37]

### KAN-38 — Automatic sign-out after inactivity (subscriber)
- [ ] **AC-KAN-38-01** · happy · Given a signed-in user and `PlatformSettings.idleTimeoutMinutes` = N, when there is no activity (pointer, keyboard, touch, scroll) for N minutes minus the warning time (AS-4), then a dialog `common:auth.idle.warning` shows a countdown with "Stay signed in" and "Sign out". [KAN-38]
- [ ] **AC-KAN-38-02** · happy · Given the warning is shown, when the user activates "Stay signed in" or interacts with the page, then the dialog closes and the inactivity count restarts. [KAN-38]
- [ ] **AC-KAN-38-03** · happy · Given the countdown reaches zero, when the timeout fires, then the user is signed out, cached data is cleared, and they are taken to sign-in with `common:auth.idle.signedOut` and the current page as `redirectTo`. [KAN-38]
- [ ] **AC-KAN-38-04** · error · Given `PlatformSettings` cannot be read, when the session starts, then the idle timeout uses `DEFAULT_PLATFORM_SETTINGS.IDLE_TIMEOUT_MINUTES` and no error blocks the user. [KAN-38, KAN-182]
- [ ] **AC-KAN-38-05** · error · Given the user was signed out by inactivity, when they use the browser's back button, then no private page data is shown; they stay on sign-in. [KAN-38]
- [ ] **AC-KAN-38-06** · edge · Given the same user has the app open in several tabs, when they are active in one tab, then the other tabs do not sign them out; and when one tab signs out by inactivity, all tabs are signed out. See AS-5. [KAN-38]
- [ ] **AC-KAN-38-07** · edge · Given the super admin changes `idleTimeoutMinutes`, when a signed-in user's next session starts (or the value is refreshed, AS-6), then the new value is used. [KAN-38, KAN-182]
- [ ] **AC-KAN-38-08** · edge · Given the device slept longer than the timeout, when it wakes, then the user is signed out immediately without the warning. [KAN-38]

### KAN-129 — Customer signs in with their credentials
- [ ] **AC-KAN-129-01** · happy · Given a customer with a valid account, when they enter email and password, solve the reCAPTCHA and submit, then they are signed in and taken to "my bookings" in the customer portal, or back to the page that sent them to sign-in (`redirectTo`), such as a business's pages. [KAN-129]
- [ ] **AC-KAN-129-02** · happy · Given a customer signed in, when the session starts, then the interface uses the customer's `User.language`. [KAN-129]
- [ ] **AC-KAN-129-03** · error · Given the reCAPTCHA is not solved or is rejected, when the customer submits, then they are not signed in and `validation:recaptchaRequired` is shown. [KAN-129, KAN-33]
- [ ] **AC-KAN-129-04** · error · Given the request fails because of the network, when the customer submits, then they stay signed out and `common:errors.network` is shown. [KAN-129]
- [ ] **AC-KAN-129-05** · edge · Given a customer who is `blocked` by one business (KAN-93), when they sign in, then sign-in succeeds; blocking applies only inside that business, never to the `User`. [KAN-129, KAN-93]
- [ ] **AC-KAN-129-06** · edge · Given a customer opens the business portal or admin portal after sign-in, when the page loads, then they are redirected to the customer portal home. [KAN-129]

### KAN-130 — Customer gets clear messages for wrong credentials
- [ ] **AC-KAN-130-01** · happy · Given a customer corrects a field that showed an error, when the value becomes valid, then the error disappears. [KAN-130]
- [ ] **AC-KAN-130-02** · error · Given empty fields or an invalid email, when the customer submits, then `validation:required` or `validation:emailInvalid` is shown on the field. [KAN-130]
- [ ] **AC-KAN-130-03** · error · Given an unregistered email or a wrong password, when the customer submits, then `common:auth.signIn.invalidCredentials` is shown in both cases. [KAN-130]
- [ ] **AC-KAN-130-04** · error · Given too many failed attempts, when the customer submits again, then `common:auth.signIn.tooManyAttempts` is shown with a link to password recovery. [KAN-130]

### KAN-131 — Customer shows or hides the password while typing
- [ ] **AC-KAN-131-01** · happy · Given the customer sign-in form, when the customer activates show / hide, then the password becomes readable or masked, with the same behaviour and accessible names as AC-KAN-35-01 and AC-KAN-35-02. [KAN-131]
- [ ] **AC-KAN-131-02** · error · Given the password is empty, when the customer submits with the password visible, then `validation:required` is shown and the control keeps its state. [KAN-131]
- [ ] **AC-KAN-131-03** · edge · Given the password is visible, when the customer submits, then it is masked before the request is sent. See AS-1. [KAN-131]

### KAN-132 — Customer recovers the password by email
- [ ] **AC-KAN-132-01** · happy · Given a customer on sign-in, when they request recovery with a valid email and a solved reCAPTCHA, then a reset email is sent if the account exists and `common:auth.passwordReset.requestSent` is shown in every case. [KAN-132]
- [ ] **AC-KAN-132-02** · happy · Given a valid reset link, when the customer sets a new password that meets `PASSWORD_RULE`, then the password is changed and they are taken to sign-in with `common:auth.passwordReset.success`; the strength feedback of KAN-37 applies. [KAN-132, KAN-37]
- [ ] **AC-KAN-132-03** · error · Given an empty or invalid email, or an unsolved reCAPTCHA, when the customer submits, then `validation:required`, `validation:emailInvalid` or `validation:recaptchaRequired` is shown and no email is sent. [KAN-132]
- [ ] **AC-KAN-132-04** · error · Given an expired or used reset link, when the customer opens it, then `common:auth.passwordReset.linkInvalid` is shown with an action to request a new link. [KAN-132]

### KAN-133 — Customer is signed out after inactivity
- [ ] **AC-KAN-133-01** · happy · Given a signed-in customer inactive for `PlatformSettings.idleTimeoutMinutes`, when the warning countdown ends without activity, then they are signed out and taken to sign-in with `common:auth.idle.signedOut`, as in AC-KAN-38-01 to AC-KAN-38-03. [KAN-133]
- [ ] **AC-KAN-133-02** · error · Given `PlatformSettings` cannot be read, when the customer's session starts, then the fallback `DEFAULT_PLATFORM_SETTINGS.IDLE_TIMEOUT_MINUTES` is used. [KAN-133, KAN-182]
- [ ] **AC-KAN-133-03** · edge · Given a customer is filling a booking form when the timeout fires, when they sign in again, then they return to the page they were on (`redirectTo`); unsaved form data is not kept. See AS-7. [KAN-133]
- [ ] **AC-KAN-133-04** · edge · Given a visitor browsing public customer pages without a session, when they are inactive, then no warning and no sign-out happen. [KAN-133]

## BLOCKED
None. Q7 and Q2 were decided on 2026-09-28: a subscriber whose business is `pending` lands on the "under review" screen (AC-KAN-33-09).

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | A visible password is masked again on submit. | AC-KAN-35-04, AC-KAN-131-03 |
| AS-2 | A new recovery request for the same form can be sent after 60 seconds. | AC-KAN-36-06 |
| AS-3 | Setting a new password asks for a confirmation field. | AC-KAN-37-02, AC-KAN-37-04 |
| AS-4 | The inactivity warning appears 60 seconds before sign-out. | AC-KAN-38-01 |
| AS-5 | Activity and sign-out are shared across tabs of the same browser. | AC-KAN-38-06 |
| AS-6 | `idleTimeoutMinutes` is read when the session starts and refreshed when the settings query refreshes; a change does not sign out active users at once. | AC-KAN-38-07 |
| AS-7 | Unsaved form data is not restored after an idle sign-out. | AC-KAN-133-03 |
| AS-8 | The recovery and reset pages are shared by all roles; the reset email is sent in `User.language`. | AC-KAN-36-02, AC-KAN-132-01 |
| AS-9 | The "under review" screen checks the business status when it loads and again when the window regains focus; no realtime listener. | AC-KAN-33-10 |
| AS-10 | A deactivated collaborator's Firebase account is disabled, so sign-in reports `common:auth.signIn.accountDisabled` only after a correct password; wrong passwords still get the neutral `common:auth.signIn.invalidCredentials`. | AC-KAN-33-14 |

## Backlog issues
- KAN-28 and KAN-128 are both named "Login" and describe the same flow for two roles; covered by one spec in `src/features/auth`. Super admin and collaborator sign-in have no story and use the same flow.
- KAN-33 to KAN-38 say "usuario"; in the KAN-28 epic this is the subscriber (the epic map says "Login (suscriptor)").
- KAN-128 has no stories for reCAPTCHA or password strength; the same rules apply to customers (reCAPTCHA on sign-in, `PASSWORD_RULE` on reset), consistent with `auth-and-roles` §5.
- KAN-38 describes "a security token that signs me out"; the requirement is sign-out after inactivity (`PlatformSettings.idleTimeoutMinutes`), not the lifetime of the Firebase token.
- KAN-37 speaks of strength feedback "when recovering"; the strength check belongs to the page where the new password is set, not to the email request (KAN-36).
- KAN-182 (platform settings, including the idle timeout) sits in the plans epic KAN-180 although it drives this spec.

## Non-functional
- i18n keys: new prefixes `common:auth.signIn.*`, `common:auth.password.*`, `common:auth.passwordReset.*`, `common:auth.idle.*` (the auth feature is shared by every portal, so it uses `common`). Reused: `validation:required`, `validation:emailInvalid`, `validation:passwordTooWeak`, `validation:recaptchaRequired`, `common:errors.network`, `common:errors.unknown`, `business:errors.readOnly`. New in the business namespace: `business:pendingApproval.*`, `business:rejected.*`; new: `common:auth.signIn.accountDisabled`, `common:auth.invitation.*` (collaborator invitation page, KAN-79).
- reCAPTCHA required on sign-in (KAN-33, KAN-129) and on the recovery request; submit disabled until there is a token; token verified on the server before the action.
- Idle timeout from `PlatformSettings.idleTimeoutMinutes` (KAN-182) with a warning dialog; fallback `DEFAULT_PLATFORM_SETTINGS.IDLE_TIMEOUT_MINUTES`.
- Security: errors never reveal whether an email exists; the password is never logged or kept after a failed attempt; sign-out clears cached data; the business comes from the session claim, never from the URL.
- Sign-in, recovery and reset pages are guest-only.
- No pagination or export.
- Accessibility: labelled fields, errors linked to fields and announced, the idle dialog traps focus and is announced, the countdown is readable by screen readers, usable at 360 px width.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-33 | AC-KAN-33-01 … AC-KAN-33-08, AC-KAN-33-13, AC-KAN-33-14 | `tests/SignInPage.test.tsx` |
| KAN-33 | AC-KAN-33-09 … AC-KAN-33-12 | `src/portals/business/layout/tests/BusinessStatusGate.test.tsx` |
| KAN-34 | AC-KAN-34-01 … AC-KAN-34-07 | `tests/SignInPage.test.tsx` |
| KAN-35 | AC-KAN-35-01 … AC-KAN-35-04 | `tests/SignInPage.test.tsx` |
| KAN-36 | AC-KAN-36-01 … AC-KAN-36-06 | `tests/PasswordRecoveryPage.test.tsx` |
| KAN-37 | AC-KAN-37-01 … AC-KAN-37-06 | `tests/ResetPasswordPage.test.tsx` |
| KAN-38 | AC-KAN-38-01 … AC-KAN-38-08 | `tests/IdleSignOut.test.tsx` |
| KAN-129 | AC-KAN-129-01 … AC-KAN-129-06 | `tests/SignInPage.test.tsx` |
| KAN-130 | AC-KAN-130-01 … AC-KAN-130-04 | `tests/SignInPage.test.tsx` |
| KAN-131 | AC-KAN-131-01, AC-KAN-131-02, AC-KAN-131-03 | `tests/SignInPage.test.tsx` |
| KAN-132 | AC-KAN-132-01 … AC-KAN-132-04 | `tests/PasswordRecoveryPage.test.tsx`, `tests/ResetPasswordPage.test.tsx` |
| KAN-133 | AC-KAN-133-01 … AC-KAN-133-04 | `tests/IdleSignOut.test.tsx` |
