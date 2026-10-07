/**
 * @file Type definitions and props for ServiceForm component.
 */

import type { ServiceFormViewModel } from "@/modules/business/features/services";

/**
 * @typedef {Object} ServiceFormProps
 * @property {() => void} [onCancel] - Optional cancel callback.
 * @property {ServiceFormViewModel} viewModel - Hook state and handlers for the service form.
 */
export interface ServiceFormProps {
  readonly onCancel?: () => void;
  readonly viewModel: ServiceFormViewModel;
}
