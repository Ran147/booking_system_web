import type { Nullable } from "@/types";
import type { BusinessStatus } from "./BusinessStatus.constants";
import type { SocialNetwork } from "./SocialNetwork.constants";

/** Public link displayed for a business profile. */
export interface SocialLink {
  /** Supported social network represented by the link. */
  network: SocialNetwork;
  /** Public HTTPS address for the social profile. */
  url: string;
}

/** Public-facing fields loaded from a business document. */
export interface BusinessPublicProfile {
  /** Optional email displayed to customers. */
  contactEmail: Nullable<string>;
  /** Optional phone number displayed to customers. */
  contactPhone: Nullable<string>;
  /** Optional public description of the business. */
  description: Nullable<string>;
  /** Firestore identifier of the business. */
  id: string;
  /** Optional public URL of the business logo. */
  logoUrl: Nullable<string>;
  /** Public business name. */
  name: string;
  /** Immutable public URL segment. */
  slug: string;
  /** Configured public social links. */
  socialLinks: SocialLink[];
  /** Current lifecycle status of the business. */
  status: BusinessStatus;
}
