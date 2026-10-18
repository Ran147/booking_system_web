import type { ReactNode } from "react";
import type { BusinessSidebarItem } from "@/modules/business/layout/models";
import type { Nullable } from "@/types";

export interface BusinessSidebarProps {
  readonly activePath?: string;
  readonly banner?: ReactNode;
  readonly businessName: string;
  readonly className?: string;
  readonly collaboratorName?: Nullable<string>;
  readonly isCollaborator: boolean;
  readonly isSubscriber: boolean;
  readonly logoUrl?: Nullable<string>;
  readonly navItems: BusinessSidebarItem[];
  readonly onActionClick: (item: BusinessSidebarItem) => void;
  readonly onSignOut?: () => void;
}
