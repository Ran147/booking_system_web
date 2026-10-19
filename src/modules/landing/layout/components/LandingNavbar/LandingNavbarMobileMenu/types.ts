/**
 * @file Type definitions and props for LandingNavbarMobileMenu component.
 */

import type { NavbarNavLink } from "@/modules/landing/layout/models/landingNavbar.model";

/**
 * Properties for LandingNavbarMobileMenu.
 */
export interface LandingNavbarMobileMenuProps {
  readonly isOpen: boolean;
  readonly isSignedIn: boolean;
  readonly mobileNavLabel: string;
  readonly navLinks: readonly NavbarNavLink[];
  readonly onNavigate: (path: string) => void;
  readonly portalActionLabel: string;
  readonly portalActionPath: string;
  readonly signUpActionLabel?: string;
  readonly signUpActionPath?: string;
}
