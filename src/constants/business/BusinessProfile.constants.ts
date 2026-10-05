export const BUSINESS_PROFILE = {
  DESCRIPTION_MAX_LENGTH: 1_000,
  LOGO_MAX_BYTES: 2 * 1_024 * 1_024,
  LOGO_PATH: "profile/logo",
  NAME_MAX_LENGTH: 120,
  PHONE_PATTERN: /^\+?[0-9 ()-]{7,25}$/,
  SOCIAL_LINK_MAX_COUNT: 5,
  VALID_LOGO_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;
