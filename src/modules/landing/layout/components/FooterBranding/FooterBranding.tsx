import { Calendar } from "lucide-react";
import type { ReactElement } from "react";
import type { FooterBrandingProps } from "./types";

export const FooterBranding = ({
  branding,
}: FooterBrandingProps): ReactElement => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          aria-label={branding.logoAlt}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm"
          role="img"
        >
          <Calendar aria-hidden="true" className="h-5 w-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">
          {branding.name}
        </span>
      </div>
      <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
        {branding.description}
      </p>
    </div>
  );
};
