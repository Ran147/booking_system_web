import { LayoutDashboard, LogIn, Menu, X } from "lucide-react";
import type { ReactElement } from "react";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/common";
import { LANDING_NAVBAR_CONSTANTS } from "@/modules/landing/layout/constants/landingNavbar.constants";

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

export const LandingNavbarActions = ({
  closeMenuLabel,
  isMobileMenuOpen,
  isSignedIn,
  onNavigate,
  onToggleMobileMenu,
  openMenuLabel,
  portalActionLabel,
  portalActionPath,
}: LandingNavbarActionsProps): ReactElement => {
  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:block">
        <Button
          ariaLabel={portalActionLabel}
          leftIcon={isSignedIn ? LayoutDashboard : LogIn}
          onClick={(): void => onNavigate(portalActionPath)}
          size={BUTTON_SIZE.DEFAULT}
          variant={isSignedIn ? BUTTON_VARIANT.DEFAULT : BUTTON_VARIANT.OUTLINE}
        >
          {portalActionLabel}
        </Button>
      </div>

      <div className="md:hidden">
        <Button
          aria-controls={LANDING_NAVBAR_CONSTANTS.MOBILE_MENU_ID}
          aria-expanded={isMobileMenuOpen}
          ariaLabel={isMobileMenuOpen ? closeMenuLabel : openMenuLabel}
          leftIcon={isMobileMenuOpen ? X : Menu}
          onClick={onToggleMobileMenu}
          size={BUTTON_SIZE.ICON}
          variant={BUTTON_VARIANT.GHOST}
        />
      </div>
    </div>
  );
};
