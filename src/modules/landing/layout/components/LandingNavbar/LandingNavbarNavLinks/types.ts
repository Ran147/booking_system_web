/**
 * @file Type definitions and props for LandingNavbarNavLinks component.
 */

import type { NavbarNavLink } from "@/modules/landing/layout/models/landingNavbar.model";

/**
 * Properties for LandingNavbarNavLinks.
 */
export interface LandingNavbarNavLinksProps {
  readonly navLabel: string;
  readonly navLinks: readonly NavbarNavLink[];
  readonly onNavigate: (path: string) => void;
}
