import type { TransitionMap } from "../stateMachine";

// Inactive plans are hidden from the catalog but keep their subscribers
// (KAN-184).
export const PLAN_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type PlanStatus = (typeof PLAN_STATUS)[keyof typeof PLAN_STATUS];

export const PLAN_STATUS_TRANSITIONS: TransitionMap<PlanStatus> = {
  [PLAN_STATUS.ACTIVE]: [PLAN_STATUS.INACTIVE],
  [PLAN_STATUS.INACTIVE]: [PLAN_STATUS.ACTIVE],
};
