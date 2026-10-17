import type { ComponentType, ReactNode } from "react";
import type { BadgeVariant } from "@/components/common/badge/models/badge.model";

/**
 * @typedef {Object} PortalSidebarItem
 * @property {string} id - Unique identifier for the navigation item.
 * @property {string} label - Display label for the navigation item.
 * @property {string} [description] - Descriptive text explaining the item's purpose.
 * @property {ComponentType<{ className?: string }>} icon - Visual icon component.
 * @property {string} [href] - Target URL path for navigation.
 * @property {string} [badgeLabel] - Text badge for status indicator.
 * @property {BadgeVariant} [badgeVariant] - Visual variant for the badge chip.
 * @property {boolean} isAvailable - Whether the tool is currently functional or under construction.
 * @property {() => void} [onClick] - Action callback when clicked.
 */
export interface PortalSidebarItem {
  readonly badgeLabel?: string;
  readonly badgeVariant?: BadgeVariant;
  readonly description?: string;
  readonly href?: string;
  readonly icon: ComponentType<{ className?: string }>;
  readonly id: string;
  readonly isAvailable: boolean;
  readonly label: string;
  readonly onClick?: () => void;
}

/**
 * @typedef {Object} PortalSidebarProps
 * @property {string} brandName - Name of the brand or current portal workspace.
 * @property {string} [brandInitials] - Custom initials for brand avatar (derived from brandName if omitted).
 * @property {ReactNode} [badge] - Role badge or status badge displayed next to brand name.
 * @property {readonly PortalSidebarItem[]} navItems - List of navigation items.
 * @property {string} [activePath] - Currently active URL route for visual selection highlight.
 * @property {(item: PortalSidebarItem) => void} onItemClick - Callback when any navigation item is clicked.
 * @property {() => void} [onSignOut] - Callback to handle session sign out.
 * @property {string} [signOutLabel] - Accessible label for the sign-out button.
 * @property {string} ariaLabel - Accessible landmark label for the nav element.
 * @property {string} [className] - Additional CSS class names.
 */
export interface PortalSidebarProps {
  readonly activePath?: string;
  readonly ariaLabel: string;
  readonly badge?: ReactNode;
  readonly brandInitials?: string;
  readonly brandName: string;
  readonly className?: string;
  readonly navItems: readonly PortalSidebarItem[];
  readonly onItemClick: (item: PortalSidebarItem) => void;
  readonly onSignOut?: () => void;
  readonly signOutLabel?: string;
}
