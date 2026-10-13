import type { ComponentType } from "react";
import type { BadgeVariant } from "@/components/common/badge/models/badge.model";
import type { BusinessStatus } from "@/domain";
import type { Nullable } from "@/types";

/**
 * @typedef {Object} BusinessSidebarItem
 * @property {string} id - Unique identifier for the navigation item.
 * @property {string} label - Display label for the navigation item.
 * @property {string} [description] - Descriptive text explaining the item's purpose.
 * @property {ComponentType<{ className?: string }>} icon - Visual icon component.
 * @property {string} [href] - Target URL path for navigation.
 * @property {string} [badgeLabel] - Text badge for status indicator (e.g., 'Disponible', 'Próximamente').
 * @property {BadgeVariant} [badgeVariant] - Visual variant for the badge chip.
 * @property {boolean} isAvailable - Whether the tool is currently functional or under construction.
 * @property {boolean} [isSubscriberOnly] - Whether this item is restricted to subscribers only.
 * @property {() => void} [onClick] - Action callback when clicked.
 */
export interface BusinessSidebarItem {
  readonly badgeLabel?: string;
  readonly badgeVariant?: BadgeVariant;
  readonly description?: string;
  readonly href?: string;
  readonly icon: ComponentType<{ className?: string }>;
  readonly id: string;
  readonly isAvailable: boolean;
  readonly isSubscriberOnly?: boolean;
  readonly label: string;
  readonly onClick?: () => void;
}

/**
 * @typedef {Object} BusinessSidebarProps
 * @property {string} businessName - Name of the business.
 * @property {BusinessStatus} businessStatus - Current operational status of the business.
 * @property {boolean} isCollaborator - Whether the user has collaborator role.
 * @property {boolean} isSubscriber - Whether the user has subscriber role.
 * @property {BusinessSidebarItem[]} navItems - List of navigation items.
 * @property {(item: BusinessSidebarItem) => void} [onSelectPlaceholder] - Callback when an incomplete tool is selected.
 * @property {() => void} [onSignOut] - Callback to handle session sign out.
 */
export interface BusinessSidebarProps {
  readonly businessName: string;
  readonly businessStatus: BusinessStatus;
  readonly isCollaborator: boolean;
  readonly isSubscriber: boolean;
  readonly navItems: BusinessSidebarItem[];
  readonly onSelectPlaceholder?: (item: BusinessSidebarItem) => void;
  readonly onSignOut?: () => void;
}

/**
 * @typedef {Object} BusinessSidebarViewModel
 * @property {Nullable<BusinessSidebarItem>} activePlaceholderItem - Selected item in placeholder modal.
 * @property {string} businessName - Name of the business.
 * @property {BusinessStatus} businessStatus - Current business status.
 * @property {() => void} closePlaceholderModal - Dismiss placeholder dialog.
 * @property {(item: BusinessSidebarItem) => void} handleActionClick - Navigation or modal trigger handler.
 * @property {() => void} handleSignOut - Sign-out handler.
 * @property {boolean} isCollaborator - Collaborator role flag.
 * @property {boolean} isDrawerOpen - Responsive drawer state.
 * @property {boolean} isSubscriber - Subscriber role flag.
 * @property {BusinessSidebarItem[]} navItems - Filtered navigation items for the user role.
 * @property {() => void} toggleDrawer - Toggle responsive mobile drawer.
 * @property {() => void} closeDrawer - Close responsive mobile drawer.
 */
export interface BusinessSidebarViewModel {
  readonly activePlaceholderItem: Nullable<BusinessSidebarItem>;
  readonly businessName: string;
  readonly businessStatus: BusinessStatus;
  readonly closeDrawer: () => void;
  readonly closePlaceholderModal: () => void;
  readonly handleActionClick: (item: BusinessSidebarItem) => void;
  readonly handleSignOut: () => void;
  readonly isCollaborator: boolean;
  readonly isDrawerOpen: boolean;
  readonly isSubscriber: boolean;
  readonly navItems: BusinessSidebarItem[];
  readonly toggleDrawer: () => void;
}
