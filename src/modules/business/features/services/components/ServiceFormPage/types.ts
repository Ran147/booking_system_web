/**
 * @file Type definitions and props for ServiceFormPage component.
 */

import type { BusinessStatus } from "@/domain";
import type { ServiceDetail } from "@/modules/business/features/services";

/**
 * @typedef {Object} ServiceFormPageProps
 * @property {BusinessStatus} [businessStatus] - Optional explicit business status override.
 * @property {ServiceDetail} [initialService] - Optional initial service detail for editing.
 * @property {() => void} [onCancel] - Optional cancel callback when leaving form.
 * @property {(serviceId: string) => void} [onSuccess] - Optional callback after successfully saving service.
 * @property {string} [serviceId] - Optional service identifier for edit mode.
 */
export interface ServiceFormPageProps {
  readonly businessStatus?: BusinessStatus;
  readonly initialService?: ServiceDetail;
  readonly onCancel?: () => void;
  readonly onSuccess?: (serviceId: string) => void;
  readonly serviceId?: string;
}
