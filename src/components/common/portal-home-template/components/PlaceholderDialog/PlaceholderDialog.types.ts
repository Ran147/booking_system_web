import type { PortalQuickAccessItem } from "@/components/common";
import type { Nullable } from "@/types";

export interface PlaceholderDialogProps {
  readonly item: Nullable<PortalQuickAccessItem>;
  readonly onClose: () => void;
}
