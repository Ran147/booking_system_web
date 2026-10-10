/**
 * @file Interface contract for the Business Home ViewModel (KAN2-11).
 */

import type {
  PortalHomeMetricItem,
  PortalQuickAccessItem,
} from "@/components/common";
import type { BusinessStatus, UserRole } from "@/domain";

/**
 * @typedef {Object} BusinessHomeViewModel
 * @property {string} businessId - Identified business tenant id.
 * @property {BusinessStatus} businessStatus - Current operational status of the business.
 * @property {readonly PortalQuickAccessItem[]} configurationItems - List of business configuration cards.
 * @property {boolean} isCollaborator - Whether the active user is a collaborator.
 * @property {boolean} isLoading - Loading state while querying tenant status or resources.
 * @property {boolean} isReadOnly - Whether the tenant is in read-only mode (inactive/suspended).
 * @property {boolean} isSubscriber - Whether the active user is the business subscriber.
 * @property {readonly PortalHomeMetricItem[]} metrics - Summary KPI cards for the business home.
 * @property {readonly PortalQuickAccessItem[]} quickAccessItems - List of tool shortcut cards.
 * @property {ReactNode} readOnlyAlert - Read-only alert element when the tenant is restricted.
 * @property {UserRole} role - Current active role.
 * @property {() => void} handleNavigateToServiceCreate - Handler to open the create service form.
 */
export interface BusinessHomeViewModel {
  readonly businessId: string;
  readonly businessStatus: BusinessStatus;
  readonly configurationItems: readonly PortalQuickAccessItem[];
  readonly handleNavigateToServiceCreate: () => void;
  readonly isCollaborator: boolean;
  readonly isLoading: boolean;
  readonly isReadOnly: boolean;
  readonly isSubscriber: boolean;
  readonly metrics: readonly PortalHomeMetricItem[];
  readonly quickAccessItems: readonly PortalQuickAccessItem[];
  readonly role: UserRole;
}
