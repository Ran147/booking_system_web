// Plan.billingPeriod values (KAN-180 spec).
export const PLAN_BILLING_PERIOD = {
  ANNUAL: "annual",
  MONTHLY: "monthly",
} as const;

export type PlanBillingPeriod =
  (typeof PLAN_BILLING_PERIOD)[keyof typeof PLAN_BILLING_PERIOD];

// Same currency as the plan catalog (PLAN_CATALOG_CONSTANTS.CURRENCY), so the
// detail shows the price the visitor saw in the catalog (AS-3).
export const PLAN_DETAIL_CURRENCY = "USD";

// Plan.limits keys (KAN-181). Each one has its label under
// landing:planCheckout.detail.limits.<limitName>.
export const PLAN_LIMIT_NAME = {
  MAX_BOOKINGS: "maxBookings",
  MAX_COLLABORATORS: "maxCollaborators",
} as const;

export type PlanLimitName =
  (typeof PLAN_LIMIT_NAME)[keyof typeof PLAN_LIMIT_NAME];

// What the plan detail page shows (AC-KAN-21-01, AC-KAN-21-04 … 06).
export const PLAN_DETAIL_STATE = {
  FAILED: "failed",
  LOADING: "loading",
  NOT_FOUND: "notFound",
  READY: "ready",
} as const;

export type PlanDetailState =
  (typeof PLAN_DETAIL_STATE)[keyof typeof PLAN_DETAIL_STATE];
