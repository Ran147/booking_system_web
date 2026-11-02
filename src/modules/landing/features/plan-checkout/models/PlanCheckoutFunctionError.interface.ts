import type { MutationError, Nullable } from "@/types";
import type { PlanCheckoutErrorReason } from "../constants/PlanCheckout.constants";

/**
 * A payPlanCheckout error: the common MutationError plus what the server sent
 * in details.
 * @property currentPriceInCents - The new plan price, only with priceChanged
 *   (AC-KAN-22-08).
 * @property reason - One of PLAN_CHECKOUT_ERROR_REASON, or null.
 */
export interface PlanCheckoutFunctionError extends MutationError {
  readonly currentPriceInCents: Nullable<number>;
  readonly reason: Nullable<PlanCheckoutErrorReason>;
}
