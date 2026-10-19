import type { ComponentType, ReactNode } from "react";
import type { BadgeVariant } from "@/components/common/badge/models/badge.model";
import type { BusinessStatus } from "@/domain";
import type { Nullable } from "@/types";
import type { CurrentSubscriptionData } from "../api/fetchCurrentSubscription";

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
 * @property {ReactNode} [banner] - Optional banner node for subscription or alerts.
 * @property {Nullable<string>} [collaboratorName] - Full name of signed-in collaborator.
 * @property {Nullable<string>} [logoUrl] - URL of the business logo image.
 * @property {(item: BusinessSidebarItem) => void} [onSelectPlaceholder] - Callback when an incomplete tool is selected.
 * @property {() => void} [onSignOut] - Callback to handle session sign out.
 */
export interface BusinessSidebarProps {
  readonly banner?: ReactNode;
  readonly businessName: string;
  readonly businessStatus: BusinessStatus;
  readonly collaboratorName?: Nullable<string>;
  readonly isCollaborator: boolean;
  readonly isSubscriber: boolean;
  readonly logoUrl?: Nullable<string>;
  readonly navItems: BusinessSidebarItem[];
  readonly onSelectPlaceholder?: (item: BusinessSidebarItem) => void;
  readonly onSignOut?: () => void;
}

/**
 * @typedef {Object} BusinessSidebarViewModel
 * @property {Nullable<BusinessSidebarItem>} activePlaceholderItem - Selected item in placeholder modal.
 * @property {boolean} businessError - Whether business profile failed to load.
 * @property {string} businessName - Name of the business.
 * @property {BusinessStatus} businessStatus - Current business status.
 * @property {() => void} closeDrawer - Close responsive mobile drawer.
 * @property {() => void} closePlaceholderModal - Dismiss placeholder dialog.
 * @property {Nullable<string>} collaboratorName - Collaborator full name.
 * @property {Nullable<number>} gracePeriodDays - Platform grace period in days.
 * @property {(item: BusinessSidebarItem) => void} handleActionClick - Navigation or modal trigger handler.
 * @property {() => void} handleCancelSignOut - Cancel sign-out from confirmation dialog.
 * @property {() => void} handleConfirmSignOut - Confirm sign-out from dialog.
 * @property {() => void} handleDismissExpiryWarning - Dismiss warning banner for the session.
 * @property {() => void} handleNavigateToSubscription - Route to subscription page.
 * @property {() => void} handleRetrySubscription - Retry loading subscription.
 * @property {() => void} handleSignOut - Sign-out handler.
 * @property {boolean} isCollaborator - Collaborator role flag.
 * @property {boolean} isDrawerOpen - Responsive drawer state.
 * @property {boolean} isExpiryWarningDismissed - Whether user dismissed expiry warning.
 * @property {boolean} isPlatformSettingsError - Whether platform settings failed to load.
 * @property {boolean} isSignOutConfirmOpen - Whether unsaved changes dialog is open.
 * @property {boolean} isSubscriber - Subscriber role flag.
 * @property {boolean} isSubscriptionError - Whether subscription failed to load.
 * @property {boolean} isSubscriptionLoading - Whether subscription is currently loading.
 * @property {Nullable<string>} logoUrl - Business logo URL.
 * @property {BusinessSidebarItem[]} navItems - Filtered navigation items for the user role.
 * @property {Nullable<string>} planName - Subscribed plan display name.
 * @property {Nullable<CurrentSubscriptionData>} subscription - Current subscription document data.
 * @property {string} timeZone - Business time zone.
 * @property {() => void} toggleDrawer - Toggle responsive mobile drawer.
 */
export type ExpiryWarningType = "active_ending_soon" | "past_due";

/**
 * @typedef {Object} ExpiryWarningBannerData
 * @property {boolean} canDismiss - Whether the banner can be dismissed by the subscriber.
 * @property {string} message - Display message formatted in business time zone.
 * @property {ExpiryWarningType} type - Tone/type of warning: active_ending_soon or past_due.
 */
export interface ExpiryWarningBannerData {
  readonly canDismiss: boolean;
  readonly message: string;
  readonly type: ExpiryWarningType;
}

export interface BusinessSidebarViewModel {
  readonly activePlaceholderItem: Nullable<BusinessSidebarItem>;
  readonly businessError: boolean;
  readonly businessName: string;
  readonly businessStatus: BusinessStatus;
  readonly closeDrawer: () => void;
  readonly closePlaceholderModal: () => void;
  readonly collaboratorName: Nullable<string>;
  readonly expiryWarning: Nullable<ExpiryWarningBannerData>;
  readonly gracePeriodDays: Nullable<number>;
  readonly handleActionClick: (item: BusinessSidebarItem) => void;
  readonly handleCancelSignOut: () => void;
  readonly handleConfirmSignOut: () => void;
  readonly handleDismissExpiryWarning: () => void;
  readonly handleNavigateToSubscription: () => void;
  readonly handleRetrySubscription: () => void;
  readonly handleSignOut: () => void;
  readonly isCollaborator: boolean;
  readonly isDrawerOpen: boolean;
  readonly isExpiryWarningDismissed: boolean;
  readonly isPlatformSettingsError: boolean;
  readonly isSignOutConfirmOpen: boolean;
  readonly isSubscriber: boolean;
  readonly isSubscriptionError: boolean;
  readonly isSubscriptionLoading: boolean;
  readonly logoUrl: Nullable<string>;
  readonly navItems: BusinessSidebarItem[];
  readonly planName: Nullable<string>;
  readonly subscription: Nullable<CurrentSubscriptionData>;
  readonly timeZone: string;
  readonly toggleDrawer: () => void;
}
