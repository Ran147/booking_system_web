import { useState, type ReactElement, type ReactNode } from "react";
import type { Nullable } from "@/types";

const START_INDEX = 0;
const MAX_INITIALS_LENGTH = 2;

export interface PortalSidebarHeaderProps {
  readonly badge?: ReactNode;
  readonly brandInitials?: string;
  readonly brandName: string;
  readonly collaboratorName?: Nullable<string>;
  readonly logoUrl?: Nullable<string>;
}

export const PortalSidebarHeader = ({
  badge,
  brandInitials,
  brandName,
  collaboratorName,
  logoUrl,
}: PortalSidebarHeaderProps): ReactElement => {
  const [imageError, setImageError] = useState<boolean>(false);

  const computedInitials =
    brandInitials ||
    brandName
      .split(/[\s-_]+/)
      .filter((word) => word.length > START_INDEX)
      .slice(START_INDEX, MAX_INITIALS_LENGTH)
      .map((word) => word[START_INDEX]?.toUpperCase() ?? "")
      .join("") ||
    "";

  const showLogo = Boolean(logoUrl) && !imageError;

  return (
    <div className="flex flex-col gap-3 border-b border-border/70 pb-5">
      <div className="flex items-center gap-3">
        {showLogo ? (
          <img
            alt={brandName}
            className="size-10 shrink-0 rounded-xl object-cover"
            onError={() => setImageError(true)}
            src={logoUrl ?? ""}
          />
        ) : (
          computedInitials && (
            <div
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary"
            >
              {computedInitials}
            </div>
          )
        )}
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-base font-semibold tracking-tight text-foreground"
            title={brandName}
          >
            {brandName}
          </p>
          {collaboratorName && (
            <p
              className="truncate text-xs font-medium text-muted-foreground"
              title={collaboratorName}
            >
              {collaboratorName}
            </p>
          )}
          {badge}
        </div>
      </div>
    </div>
  );
};
