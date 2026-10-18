import type { ReactElement } from "react";
import type { PortalSidebarProps } from "./PortalSidebar.types";
import {
  PortalSidebarFooter,
  PortalSidebarHeader,
  PortalSidebarNavList,
} from "./components";

export const PortalSidebar = ({
  activePath,
  ariaLabel,
  badge,
  brandInitials,
  brandName,
  className = "",
  navItems,
  onItemClick,
  onSignOut,
  signOutLabel,
}: PortalSidebarProps): ReactElement => {
  return (
    <aside
      aria-label={ariaLabel}
      className={`flex h-full w-64 shrink-0 flex-col justify-between border-r border-border bg-card p-4 text-card-foreground shadow-xs ${className}`}
    >
      <div className="flex flex-1 flex-col overflow-hidden">
        <PortalSidebarHeader
          badge={badge}
          brandInitials={brandInitials}
          brandName={brandName}
        />
        <PortalSidebarNavList
          activePath={activePath}
          ariaLabel={ariaLabel}
          items={navItems}
          onItemClick={onItemClick}
        />
      </div>
      {onSignOut && (
        <PortalSidebarFooter
          onSignOut={onSignOut}
          signOutLabel={signOutLabel}
        />
      )}
    </aside>
  );
};
