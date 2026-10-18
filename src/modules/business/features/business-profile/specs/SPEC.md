# Business public profile (KAN-199, formerly PROP-4)

| Field | Value |
| --- | --- |
| Portal | business |
| Feature folder | `src/modules/business/features/business-profile/` |
| Stories | KAN-199 (replaces PROP-4) |
| Status | Draft |
| Depends on | Q4 and Q7 decided 2026-09-28 (the `slug` is set at subscriber sign-up, KAN-25, and never changes); KAN-28 subscriber sign-in; KAN-32 subscription (KAN-49 read-only); customer `business-home` spec (KAN-112 shows `logoUrl`, `description`) and customer layout spec (KAN-107, KAN-118, KAN-120, KAN-121 show `logoUrl`, `contactPhone`, `contactEmail`, `socialLinks`); business layout spec (KAN-39 shows the logo) |

## Intent
The subscriber keeps the public face of their business up to date: the logo, a short description, the contact phone and email and the social network links that customers see on the business's pages. Several customer and business stories show this data, but no Jira story lets the subscriber enter it; this proposed story fills that gap. The business address (`slug`) is shown here read-only.

## Actors and permissions
| Actor | Can |
| --- | --- |
| subscriber (own business only) | Read and edit the public profile fields of their own business; read its `slug`. Edits are rejected while the business is `inactive` or `suspended` (KAN-49). |
| collaborator | Nothing: the business profile is subscriber-only (collaborators spec AC-KAN-86-05). |
| customer, visitor | See the result on the business's pages (customer specs); nothing here. |
| super admin | Nothing in this spec. |

## In scope
- Editing `name`, `logoUrl` (upload and remove a logo), `description`, `contactPhone`, `contactEmail` and `socialLinks`.
- Showing the address `/<slug>` read-only.

## Out of scope
- Changing the `slug` (never allowed, glossary §3 "Business slug").
- Business hours, booking confirmation mode and booking policy (KAN-64, KAN-70, schedule spec).
- The personal settings of the subscriber (KAN-31).
- The business `currency` and `timeZone` (no story edits them).

## Data
- `Business` (`businesses/{businessId}`, glossary §3). Public profile fields defined by KAN-199 and documented in `domain-glossary` §3: `logoUrl` (`Nullable<string>`), `description` (`Nullable<string>`), `contactPhone` (`Nullable<string>`), `contactEmail` (`Nullable<string>`), `socialLinks` (`{ network, url }[]`, may be empty).
- Read only here: `slug`, `status`.
- The logo file is stored in Cloud Storage under the business; `logoUrl` points to it (AS-2).
- Rules: the owner may update only `name` and the public profile fields; `slug`, `status` and `ownerUserId` are never writable from the client.

## Acceptance criteria

### KAN-199 — Subscriber edits the business public profile
- [ ] **AC-PROP-4-01** · happy · Given a signed-in subscriber, when they open the business profile, then they see and can edit the current `name`, `logoUrl`, `description`, `contactPhone`, `contactEmail` and `socialLinks`, while the address `/<slug>` is read-only with `business:businessProfile.slug.readOnlyHint`. [KAN-199]
- [ ] **AC-PROP-4-02** · happy · Given valid values, when the subscriber changes the description, contact phone, contact email or social links and saves, then exactly those fields are stored, `business:businessProfile.saveSuccess` is shown and the business's customer pages show the new values on their next load. See AS-3. [KAN-199, KAN-112, KAN-118]
- [ ] **AC-PROP-4-03** · happy · Given an image within the limits of AS-2, when the subscriber uploads it as the logo and saves, then `logoUrl` points to the new image and the sidebar (KAN-39) and the customer navbar (KAN-107) show it; removing the logo sets `logoUrl` to `null` and the initials fallback is shown. See AS-2. [KAN-199, KAN-39, KAN-107]
- [ ] **AC-PROP-4-04** · error · Given an invalid contact email or phone, or a social link that is not an `https` URL, when the subscriber saves, then nothing is stored and `validation:emailInvalid`, `validation:phoneInvalid` or `business:businessProfile.socialLinks.urlInvalid` is shown next to the field. See AS-4. [KAN-199]
- [ ] **AC-PROP-4-05** · error · Given a logo file of a type or size outside AS-2, when the subscriber uploads it, then it is not stored and `business:businessProfile.logo.fileInvalid` is shown. See AS-2. [KAN-199]
- [ ] **AC-PROP-4-06** · error · Given a business that is `inactive` or `suspended`, when the subscriber tries to save, then nothing changes and `business:errors.readOnly` is shown; the profile stays readable. [KAN-199, KAN-49]
- [ ] **AC-PROP-4-07** · error · Given a request that tries to change `slug`, `status`, `ownerUserId` or a field outside KAN-199 directly, when it reaches the server, then it is rejected with `common:errors.permissionDenied` and nothing changes. [KAN-199]
- [ ] **AC-PROP-4-08** · error · Given the request fails because of the network, when the subscriber saves, then the stored profile does not change, the typed values are kept and `common:errors.network` is shown. [KAN-199]
- [ ] **AC-PROP-4-09** · edge · Given a description longer than the limit of AS-4, when the subscriber types, then a counter shows the remaining characters and saving shows `validation:tooLong`. See AS-4. [KAN-199]
- [ ] **AC-PROP-4-10** · edge · Given the subscriber empties an optional field (description, phone, email) and saves, then that field is stored as `null` and the customer pages hide it without an empty placeholder (AC-KAN-112-05). [KAN-199, KAN-112]

## BLOCKED
None.

## Assumptions (to confirm)
| Id | Assumption | Affects |
| --- | --- | --- |
| AS-1 | Every public profile field is optional; a business can publish its pages with only its name. | AC-PROP-4-10 |
| AS-2 | The logo is a PNG, JPEG or WebP image up to 2 MB, stored in Cloud Storage under the business; the old file is deleted when it is replaced or removed. | AC-PROP-4-03, AC-PROP-4-05 |
| AS-3 | Customer pages read the profile on load (no realtime), so changes appear on the next load. | AC-PROP-4-02 |
| AS-4 | Limits: description up to 1,000 characters; phone in the shared phone format (`forms-validation-standards`); up to 5 social links, each `network` from a closed list (for example Instagram, Facebook, TikTok, WhatsApp, website) and an `https` URL. | AC-PROP-4-04, AC-PROP-4-09 |

## Backlog issues
- KAN-199 was created in Jira under KAN-31 and replaces PROP-4. Its Jira title explicitly adds editing the business name.
- KAN-39, KAN-107, KAN-112, KAN-118, KAN-120 and KAN-121 show profile data that no Jira story lets the subscriber enter; this spec is that story.
- KAN-199 explicitly lets the subscriber configure the business name after sign-up.
- The public profile field names are shared with the customer specs and documented in `domain-glossary` §3 by KAN-199.

## Non-functional
- i18n keys (new prefix): `business:businessProfile.*` (`logo.*`, `description.*`, `contact.*`, `socialLinks.*`, `slug.*`, `saveSuccess`). Reused: `validation:required`, `validation:tooLong`, `validation:emailInvalid`, `validation:phoneInvalid`, `business:errors.readOnly`, `common:errors.network`, `common:errors.permissionDenied`.
- Saving is a direct Firestore update that the rules fully validate (`api-mutation-standards` §1); `businessId` comes from `useCurrentBusiness()`. The logo upload uses Storage rules limited to the owner, the content types and the size of AS-2.
- Private page: `RequireRole` for `subscriber`; idle logout (KAN-38). No reCAPTCHA, pagination or realtime.
- Accessibility: every field has a visible label; the logo has alternative text from the business name; the read-only slug is announced as read-only; errors are linked to their fields.

## Traceability
| Story | Criteria | Test file |
| --- | --- | --- |
| KAN-199 | AC-PROP-4-01 … AC-PROP-4-06, AC-PROP-4-08 … AC-PROP-4-10 | `tests/BusinessProfilePage.test.tsx` |
| KAN-199 | AC-PROP-4-07 | `tests/rules/businesses.rules.test.ts` |
