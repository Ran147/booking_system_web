# Customer settings and profile (KAN-168)

| Field | Value |
| --- | --- |
| Portal | customer |
| Feature folder | `src/portals/customer/features/profile/` |
| Stories | KAN-169, KAN-170, KAN-171, KAN-172, KAN-173 |
| Status | Draft |
| Depends on | KAN-122 customer sign-up (personal data fields captured at sign-up); Q6 decided 2026-09-28 (full name and phone are required), KAN-128 customer sign-in and password recovery, KAN-96 navbar (KAN-109 entry point), `i18n-standards` (languages), `theming-standards` (theme modes) |

## Intent
A signed-in `customer` can check and update the personal data of their platform account, change their password, and choose the interface language (Spanish or English) and appearance (light or dark). Language and theme follow them across devices because they are saved on their account.

## Actors and permissions
| Actor | Can |
| --- | --- |
| `customer` (signed in) | Read and update only their own `User` document (personal data, `language`, `theme`) and change their own password |
| visitor | Change language and theme for the current browser only (stored locally); no profile access |
| `subscriber`, `super_admin` | Nothing in this feature |

## In scope
- View personal data (KAN-169).
- Edit personal data (KAN-170).
- Change password (KAN-171).
- Switch language `es` / `en` (KAN-172).
- Switch theme light / dark (KAN-173).

## Out of scope
- Changing the account email (needs re-verification; no story asks for it, AS-2).
- Deleting the account (no story).
- Business-scoped data about the customer (`Customer` records, notes, blocking: KAN-87, business portal). Editing the profile does not rewrite the businesses' `Customer` records (AS-3).
- Reminder opt-in preferences (no story defines them; see Backlog issues).
- Password recovery when signed out (KAN-132, `features/auth`).

## Data
- `User` (`users/{userId}`): personal data captured at sign-up (KAN-123; field list is AS-1), email (read only here), `language` (`es` | `en`), `theme` (`light` | `dark` | `system`, `theming-standards` §4).
- Browser storage: `STORAGE_KEY.LANGUAGE`, `STORAGE_KEY.THEME`.
- Password lives in Firebase Auth, not in Firestore.
- No new fields beyond those defined by KAN-122 and the standards above.

## Acceptance criteria

### KAN-169 — See my personal data
- [ ] **AC-KAN-169-01** · happy · Given a signed-in `customer`, when they open their profile, then their personal data (see AS-1) and their account email are shown as stored on their `User`. [KAN-169]
- [ ] **AC-KAN-169-02** · edge · Given an optional field that was never filled, when the profile is shown, then `customer:profile.view.notProvidedHint` is shown for it instead of an empty value. [KAN-169]
- [ ] **AC-KAN-169-03** · error · Given the profile cannot be loaded because of the network, when the customer opens it, then an error state with `common:errors.network` and a retry action is shown. [KAN-169]
- [ ] **AC-KAN-169-04** · error · Given a visitor who is not signed in, or a `subscriber` / `super_admin`, when they open the customer profile, then the visitor is sent to sign-in and the other roles to their own portal; no profile data is shown. [KAN-169]

### KAN-170 — Edit my personal data
- [ ] **AC-KAN-170-01** · happy · Given the edit form with the current values, when the customer changes a field with a valid value and saves, then the `User` document is updated, the profile shows the new value and `customer:profile.edit.saveSuccess` is shown. [KAN-170]
- [ ] **AC-KAN-170-02** · error · Given a required field left empty, when the customer saves, then nothing is saved and `validation:required` is shown on that field. [KAN-170]
- [ ] **AC-KAN-170-03** · error · Given a value shorter or longer than allowed, or a phone number with an invalid format, when the customer saves, then nothing is saved and `validation:tooShort`, `validation:tooLong` or `customer:profile.edit.phoneInvalidError` is shown on that field. See AS-1. [KAN-170]
- [ ] **AC-KAN-170-04** · error · Given the save fails because of the network or permissions, when the customer saves, then the stored data is unchanged, the form keeps the typed values and `common:errors.network` or `common:errors.permissionDenied` is shown. [KAN-170]
- [ ] **AC-KAN-170-05** · edge · Given the customer made no change, when they look at the form, then the save action is disabled; given they leave with unsaved changes, then they are asked to confirm discarding them. [KAN-170]
- [ ] **AC-KAN-170-06** · edge · Given the email field, when the customer edits the profile, then the email is shown read-only. See AS-2. [KAN-170]
- [ ] **AC-KAN-170-07** · error · Given a customer who clears their phone number, when they save, then nothing is saved and `validation:required` is shown on the phone field, because a customer account always has a phone (Q6). [KAN-170]

### KAN-171 — Change my password
- [ ] **AC-KAN-171-01** · happy · Given the customer enters their current password, a new password that meets the strength rules and the same new password in the confirmation field, when they submit, then the password is changed, `customer:profile.password.changeSuccess` is shown and they stay signed in. [KAN-171]
- [ ] **AC-KAN-171-02** · error · Given a wrong current password, when the customer submits, then the password is not changed and `customer:profile.password.currentInvalidError` is shown. [KAN-171]
- [ ] **AC-KAN-171-03** · error · Given a new password that does not meet the strength rules, when the customer types or submits it, then the strength indicator shows it as weak and `validation:passwordTooWeak` is shown; nothing is sent. [KAN-171, KAN-124]
- [ ] **AC-KAN-171-04** · error · Given the confirmation does not match the new password, when the customer submits, then nothing is sent and `customer:profile.password.mismatchError` is shown. [KAN-171]
- [ ] **AC-KAN-171-05** · error · Given the request fails because of the network, or too many attempts were made, when the customer submits, then the password is not changed and `common:errors.network` or `customer:profile.password.tooManyAttemptsError` is shown. [KAN-171]
- [ ] **AC-KAN-171-06** · edge · Given a new password equal to the current one, when the customer submits, then nothing is sent and `customer:profile.password.sameAsCurrentError` is shown. See AS-4. [KAN-171]
- [ ] **AC-KAN-171-07** · edge · Given the password fields, when the customer toggles show / hide on each, then that field's value becomes visible or hidden. [KAN-171, KAN-125]
- [ ] **AC-KAN-171-08** · edge · Given the password was changed, when the customer's other sessions (other devices) next refresh their token, then they are signed out. See AS-5. [KAN-171]

### KAN-172 — Switch the interface language between English and Spanish
- [ ] **AC-KAN-172-01** · happy · Given the interface in Spanish, when the customer chooses English, then every text of the portal switches to English without reloading, dates, times and prices are formatted for English, and the choice is saved to `STORAGE_KEY.LANGUAGE` and to `User.language`. [KAN-172]
- [ ] **AC-KAN-172-02** · happy · Given a customer whose `User.language` is `en`, when they sign in on another device, then the interface opens in English. [KAN-172]
- [ ] **AC-KAN-172-03** · happy · Given the customer changed `User.language`, when they later receive a booking email (KAN-163), then it is written in that language. [KAN-172, KAN-164]
- [ ] **AC-KAN-172-04** · error · Given saving `User.language` fails because of the network, when the customer switches language, then the interface still switches for this browser, and `customer:profile.preferences.syncError` tells them the choice was not saved to their account. See AS-6. [KAN-172]
- [ ] **AC-KAN-172-05** · edge · Given no language was ever chosen, when the customer opens the portal, then the detected browser language is used if it is `es` or `en`, otherwise Spanish (`es`). [KAN-172]

### KAN-173 — Switch the appearance between light and dark mode
- [ ] **AC-KAN-173-01** · happy · Given light mode, when the customer chooses dark, then the whole portal switches to the dark theme immediately, and the choice is saved to `STORAGE_KEY.THEME` and to `User.theme`. [KAN-173]
- [ ] **AC-KAN-173-02** · happy · Given a customer whose `User.theme` is `dark`, when they sign in on another device, then the portal opens in dark mode. [KAN-173]
- [ ] **AC-KAN-173-03** · edge · Given the `system` option (default), when the operating system switches between light and dark, then the portal follows it. See AS-7. [KAN-173]
- [ ] **AC-KAN-173-04** · edge · Given a stored theme, when the page loads, then it opens directly in that theme without a flash of the other theme. [KAN-173]
- [ ] **AC-KAN-173-05** · error · Given saving `User.theme` fails because of the network, when the customer switches theme, then the theme still changes for this browser and `customer:profile.preferences.syncError` is shown. See AS-6. [KAN-173]

## BLOCKED
| Story | Waiting on | What stays out until decided |
| --- | --- | --- |
| — | — | No story of this epic is blocked. |

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | Personal data = the fields captured at sign-up (KAN-123): `fullName` and `phone`, plus the account email. Both are required (Q6, 2026-09-28) and follow the same length and format rules as the customer sign-up spec (AS-3 there). | AC-KAN-169-01, AC-KAN-170-03, AC-KAN-170-07 |
| AS-2 | The email cannot be changed from the profile (it would need re-verification, KAN-126). | AC-KAN-170-06 |
| AS-3 | Profile edits change only the `User`; the businesses' `Customer` records keep their own copy (KAN-91 lets the business edit it). | Out of scope |
| AS-4 | The new password must differ from the current one; strength rules are those of sign-up (KAN-124). | AC-KAN-171-03, AC-KAN-171-06 |
| AS-5 | Changing the password revokes the customer's other sessions; the current session stays signed in. | AC-KAN-171-01, AC-KAN-171-08 |
| AS-6 | Language and theme are applied locally even if saving them to the account fails; the next successful switch saves them. | AC-KAN-172-04, AC-KAN-173-05 |
| AS-7 | The theme switch offers light, dark and system (`theming-standards` §4), with system as default, although KAN-173 only mentions light and dark. | AC-KAN-173-03 |

## Backlog issues
- KAN-173 mentions only light and dark; `theming-standards` defines `light`, `dark` and `system`. AS-7 keeps all three; confirm.
- KAN-100 depends on a customer reminder opt-in, but no story in this epic (or elsewhere) lets the customer set it.
- KAN-109 (navbar) and KAN-169 / KAN-170 both describe reaching and changing the profile; the navbar only links here.
- KAN-171 overlaps with password recovery (KAN-132) only in its strength rules; recovery stays in `features/auth`.
- No story covers changing the account email or deleting the account.

## Non-functional
- i18n keys: new prefix `customer:profile.*` (`view.*`, `edit.*`, `password.*`, `preferences.*`); reused `common:errors.network`, `common:errors.permissionDenied`, `validation:required`, `validation:tooShort`, `validation:tooLong`, `validation:passwordTooWeak`. Language and theme switcher labels live in `common` (`i18n-standards` §1).
- The customer writes only their own `User` document; rules deny changes to other users and to the role claim (`auth-and-roles` §4).
- Password change needs recent authentication (the current password is asked every time); errors are mapped to translated messages, never raw Firebase text.
- Private page: `RequireRole` for `customer`; idle logout after `PlatformSettings.idleTimeoutMinutes` (KAN-133, KAN-182). No reCAPTCHA field (signed-in form; App Check protects the backend).
- No pagination or export.
- Accessibility: every field has a label and its error linked with `aria-describedby`; the strength indicator has a text equivalent; the show / hide toggle has an accessible name that reflects its state; theme and language controls are keyboard-operable and both themes meet WCAG AA contrast.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-169 | AC-KAN-169-01 … AC-KAN-169-04 | `tests/ProfilePage.test.tsx` |
| KAN-170 | AC-KAN-170-01 … AC-KAN-170-07 | `tests/ProfilePage.test.tsx` |
| KAN-171 | AC-KAN-171-01 … AC-KAN-171-08 | `tests/ChangePasswordForm.test.tsx` |
| KAN-172 | AC-KAN-172-01 … AC-KAN-172-05 | `tests/PreferencesSection.test.tsx` |
| KAN-173 | AC-KAN-173-01 … AC-KAN-173-05 | `tests/PreferencesSection.test.tsx` |
