import type { TransitionMap } from "../stateMachine";

// Cancelling (KAN-47) sets cancelAtPeriodEnd; the status changes to
// cancelled only when the period ends. Retry count and interval for past_due
// are BLOCKED on Q5.
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
