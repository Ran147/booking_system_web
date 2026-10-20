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
  readonly handleLogoImageError: () => void;
  readonly handleNavigate: (targetPath: string) => void;
  readonly handleSignOut: () => Promise<void>;
  readonly hasLogoImageError: boolean;
  readonly isMobileMenuOpen: boolean;
  readonly isSignedIn: boolean;
  readonly logoAlt: string;
  readonly logoUrl?: string;
  readonly navLinks: readonly NavbarNavLink[];
  readonly portalActionLabel: string;
  readonly portalActionPath: string;
  readonly signOutActionLabel: string;
  readonly signUpActionLabel: string;
  readonly signUpActionPath: string;
  readonly toggleMobileMenu: () => void;
}
