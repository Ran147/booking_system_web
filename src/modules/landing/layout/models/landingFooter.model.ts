/**
 * @file JSDoc contracts and types for the Landing Portal Footer (KAN-8, KAN-196).
 */

import type { MouseEvent } from "react";
import type { Nullable } from "@/shared/types";

/**
 * @typedef {"facebook" | "instagram" | "linkedin" | "x"} FooterSocialNetwork
 */
export type FooterSocialNetwork = "facebook" | "instagram" | "linkedin" | "x";

/**
 * @typedef {Object} FooterSocialLinkItem
 * @property {string} ariaLabel - Accessible label for the social icon link.
 * @property {FooterSocialNetwork} network - Identifier of the social media network.
 * @property {string} url - External destination URL.
 */
export interface FooterSocialLinkItem {
  ariaLabel: string;
  network: FooterSocialNetwork;
  url: string;
}

/**
 * @typedef {Object} FooterNavigationLinkItem
 * @property {string} href - Target route path or section anchor.
 * @property {string} id - Unique identifier of the navigation link.
 * @property {string} label - Localized label text.
 */
export interface FooterNavigationLinkItem {
  href: string;
  id: string;
  label: string;
}

/**
 * @typedef {Object} FooterContactInfo
 * @property {Nullable<string>} email - Contact email address or null if unconfigured.
 * @property {Nullable<string>} emailAriaLabel - Accessible label for email link.
 * @property {Nullable<string>} phone - Contact phone number or null if unconfigured.
 * @property {Nullable<string>} phoneAriaLabel - Accessible label for phone link.
 */
export interface FooterContactInfo {
  email: Nullable<string>;
  emailAriaLabel: Nullable<string>;
  phone: Nullable<string>;
  phoneAriaLabel: Nullable<string>;
}

/**
 * @typedef {Object} FooterBrandingInfo
 * @property {string} description - Localized concise platform summary.
 * @property {string} logoAlt - Accessible alt text for the logo.
 * @property {string} name - Brand name of the platform.
 */
export interface FooterBrandingInfo {
  description: string;
  logoAlt: string;
  name: string;
}

/**
 * @typedef {Object} LandingFooterConfig
 * @property {string} [email] - Contact email override.
 * @property {string} [phone] - Contact phone override.
 * @property {Partial<Record<FooterSocialNetwork, string>>} [socialUrls] - Social network URL overrides.
 */
export interface LandingFooterConfig {
  email?: string;
  phone?: string;
  socialUrls?: Partial<Record<FooterSocialNetwork, string>>;
}

/**
 * @typedef {Object} LandingFooterProps
 * @property {string} [className] - Optional custom CSS classes.
 * @property {LandingFooterConfig} [config] - Optional configuration overrides for contact & social links.
 */
export interface LandingFooterProps {
  className?: string;
  config?: LandingFooterConfig;
}

/**
 * @typedef {Object} UseLandingFooterViewModelReturn
 * @property {FooterBrandingInfo} branding - Branding details for the footer.
 * @property {FooterContactInfo} contactInfo - Sanitized contact info with null fallbacks.
 * @property {number} currentYear - Current calendar year for copyright notice.
 * @property {(event: MouseEvent<HTMLAnchorElement>, href: string) => void} handleNavigation - Smooth scroll or route navigation handler.
 * @property {boolean} hasContact - Whether at least one contact channel is available.
 * @property {boolean} hasNavigation - Whether navigation links are configured.
 * @property {boolean} hasSocial - Whether at least one valid social link is configured.
 * @property {FooterNavigationLinkItem[]} navigationLinks - List of active navigation links.
 * @property {FooterSocialLinkItem[]} socialLinks - List of active, valid social links.
 */
export interface UseLandingFooterViewModelReturn {
  branding: FooterBrandingInfo;
  contactInfo: FooterContactInfo;
  currentYear: number;
  handleNavigation: (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => void;
  hasContact: boolean;
  hasNavigation: boolean;
  hasSocial: boolean;
  navigationLinks: FooterNavigationLinkItem[];
  socialLinks: FooterSocialLinkItem[];
}
