export interface NavbarNavLink {
  readonly href: string;
  readonly id: string;
  readonly isExternal?: boolean;
  readonly label: string;
}

export interface LandingNavbarProps {
  readonly className?: string;
}

export interface LandingNavbarViewModel {
  readonly brandName: string;
  readonly closeMobileMenu: () => void;
  readonly handleNavigate: (targetPath: string) => void;
  readonly isMobileMenuOpen: boolean;
  readonly isSignedIn: boolean;
  readonly logoAlt: string;
  readonly navLinks: readonly NavbarNavLink[];
  readonly portalActionLabel: string;
  readonly portalActionPath: string;
  readonly toggleMobileMenu: () => void;
}
