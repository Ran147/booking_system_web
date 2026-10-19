import type { PortalQuickAccessItem } from "@/components/common";

export interface QuickAccessCardProps {
  readonly item: PortalQuickAccessItem;
  readonly onActionClick: (item: PortalQuickAccessItem) => void;
}
