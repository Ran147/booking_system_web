import type { TransitionMap } from "../stateMachine";

// Delete is allowed only when inactive and without pending or confirmed
// bookings (KAN-59); that check runs in the deleteService function.
export const SERVICE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type ServiceStatus =
  (typeof SERVICE_STATUS)[keyof typeof SERVICE_STATUS];

export const SERVICE_STATUS_TRANSITIONS: TransitionMap<ServiceStatus> = {
  [SERVICE_STATUS.ACTIVE]: [SERVICE_STATUS.INACTIVE],
  [SERVICE_STATUS.INACTIVE]: [SERVICE_STATUS.ACTIVE],
};
