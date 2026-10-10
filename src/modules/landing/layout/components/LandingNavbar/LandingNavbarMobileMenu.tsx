import { LayoutDashboard, LogIn } from "lucide-react";
import type { MouseEvent, ReactElement } from "react";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/common";
import { LANDING_NAVBAR_CONSTANTS } from "@/modules/landing/layout/constants/landingNavbar.constants";
import type { NavbarNavLink } from "@/modules/landing/layout/models/landingNavbar.model";
import { AppLink } from "@/shared/components";
import type { Nullable } from "@/shared/types";

export interface LandingNavbarMobileMenuProps {
  readonly isOpen: boolean;
  readonly isSignedIn: boolean;
  readonly mobileNavLabel: string;
  readonly navLinks: readonly NavbarNavLink[];
  readonly onNavigate: (path: string) => void;
  readonly portalActionLabel: string;
  readonly portalActionPath: string;
}

export const LandingNavbarMobileMenu = ({
  isOpen,
  isSignedIn,
  mobileNavLabel,
  navLinks,
  onNavigate,
  portalActionLabel,
  portalActionPath,
}: LandingNavbarMobileMenuProps): Nullable<ReactElement> => {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="border-b border-border bg-background px-4 pt-2 pb-6 md:hidden"
      id={LANDING_NAVBAR_CONSTANTS.MOBILE_MENU_ID}
    >
      <nav aria-label={mobileNavLabel} className="flex flex-col space-y-1">
        {navLinks.map((linkItem) => (
          <AppLink
            className="flex min-h-[44px] w-full items-center rounded-md px-3 py-2.5 text-base font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            key={`mobile-${linkItem.id}`}
            onClick={(event: MouseEvent<HTMLAnchorElement>): void => {
              event.preventDefault();
              onNavigate(linkItem.href);
            }}
            to={linkItem.href}
          >
            {linkItem.label}
          </AppLink>
        ))}

        <div className="pt-4 sm:hidden">
          <Button
            ariaLabel={portalActionLabel}
            className="w-full justify-center"
            leftIcon={isSignedIn ? LayoutDashboard : LogIn}
            onClick={(): void => onNavigate(portalActionPath)}
            size={BUTTON_SIZE.DEFAULT}
            variant={
              isSignedIn ? BUTTON_VARIANT.DEFAULT : BUTTON_VARIANT.OUTLINE
            }
          >
            {portalActionLabel}
          </Button>
        </div>
      </nav>
    </div>
  );
};
