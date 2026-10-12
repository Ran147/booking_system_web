/**
 * @file Type definitions and props for LandingNavbarActions component.
 */

/**
 * Properties for LandingNavbarActions.
 */
export interface LandingNavbarActionsProps {
  readonly closeMenuLabel: string;
  readonly isMobileMenuOpen: boolean;
  readonly isSignedIn: boolean;
  readonly onNavigate: (path: string) => void;
  readonly onToggleMobileMenu: () => void;
  readonly openMenuLabel: string;
  readonly portalActionLabel: string;
  readonly portalActionPath: string;
}
