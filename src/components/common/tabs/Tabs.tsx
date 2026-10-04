import type { ReactElement } from "react";
import { cn } from "@/utils/cn";
import type { TabsProps } from "./models/tabs.model";

export const Tabs = ({
  activeTabId,
  ariaLabel = "Navegación de pestañas",
  className,
  onTabChange,
  tabs,
}: TabsProps): ReactElement => {
  return (
    <div
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 p-1 bg-muted/80 border border-border rounded-full",
        className,
      )}
      role="tablist"
    >
      {tabs.map((tabItem) => {
        const isSelected = tabItem.id === activeTabId;

        return (
          <button
            aria-selected={isSelected}
            className={cn(
              "relative px-4 py-1.5 text-xs font-medium transition-all duration-200 rounded-full cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isSelected
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60",
            )}
            key={tabItem.id}
            onClick={(): void => onTabChange(tabItem.id)}
            role="tab"
            type="button"
          >
            {tabItem.label}
          </button>
        );
      })}
    </div>
  );
};
