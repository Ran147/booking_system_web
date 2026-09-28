import type { TransitionMap } from "../stateMachine";

// pending: paid and signed up, awaiting the super admin's approval (Q2 + Q3,
// 2026-09-28). The super admin approves (pending → active, PROP-1, KAN-176) or
// rejects with a reason (pending → rejected, terminal, PROP-1). inactive
// follows the subscription automatically (KAN-49); suspended is a manual super
// admin action (PROP-2) undone by KAN-179.
export const BUSINESS_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  REJECTED: "rejected",
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
  [BUSINESS_STATUS.PENDING]: [BUSINESS_STATUS.ACTIVE, BUSINESS_STATUS.REJECTED],
  [BUSINESS_STATUS.REJECTED]: [],
  [BUSINESS_STATUS.SUSPENDED]: [BUSINESS_STATUS.ACTIVE],
};
