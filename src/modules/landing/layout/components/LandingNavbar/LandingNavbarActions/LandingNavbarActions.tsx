import { LayoutDashboard, LogIn, LogOut, Menu, X } from "lucide-react";
import type { ReactElement } from "react";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/common";
import { LANDING_NAVBAR_CONSTANTS } from "@/modules/landing/layout/constants/landingNavbar.constants";
import type { LandingNavbarActionsProps } from "./types";

export const LandingNavbarActions = ({
  closeMenuLabel,
  isMobileMenuOpen,
  isSignedIn,
  onNavigate,
  onSignOut,
  onToggleMobileMenu,
  openMenuLabel,
  portalActionLabel,
  portalActionPath,
  signOutActionLabel,
  signUpActionLabel,
  signUpActionPath,
}: LandingNavbarActionsProps): ReactElement => {
  return (
    <div className="flex items-center gap-2">
      <div className="hidden items-center gap-2 sm:flex">
        <Button
          ariaLabel={portalActionLabel}
          leftIcon={isSignedIn ? LayoutDashboard : LogIn}
          onClick={(): void => onNavigate(portalActionPath)}
          size={BUTTON_SIZE.DEFAULT}
          variant={isSignedIn ? BUTTON_VARIANT.DEFAULT : BUTTON_VARIANT.OUTLINE}
        >
          {portalActionLabel}
        </Button>

        {isSignedIn && onSignOut && signOutActionLabel && (
          <Button
            ariaLabel={signOutActionLabel}
            leftIcon={LogOut}
            onClick={onSignOut}
            size={BUTTON_SIZE.DEFAULT}
            variant={BUTTON_VARIANT.OUTLINE}
          >
            {signOutActionLabel}
          </Button>
        )}

        {!isSignedIn && signUpActionLabel && signUpActionPath && (
          <Button
            ariaLabel={signUpActionLabel}
            onClick={(): void => onNavigate(signUpActionPath)}
            size={BUTTON_SIZE.DEFAULT}
            variant={BUTTON_VARIANT.DEFAULT}
          >
            {signUpActionLabel}
          </Button>
        )}
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
