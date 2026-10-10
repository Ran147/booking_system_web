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
 * Resultado del ViewModel de la pagina de detalle del plan.
 */
export interface PlanDetailPageViewModel {
  /** Message of a read that failed for a network or server reason. */
  readonly failedMessageKey: ErrorMessageKey;
  readonly handleContract: () => void;
  readonly handleSignOut: () => void;
  readonly isSigningOut: boolean;
  readonly plan: Nullable<FormattedPlanDetail>;
  readonly planDetailState: PlanDetailState;
  readonly planSwitcherOptions: readonly PlanSwitcherOption[];
  readonly retry: () => void;
  /** A signed-in user tried to contract (AC-KAN-21-11, AS-8). */
  readonly showSignedInNotice: boolean;
}
