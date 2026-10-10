/** The fields of plans/{planId} that the sign-up shows (KAN-180 spec). */
export interface PlanDocument {
  readonly billingPeriod: string;
  readonly name: string;
}
