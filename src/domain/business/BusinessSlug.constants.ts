// The customer portal lives under /:businessSlug (Q4). Static top-level route
// segments win over that dynamic segment in React Router, so a business can
// never take one of them as its slug (domain-glossary §3). A new static
// top-level route adds its segment here in the same PR.
export const RESERVED_BUSINESS_SLUG = {
  ADMIN: "admin",
  BUSINESS: "business",
  CONTACT: "contact",
  PASSWORD_RECOVERY: "password-recovery",
  PLANS: "plans",
  SIGN_IN: "sign-in",
  SIGN_UP: "sign-up",
  TERMS: "terms",
} as const;

export type ReservedBusinessSlug =
  (typeof RESERVED_BUSINESS_SLUG)[keyof typeof RESERVED_BUSINESS_SLUG];
