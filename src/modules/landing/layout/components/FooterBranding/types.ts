/**
 * @file Type definitions and props for FooterBranding component.
 */

import type { FooterBrandingInfo } from "@/modules/landing/layout/models";

/**
 * @typedef {Object} FooterBrandingProps
 * @property {FooterBrandingInfo} branding - Platform branding details to display.
 */
export interface FooterBrandingProps {
  readonly branding: FooterBrandingInfo;
}
