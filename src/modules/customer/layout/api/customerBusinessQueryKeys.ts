export const customerBusinessQueryKeys = Object.freeze({
  all: ["customer-business"] as const,
  bySlug: (businessSlug: string) =>
    ["customer-business", "slug", businessSlug] as const,
});
