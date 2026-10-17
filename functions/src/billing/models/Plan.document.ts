/** The fields of plans/{planId} that the checkout and the sign-up read (KAN-180 spec). */
export interface PlanDocument {
  readonly billingPeriod: string;
  readonly name: string;
  readonly priceInCents: number;
  readonly status: string;
}
