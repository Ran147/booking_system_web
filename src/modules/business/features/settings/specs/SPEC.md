# Subscriber and collaborator settings (KAN-31)

| Field | Value |
| --- | --- |
| Portal | business |
| Feature folder | `src/portals/business/features/settings/` |
| Stories | KAN-51, KAN-52, KAN-53 |
| Status | Draft |
| Depends on | KAN-28 (subscriber sign-in and session); Q1 decided 2026-09-28 (a collaborator has the same personal settings); password rules from KAN-25 / KAN-37 (`forms-validation-standards` §5); `i18n-standards` (languages); `theming-standards` §4 (theme modes) |

## Intent
The subscriber, or a collaborator, adjusts their own account from a settings screen in the business portal: the interface language (Spanish or English), the appearance (light or dark) and their password. These are personal account settings, not business data.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own account only) | Change their own language, theme and password. |
| customer | Has equivalent settings in the customer portal (KAN-168 epic); not part of this spec. |
| super admin | Not part of this spec. |
| collaborator (own account only, `active`) | Change their own language, theme and password, exactly like the subscriber. No permission is needed (AS-5). |

## In scope
- Language switch between `es` and `en` for the business portal, saved to the subscriber's profile.
- Theme switch between light and dark (and the existing `system` mode), saved to the profile.
- Change password from settings, requiring the current password.

## Out of scope
- Business settings such as business hours, booking confirmation mode or booking policies (KAN-63 epic).
- Notification settings (KAN-99 epic).
- Password recovery by email when the password is forgotten (KAN-36, auth spec).
- Changing the account email.

## Data
- `User` at `users/{userId}` (`domain-glossary` §3): `language` (`es` | `en`, `i18n-standards`), `theme` (`light` | `dark` | `system`, `theming-standards` §4).
- Browser storage keys `STORAGE_KEY.LANGUAGE` and `STORAGE_KEY.THEME` (per device).
- Password is managed by Firebase Auth; nothing is stored in Firestore.
- No new fields.

## Acceptance criteria

### KAN-51 — Change language (Spanish / English)
- [ ] **AC-KAN-51-01** · happy · Given a signed-in subscriber whose interface is in Spanish, when they choose English in settings, then every text of the business portal changes to English without reloading, and dates, times and prices are formatted with the English locale (still in the business `timeZone` and currency). [KAN-51]
- [ ] **AC-KAN-51-02** · happy · Given the subscriber chose a language, when they sign in again on another device, then the portal opens in the chosen language (`User.language`). [KAN-51]
- [ ] **AC-KAN-51-03** · error · Given saving the choice to the profile fails because of the network, when the subscriber changes the language, then the interface still switches on this device, the choice is kept in the browser, and `business:settings.language.saveError` is shown to say it was not saved to the account. [KAN-51]
- [ ] **AC-KAN-51-04** · edge · Given a subscriber who never chose a language, when they first open the portal, then the detected browser language is used if it is `es` or `en`, otherwise Spanish (`es`). [KAN-51]
- [ ] **AC-KAN-51-05** · edge · Given the language is changed, when emails and exported files are generated for this subscriber afterwards, then they use the new language (`User.language`). [KAN-51]
- [ ] **AC-KAN-51-06** · edge · Given a business that is `inactive` or `suspended`, when the subscriber changes the language, then the change is allowed. See AS-1. [KAN-51, KAN-49]
- [ ] **AC-KAN-51-07** · happy · Given a signed-in `active` collaborator, when they choose another language in settings, then the result is the same as AC-KAN-51-01 and AC-KAN-51-02, saved to their own `User.language`. See AS-5. [KAN-51]

### KAN-52 — Change theme (light / dark)
- [x] **AC-KAN-52-01** · happy · Given a signed-in subscriber using the light theme, when they choose dark in settings, then the whole business portal switches to the dark theme immediately, and the choice is kept after reloading. [KAN-52]
- [x] **AC-KAN-52-02** · happy · Given the subscriber chose a theme, when they sign in again on another device, then the portal opens in that theme (`User.theme`). [KAN-52]
- [x] **AC-KAN-52-03** · error · Given saving the choice to the profile fails because of the network, when the subscriber changes the theme, then the theme still changes on this device, and `business:settings.theme.saveError` is shown to say it was not saved to the account. [KAN-52]
- [x] **AC-KAN-52-04** · edge · Given the `system` option is selected, when the operating system switches between light and dark, then the portal follows it without reloading. See AS-2. [KAN-52]
- [x] **AC-KAN-52-05** · edge · Given a stored theme, when the portal loads, then it opens directly in that theme without first flashing the other one. [KAN-52]
- [x] **AC-KAN-52-06** · edge · Given a business that is `inactive` or `suspended`, when the subscriber changes the theme, then the change is allowed. See AS-1. [KAN-52, KAN-49]

### KAN-53 — Change password from settings
- [ ] **AC-KAN-53-01** · happy · Given a signed-in subscriber, when they enter their current password and a new password that meets the password rules, confirm it and save, then the password is changed, `business:settings.password.successMessage` is shown, and the next sign-in only works with the new password. [KAN-53]
- [ ] **AC-KAN-53-02** · error · Given a wrong current password, when the subscriber saves, then the password is not changed and `business:settings.password.currentPasswordInvalid` is shown next to the current password field. [KAN-53]
- [ ] **AC-KAN-53-03** · error · Given a new password that does not meet the password rules, when the subscriber saves, then nothing is changed, `validation:passwordTooWeak` is shown and the strength meter shows which rules are missing. [KAN-53]
- [ ] **AC-KAN-53-04** · error · Given a confirmation that does not match the new password, when the subscriber saves, then nothing is changed and `business:settings.password.confirmationMismatch` is shown. [KAN-53]
- [ ] **AC-KAN-53-05** · error · Given an empty field, when the subscriber saves, then nothing is changed and `validation:required` is shown next to it. [KAN-53]
- [ ] **AC-KAN-53-06** · error · Given too many failed attempts with the current password, when the subscriber tries again, then the change is rejected and `business:settings.password.tooManyAttempts` is shown; the message never reveals more than that. [KAN-53]
- [ ] **AC-KAN-53-07** · error · Given the request fails because of the network, when the subscriber saves, then the password is not changed and `common:errors.network` is shown. [KAN-53]
- [ ] **AC-KAN-53-08** · edge · Given a new password equal to the current one, when the subscriber saves, then nothing is changed and `business:settings.password.sameAsCurrent` is shown. See AS-3. [KAN-53]
- [ ] **AC-KAN-53-09** · edge · Given the password was changed, when other devices or sessions of the same account make their next request, then they are signed out and must sign in again; the current session stays signed in. See AS-4. [KAN-53]
- [ ] **AC-KAN-53-10** · edge · Given the password fields, when the subscriber uses show / hide, then each field toggles its visibility independently, and the entered values are cleared after a successful change. [KAN-53]
- [ ] **AC-KAN-53-11** · edge · Given a business that is `inactive` or `suspended`, when the subscriber changes the password, then the change is allowed. See AS-1. [KAN-53, KAN-49]
- [ ] **AC-KAN-53-12** · happy · Given a signed-in `active` collaborator, when they change their password as in AC-KAN-53-01, then their own password changes and nothing of the business or of the subscriber account changes. See AS-5. [KAN-53]

## BLOCKED
None. No story of this epic is blocked; Q1 (2026-09-28) adds the collaborator as a user of these personal settings (AC-KAN-51-07, AC-KAN-53-12).

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | Language, theme and password are personal account settings, not business data, so the read-only rule of KAN-49 (`business:errors.readOnly`) does not apply to them. A read-only subscriber must still be able to secure their account. | AC-KAN-51-06, AC-KAN-52-06, AC-KAN-53-11 |
| AS-2 | The theme switch offers `light`, `dark` and `system` (default `system`), as in `theming-standards`, although KAN-52 mentions only light and dark. | AC-KAN-52-04 |
| AS-3 | The new password must differ from the current one. | AC-KAN-53-08 |
| AS-4 | Changing the password revokes the other sessions of the account (Firebase revokes refresh tokens on password change); the current session is re-authenticated and continues. | AC-KAN-53-09 |
| AS-5 | Personal settings are open to every business-portal user, including a collaborator without permissions: they are not a business area covered by `CollaboratorPermission` (collaborators spec AS-3). | AC-KAN-51-07, AC-KAN-53-12 |

## Backlog issues
- KAN-52 says "mi página/interfaz gráfica": it is unclear whether the theme also changes the business's public page seen by customers. Read as the subscriber's own interface only.
- KAN-52 mentions only light / dark, while the theming standard also has `system` (AS-2).
- KAN-51, KAN-52 and KAN-53 overlap the customer settings epic (KAN-168); both portals should share the same behavior and keys where possible.

## Non-functional
- i18n keys (new prefixes): `business:settings.language.*`, `business:settings.theme.*`, `business:settings.password.*`. Reused: `validation:required`, `validation:passwordTooWeak`, `common:errors.network`. Language and theme option labels live in `common` (switchers).
- Password form uses the shared password input with show / hide and the strength meter driven by the password rules (`forms-validation-standards` §5). No reCAPTCHA (authenticated form, re-authentication with the current password instead).
- Auth errors from the password change are mapped to translated keys; raw Firebase messages are never shown.
- Idle logout (KAN-38) applies on this screen.
- No pagination, export or realtime.
- Accessibility: language and theme controls are radio groups with labels; the active option is announced; the theme meets WCAG AA contrast in both modes; password errors are linked to their fields.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-51 | AC-KAN-51-01 … AC-KAN-51-07 | `tests/SettingsPage.test.tsx` |
| KAN-51 | AC-KAN-51-05 | `functions/src/notifications/tests/recipientLanguage.test.ts` |
| KAN-52 | AC-KAN-52-01 … AC-KAN-52-06 | `tests/SettingsPage.test.tsx` |
| KAN-53 | AC-KAN-53-01 … AC-KAN-53-12 | `tests/ChangePasswordForm.test.tsx` |
