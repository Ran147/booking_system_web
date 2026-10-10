/**
 * @file Interface contracts for the reusable PortalHomeTemplate component.
 */

import type { ComponentType, ReactNode } from "react";
import type { BadgeVariant } from "@/components/common/badge/models/badge.model";

/**
 * @typedef {Object} PortalQuickAccessItem
 * @property {string} actionLabel - Call to action button label.
 * @property {string} [badgeLabel] - Optional chip or badge label.
 * @property {BadgeVariant} [badgeVariant] - Visual variant for the badge chip.
 * @property {string} description - Brief summary of what the tool accomplishes.
 * @property {string} [href] - Optional navigation target route.
 * @property {ComponentType<{ className?: string }>} icon - Lucide icon component.
 * @property {string} id - Unique identifier for the quick access item.
 * @property {boolean} isAvailable - Whether the tool is implemented or currently a placeholder.
 * @property {() => void} [onClick] - Optional click handler for navigation or custom action.
 * @property {string} title - Human-readable title of the tool or setting.
 */
export interface PortalQuickAccessItem {
  readonly actionLabel: string;
  readonly badgeLabel?: string;
  readonly badgeVariant?: BadgeVariant;
  readonly description: string;
  readonly href?: string;
  readonly icon: ComponentType<{ className?: string }>;
  readonly id: string;
  readonly isAvailable: boolean;
  readonly onClick?: () => void;
  readonly title: string;
}

/**
 * @typedef {Object} PortalHomeMetricItem
 * @property {string} [helperText] - Supplementary hint or subtext.
 * @property {ComponentType<{ className?: string }>} [icon] - Decorative metric icon.
 * @property {string} id - Unique identifier of the metric card.
 * @property {string} label - Title or description of the metric.
 * @property {string | number} value - Primary displayed value.
 */
export interface PortalHomeMetricItem {
  readonly helperText?: string;
  readonly icon?: ComponentType<{ className?: string }>;
  readonly id: string;
  readonly label: string;
  readonly value: string | number;
}

/**
 * @typedef {Object} PortalHomeTemplateProps
 * @property {ReactNode} [actions] - Action buttons for the header.
 * @property {ReactNode} [badge] - Role, tenant status or tier badge.
 * @property {readonly PortalQuickAccessItem[]} [configurationItems] - List of configuration cards.
 * @property {string} [configurationsSectionDescription] - Subtitle for configurations.
 * @property {string} [configurationsSectionTitle] - Optional title for settings/configurations.
 * @property {string} [description] - Subheading or subtitle describing the dashboard.
 * @property {string} [greeting] - Welcome message for the authenticated user.
 * @property {readonly PortalHomeMetricItem[]} [metrics] - High-level summary metrics.
 * @property {(item: PortalQuickAccessItem) => void} [onSelectPlaceholder] - Callback invoked when a placeholder card is clicked.
 * @property {readonly PortalQuickAccessItem[]} quickAccessItems - List of interactive tool cards.
 * @property {string} [quickAccessSectionDescription] - Subtitle for the tools section.
 * @property {string} quickAccessSectionTitle - Title of the primary tools section.
 * @property {ReactNode} [readOnlyAlert] - Prominent read-only or status warning alert.
 * @property {string} title - Primary heading for the portal home.
 */
export interface PortalHomeTemplateProps {
  readonly actions?: ReactNode;
  readonly badge?: ReactNode;
  readonly configurationItems?: readonly PortalQuickAccessItem[];
  readonly configurationsSectionDescription?: string;
  readonly configurationsSectionTitle?: string;
  readonly description?: string;
  readonly greeting?: string;
  readonly metrics?: readonly PortalHomeMetricItem[];
  readonly onSelectPlaceholder?: (item: PortalQuickAccessItem) => void;
  readonly quickAccessItems: readonly PortalQuickAccessItem[];
  readonly quickAccessSectionDescription?: string;
  readonly quickAccessSectionTitle: string;
  readonly readOnlyAlert?: ReactNode;
  readonly title: string;
}
