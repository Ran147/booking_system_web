import type { BusinessSidebarItem } from "@/modules/business/layout/models";

export interface BusinessSidebarProps {
  readonly activePath?: string;
  readonly businessName: string;
  readonly className?: string;
  readonly isCollaborator: boolean;
  readonly isSubscriber: boolean;
  readonly navItems: BusinessSidebarItem[];
  readonly onActionClick: (item: BusinessSidebarItem) => void;
  readonly onSignOut?: () => void;
}
