import type { ViewState } from "@/shared/constants";

export interface FormattedPlanCard {
  readonly billingPeriodLabel: string;
  readonly features: readonly string[];
  readonly formattedPrice: string;
  readonly id: string;
  readonly isPopular?: boolean;
  readonly maxBookingsLabel: string;
  readonly name: string;
}

export interface UsePlanCatalogViewModelReturn {
  readonly emptyMessage: string;
  readonly handleSelectPlan: (planId: string) => void;
  readonly plans: readonly FormattedPlanCard[];
  readonly retry: () => void;
  readonly viewState: ViewState;
}
