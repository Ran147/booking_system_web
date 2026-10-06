/**
 * @file Type definitions and props for ServiceFormPage component.
 */

import type { BusinessStatus } from "@/domain";

/**
 * @typedef {Object} ServiceFormPageProps
 * @property {BusinessStatus} [businessStatus] - Optional explicit business status override.
 * @property {() => void} [onCancel] - Optional cancel callback when leaving form.
 * @property {(serviceId: string) => void} [onSuccess] - Optional callback after successfully creating service.
 */
export interface ServiceFormPageProps {
  readonly businessStatus?: BusinessStatus;
  readonly onCancel?: () => void;
  readonly onSuccess?: (serviceId: string) => void;
}
