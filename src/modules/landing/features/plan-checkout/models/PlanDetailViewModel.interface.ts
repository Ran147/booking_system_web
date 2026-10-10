import type { ErrorMessageKey } from "@/shared/constants";
import type { Nullable } from "@/shared/types";
import type { PlanDetailState } from "../constants/PlanDetail.constants";

/**
 * One limit of the plan with its translated label (AC-KAN-21-01).
 */
export interface FormattedPlanLimit {
  readonly label: string;
  readonly limitName: string;
}

/**
 * The plan shown on the page, ready to render.
 */
export interface FormattedPlanDetail {
  readonly billingPeriodLabel: string;
  readonly features: readonly string[];
  readonly formattedPrice: string;
  readonly id: string;
  readonly limits: readonly FormattedPlanLimit[];
  readonly name: string;
}

/**
 * A link to another active plan (AC-KAN-21-03).
 */
export interface PlanSwitcherOption {
  readonly isCurrent: boolean;
  readonly name: string;
  readonly path: string;
}

/**
 * Why the contract action did not open the checkout (AC-KAN-21-10).
 */
export interface ContractError {
  readonly message: string;
  /** The plan is no longer active: offer the plan catalog. */
  readonly showCatalogLink: boolean;
}

/**
 * Resultado del ViewModel de la pagina de detalle del plan.
 */
export interface PlanDetailPageViewModel {
  readonly contractError: Nullable<ContractError>;
  /** Message of a read that failed for a network or server reason. */
  readonly failedMessageKey: ErrorMessageKey;
  readonly handleContract: () => void;
  readonly handleSignOut: () => void;
  /** The plan is being read again before the checkout opens. */
  readonly isCheckingPlan: boolean;
  readonly isSigningOut: boolean;
  readonly plan: Nullable<FormattedPlanDetail>;
  readonly planDetailState: PlanDetailState;
  readonly planSwitcherOptions: readonly PlanSwitcherOption[];
  readonly retry: () => void;
  /** A signed-in user tried to contract (AC-KAN-21-11, AS-8). */
  readonly showSignedInNotice: boolean;
}
