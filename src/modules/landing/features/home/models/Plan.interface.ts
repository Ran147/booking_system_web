import type { PlanStatus } from "@/shared/domain";

export type BillingPeriod = "annual" | "monthly";

export interface PlanLimits {
  readonly maxBookings: number;
}

export interface Plan {
  readonly billingPeriod: BillingPeriod;
  readonly features: readonly string[];
  readonly id: string;
  readonly limits: PlanLimits;
  readonly name: string;
  readonly priceInCents: number;
  readonly status: PlanStatus;
}
