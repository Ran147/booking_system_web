import type { TransitionMap } from "../stateMachine";

// Both directions require a note (KAN-93, KAN-94). Applies to the
// business-scoped Customer record only, never to User.
export const CUSTOMER_STATUS = {
  ACTIVE: "active",
  BLOCKED: "blocked",
} as const;

export type CustomerStatus =
  (typeof CUSTOMER_STATUS)[keyof typeof CUSTOMER_STATUS];

export const CUSTOMER_STATUS_TRANSITIONS: TransitionMap<CustomerStatus> = {
  [CUSTOMER_STATUS.ACTIVE]: [CUSTOMER_STATUS.BLOCKED],
  [CUSTOMER_STATUS.BLOCKED]: [CUSTOMER_STATUS.ACTIVE],
};
