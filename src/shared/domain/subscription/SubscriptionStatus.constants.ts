import type { TransitionMap } from "../stateMachine";

// Cancelling (KAN-47) sets cancelAtPeriodEnd; the status changes to
// cancelled only when the period ends. A failed renewal charge moves an active
// subscription to past_due; automatic retries are out of MVP (Q5), so it
// leaves past_due by a manual payment or by expiring after the grace days.
export const SUBSCRIPTION_STATUS = {
  ACTIVE: "active",
  CANCELLED: "cancelled",
  EXPIRED: "expired",
  PAST_DUE: "past_due",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const SUBSCRIPTION_STATUS_TRANSITIONS: TransitionMap<SubscriptionStatus> =
  {
    [SUBSCRIPTION_STATUS.ACTIVE]: [
      SUBSCRIPTION_STATUS.CANCELLED,
      SUBSCRIPTION_STATUS.PAST_DUE,
    ],
    [SUBSCRIPTION_STATUS.CANCELLED]: [SUBSCRIPTION_STATUS.ACTIVE],
    [SUBSCRIPTION_STATUS.EXPIRED]: [SUBSCRIPTION_STATUS.ACTIVE],
    [SUBSCRIPTION_STATUS.PAST_DUE]: [
      SUBSCRIPTION_STATUS.ACTIVE,
      SUBSCRIPTION_STATUS.EXPIRED,
    ],
  };
