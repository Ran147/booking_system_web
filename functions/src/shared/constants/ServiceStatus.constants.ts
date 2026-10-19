// Mirror of src/domain/service/ServiceStatus.constants.ts — keep in sync.
export const SERVICE_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const);

export type ServiceStatus =
  (typeof SERVICE_STATUS)[keyof typeof SERVICE_STATUS];
