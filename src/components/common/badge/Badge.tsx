import type { ReactElement } from "react";
import { cn } from "@/utils/cn";
import { BADGE_VARIANT } from "./constants/badge.constants";
import type { BadgeProps } from "./models/badge.model";

const badgeVariantStyles: Record<string, string> = {
  [BADGE_VARIANT.DEFAULT]:
    "bg-primary text-primary-foreground border-transparent",
  [BADGE_VARIANT.DESTRUCTIVE]:
    "bg-destructive/15 text-destructive border-destructive/30",
  [BADGE_VARIANT.LUXURY]:
    "bg-primary/15 text-primary border-primary/30 shadow-xs",
  [BADGE_VARIANT.MUTED]: "bg-muted text-muted-foreground border-border",
  [BADGE_VARIANT.OUTLINE]: "bg-transparent text-foreground border-border",
  [BADGE_VARIANT.PRIMARY]:
    "bg-primary text-primary-foreground border-transparent",
  [BADGE_VARIANT.SECONDARY]: "bg-muted text-foreground border-border",
  [BADGE_VARIANT.SUCCESS]: "bg-success/15 text-success border-success/30",
  [BADGE_VARIANT.WARNING]: "bg-warning/15 text-warning border-warning/30",
};

export const Badge = ({
  children,
  className,
  leftIcon: LeftIcon,
  variant = BADGE_VARIANT.DEFAULT,
  ...restProperties
}: BadgeProps): ReactElement => {
  const selectedStyle =
    badgeVariantStyles[variant] ?? badgeVariantStyles[BADGE_VARIANT.DEFAULT];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors select-none",
        selectedStyle,
        className,
      )}
      {...restProperties}
    >
      {LeftIcon && <LeftIcon className="size-3.5 shrink-0" />}
      <span>{children}</span>
    </span>
  );
};
