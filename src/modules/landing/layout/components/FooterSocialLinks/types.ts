/**
 * @file Type definitions and props for FooterSocialLinks component.
 */

import type {
  FooterSocialLinkItem,
  FooterSocialNetwork,
} from "@/modules/landing/layout/models";

/**
 * @typedef {Object} FooterSocialLinksProps
 * @property {FooterSocialLinkItem[]} socialLinks - List of social media links to display.
 */
export interface FooterSocialLinksProps {
  readonly socialLinks: FooterSocialLinkItem[];
}

/**
 * @typedef {Object} SocialIconProps
 * @property {FooterSocialNetwork} network - Identifier of the social media network.
 */
export interface SocialIconProps {
  readonly network: FooterSocialNetwork;
}
