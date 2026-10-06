/**
 * @file Type definitions and props for FooterNavLinks component.
 */

import type { MouseEvent } from "react";
import type { FooterNavigationLinkItem } from "@/modules/landing/layout/models";

/**
 * @typedef {Object} FooterNavLinksProps
 * @property {FooterNavigationLinkItem[]} links - List of navigation links to display.
 * @property {(event: MouseEvent<HTMLAnchorElement>, href: string) => void} onNavigate - Handler for link navigation.
 */
export interface FooterNavLinksProps {
  readonly links: FooterNavigationLinkItem[];
  readonly onNavigate: (
    event: MouseEvent<HTMLAnchorElement>,
    href: string,
  ) => void;
}
