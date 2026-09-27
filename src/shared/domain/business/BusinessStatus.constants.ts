import type { TransitionMap } from "../stateMachine";

// inactive follows the subscription automatically; suspended is a manual
// super admin action. A pending status is BLOCKED on Q2.
export const BUSINESS_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  SUSPENDED: "suspended",
} as const;

export type BusinessStatus =
  (typeof BUSINESS_STATUS)[keyof typeof BUSINESS_STATUS];

export const BUSINESS_STATUS_TRANSITIONS: TransitionMap<BusinessStatus> = {
  [BUSINESS_STATUS.ACTIVE]: [
    BUSINESS_STATUS.INACTIVE,
    BUSINESS_STATUS.SUSPENDED,
  ],
  [BUSINESS_STATUS.INACTIVE]: [
    BUSINESS_STATUS.ACTIVE,
    BUSINESS_STATUS.SUSPENDED,
  ],
  [BUSINESS_STATUS.SUSPENDED]: [BUSINESS_STATUS.ACTIVE],
};
