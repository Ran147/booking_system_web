import { RESERVED_BUSINESS_SLUG } from "./constants/BusinessSlug.constants.js";

// Mirror of src/domain/business/isReservedBusinessSlug.ts — keep in sync.
const RESERVED_BUSINESS_SLUGS: ReadonlySet<string> = new Set(
  Object.values(RESERVED_BUSINESS_SLUG),
);

// Slugs are stored lowercase (domain-glossary §3), so the check ignores case.
export const isReservedBusinessSlug = (slug: string): boolean =>
  RESERVED_BUSINESS_SLUGS.has(slug.trim().toLowerCase());
