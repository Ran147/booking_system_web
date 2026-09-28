# Open questions

While a question is open, nobody implements or invents anything for it. Specs that depend on it are marked **BLOCKED** (`backlog-to-spec`), and `domain-glossary` §5 lists what stays out of the code.

When the team decides, write the answer here with the date, update `domain-glossary` §5 and the affected specs **in the same PR**. A partial decision records what was decided; the rest stays BLOCKED.

The decisions dated 2026-09-28 were taken by the team and reported by Lorenzo.

| Id | Question | Stories | Status | Decision |
| --- | --- | --- | --- | --- |
| Q1 | Is the collaborator a fifth actor, or are its stories removed? | KAN-78, 79, 84, 85, 86 (also mentioned in KAN-61, 67, 68, 80–83, 134–138, 142) | Partially decided | 2026-09-28: confirmed as a fifth actor; what it sees and can do is still pending. Collaborator stories stay BLOCKED. |
| Q2 | Does a `pending` status exist for a business? | KAN-175 | Partially decided | 2026-09-28: yes, a `pending` business status exists; what it means (when a business enters and leaves it) is still pending. Stays BLOCKED: nothing is added to the business status machine yet. |
| Q3 | Which "approvals" does the audit log record? | KAN-194 | Partially decided | 2026-09-28: a simple approval flow will be created; what is approved is still pending. `AuditLogEntry.actionType` values stay BLOCKED. |
| Q4 | How is a business page reached: slug in the URL, subdomain or a search? | KAN-111 epic, customer portal routes | Decided | 2026-09-28: by link with a slug in the path, `sitio.com/<business-slug>`. `Business.slug` is unique, lowercase and URL-safe; the customer portal lives under `/:businessSlug/...`. Static top-level routes (landing, auth, business, admin) win over the slug segment, and their segments are reserved slugs (`domain-glossary` §3). |
| Q5 | What does the simulated gateway do for automatic renewals? | KAN-48 (duplicate: KAN-50) | Decided | 2026-09-28: the simulated gateway only fakes a successful or a failed payment. Automatic renewal retries (KAN-48, duplicate KAN-50) are deferred until the project is further along (out of MVP). `past_due` stays in the subscription machine, but nothing in the MVP drives retries. |
| Q6 | Can a visitor book without an account? | KAN-116 | Decided | 2026-09-28: no, a customer account is mandatory. The customer gives full name and phone number, plus the email and password of the account. A visitor who starts a booking signs in or signs up and returns to the booking flow at the same service. `Booking` has no guest fields. |
| Q7 | Does the MVP include plan checkout with the gateway, or start with a business created by hand? | KAN-20 epic, KAN-176 | Voting | — |
