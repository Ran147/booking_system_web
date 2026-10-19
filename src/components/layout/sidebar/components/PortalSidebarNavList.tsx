import type { ReactElement } from "react";
import type { PortalSidebarItem } from "../models";
import { PortalSidebarNavItem } from "./PortalSidebarNavItem";

export interface PortalSidebarNavListProps {
  readonly activePath?: string;
  readonly ariaLabel: string;
  readonly items: readonly PortalSidebarItem[];
  readonly onItemClick: (item: PortalSidebarItem) => void;
}

export const PortalSidebarNavList = ({
  activePath,
  ariaLabel,
  items,
  onItemClick,
}: PortalSidebarNavListProps): ReactElement => {
  return (
    <nav
      aria-label={ariaLabel}
      className="flex flex-1 flex-col gap-1.5 overflow-y-auto py-2"
    >
      {items.map((item) => (
        <PortalSidebarNavItem
          isActive={Boolean(item.href && activePath === item.href)}
          item={item}
          key={item.id}
          onClick={onItemClick}
        />
      ))}
    </nav>
  );
};
