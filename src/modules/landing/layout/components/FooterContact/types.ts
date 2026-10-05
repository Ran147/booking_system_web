/**
 * @file Type definitions and props for FooterContact component.
 */

import type { FooterContactInfo } from "@/modules/landing/layout/models";

/**
 * @typedef {Object} FooterContactProps
 * @property {FooterContactInfo} contactInfo - Contact details to display in the footer.
 */
export interface FooterContactProps {
  readonly contactInfo: FooterContactInfo;
}
