export const SOCIAL_NETWORK = {
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  TIKTOK: "tiktok",
  WEBSITE: "website",
  WHATSAPP: "whatsapp",
} as const;

/** Supported network identifier stored in a business public profile. */
export type SocialNetwork =
  (typeof SOCIAL_NETWORK)[keyof typeof SOCIAL_NETWORK];
