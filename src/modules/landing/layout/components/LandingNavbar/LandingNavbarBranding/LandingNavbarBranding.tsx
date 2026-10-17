import { Calendar } from "lucide-react";
import type { ReactElement } from "react";
import { Link } from "react-router";
import { Image } from "@/components/common";
import { ROUTE_PATH } from "@/shared/constants";
import type { LandingNavbarBrandingProps } from "./types";

export const LandingNavbarBranding = ({
  brandName,
  hasImageError = false,
  logoAlt,
  logoUrl,
  onImageError,
}: LandingNavbarBrandingProps): ReactElement => {
  const shouldRenderImage = Boolean(logoUrl) && !hasImageError;

  return (
    <Link
      aria-label={`${brandName} - ${logoAlt}`}
      className="flex items-center gap-2.5 transition-opacity hover:opacity-85"
      to={ROUTE_PATH.LANDING.HOME}
    >
      {shouldRenderImage ? (
        <Image
          alt={logoAlt}
          className="h-9 w-9 rounded-lg object-contain shadow-xs"
          onError={onImageError}
          src={logoUrl ?? ""}
        />
      ) : (
        <div
          aria-label={logoAlt}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs"
          role="img"
        >
          <Calendar aria-hidden="true" className="h-5 w-5" />
        </div>
      )}
      <span className="font-headline text-xl font-bold tracking-tight text-foreground">
        {brandName}
      </span>
    </Link>
  );
};
