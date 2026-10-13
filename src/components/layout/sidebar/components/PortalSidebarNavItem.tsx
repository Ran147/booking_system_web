import type { ReactElement } from "react";
import {
  Badge,
  BADGE_VARIANT,
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
} from "@/components/common";
import type { PortalSidebarItem } from "../models";

export interface PortalSidebarNavItemProps {
  readonly isActive?: boolean;
  readonly item: PortalSidebarItem;
  readonly onClick: (item: PortalSidebarItem) => void;
}

export const PortalSidebarNavItem = ({
  isActive = false,
  item,
  onClick,
}: PortalSidebarNavItemProps): ReactElement => {
  const IconComponent = item.icon;

  const handleClick = (): void => {
    onClick(item);
  };

  return (
    <Button
      className={`group flex w-full items-center justify-between rounded-xl p-3 text-left transition-colors ${
        isActive
          ? "bg-primary/10 text-primary hover:bg-primary/15"
          : "text-foreground hover:bg-muted"
      }`}
      onClick={handleClick}
      size={BUTTON_SIZE.MD}
      type="button"
      variant={BUTTON_VARIANT.GHOST}
    >
      <div className="flex items-center gap-2.5">
        <IconComponent
          className={`size-4 shrink-0 transition-colors ${
            isActive
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground"
          }`}
        />
        <span className="text-sm font-medium tracking-tight">{item.label}</span>
      </div>
      {item.badgeLabel && (
        <Badge
          className="text-[10px] px-1.5 py-0.5"
          variant={item.badgeVariant ?? BADGE_VARIANT.DEFAULT}
        >
          {item.badgeLabel}
        </Badge>
      )}
    </Button>
  );
};
