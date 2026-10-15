// Mirror of src/domain/business/BusinessSlug.constants.ts — keep in sync.
// Static top-level route segments a business can never take as its slug.
export const RESERVED_BUSINESS_SLUG = Object.freeze({
  ADMIN: "admin",
  BUSINESS: "business",
  CONTACT: "contact",
  PASSWORD_RECOVERY: "password-recovery",
  PLANS: "plans",
  SIGN_IN: "sign-in",
  SIGN_UP: "sign-up",
  TERMS: "terms",
} as const);
