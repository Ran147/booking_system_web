import { Calendar } from "lucide-react";
import type { ReactElement } from "react";
import { Link } from "react-router";
import { ROUTE_PATH } from "@/shared/constants";

export interface LandingNavbarBrandingProps {
  readonly brandName: string;
  readonly logoAlt: string;
}

export const LandingNavbarBranding = ({
  brandName,
  logoAlt,
}: LandingNavbarBrandingProps): ReactElement => {
  return (
    <Link
      aria-label={`${brandName} - ${logoAlt}`}
      className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
      to={ROUTE_PATH.LANDING.HOME}
    >
      <div
        aria-label={logoAlt}
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs"
        role="img"
      >
        <Calendar aria-hidden="true" className="h-5 w-5" />
      </div>
      <span className="font-headline text-xl font-bold tracking-tight text-foreground">
        {brandName}
      </span>
    </Link>
  );
};
