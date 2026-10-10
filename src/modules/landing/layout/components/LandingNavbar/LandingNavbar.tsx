import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { LANDING_NAVBAR_CONSTANTS } from "@/modules/landing/layout/constants/landingNavbar.constants";
import { useLandingNavbarViewModel } from "@/modules/landing/layout/hooks/useLandingNavbarViewModel";
import type { LandingNavbarProps } from "@/modules/landing/layout/models/landingNavbar.model";
import { I18N_NAMESPACE } from "@/shared/constants";
import { cn } from "@/shared/utils/cn";
import { LandingNavbarActions } from "./LandingNavbarActions";
import { LandingNavbarBranding } from "./LandingNavbarBranding";
import { LandingNavbarMobileMenu } from "./LandingNavbarMobileMenu";
import { LandingNavbarNavLinks } from "./LandingNavbarNavLinks";

export const LandingNavbar = ({
  className,
}: LandingNavbarProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.LANDING);
  const viewModel = useLandingNavbarViewModel();

  return (
    <header
      aria-label={t(LANDING_NAVBAR_CONSTANTS.NAVBAR_LANDMARK_LABEL_KEY)}
      className={cn(
        "sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md transition-colors",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <LandingNavbarBranding
          brandName={viewModel.brandName}
          logoAlt={viewModel.logoAlt}
        />

        <LandingNavbarNavLinks
          navLabel={t("home.navbar.linksNavLabel")}
          navLinks={viewModel.navLinks}
          onNavigate={viewModel.handleNavigate}
        />

        <LandingNavbarActions
          closeMenuLabel={t("home.navbar.menuClose")}
          isMobileMenuOpen={viewModel.isMobileMenuOpen}
          isSignedIn={viewModel.isSignedIn}
          onNavigate={viewModel.handleNavigate}
          onToggleMobileMenu={viewModel.toggleMobileMenu}
          openMenuLabel={t("home.navbar.menuOpen")}
          portalActionLabel={viewModel.portalActionLabel}
          portalActionPath={viewModel.portalActionPath}
        />
      </div>

      <LandingNavbarMobileMenu
        isOpen={viewModel.isMobileMenuOpen}
        isSignedIn={viewModel.isSignedIn}
        mobileNavLabel={t("home.navbar.mobileNavLabel")}
        navLinks={viewModel.navLinks}
        onNavigate={viewModel.handleNavigate}
        portalActionLabel={viewModel.portalActionLabel}
        portalActionPath={viewModel.portalActionPath}
      />
    </header>
  );
};
