import type { MouseEvent, ReactElement } from "react";
import type { NavbarNavLink } from "@/modules/landing/layout/models/landingNavbar.model";
import { AppLink } from "@/shared/components";

export interface LandingNavbarNavLinksProps {
  readonly navLabel: string;
  readonly navLinks: readonly NavbarNavLink[];
  readonly onNavigate: (path: string) => void;
}

export const LandingNavbarNavLinks = ({
  navLabel,
  navLinks,
  onNavigate,
}: LandingNavbarNavLinksProps): ReactElement => {
  return (
    <nav aria-label={navLabel} className="hidden items-center gap-1 md:flex">
      {navLinks.map((linkItem) => (
        <AppLink
          className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          key={linkItem.id}
          onClick={(event: MouseEvent<HTMLAnchorElement>): void => {
            event.preventDefault();
            onNavigate(linkItem.href);
          }}
          to={linkItem.href}
        >
          {linkItem.label}
        </AppLink>
      ))}
    </nav>
  );
};
