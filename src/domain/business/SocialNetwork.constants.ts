export const SOCIAL_NETWORK = Object.freeze({
  FACEBOOK: "facebook",
  INSTAGRAM: "instagram",
  TIKTOK: "tiktok",
  WEBSITE: "website",
  WHATSAPP: "whatsapp",
});

/** Supported network identifier stored in a business public profile. */
export type SocialNetwork =
  (typeof SOCIAL_NETWORK)[keyof typeof SOCIAL_NETWORK];
