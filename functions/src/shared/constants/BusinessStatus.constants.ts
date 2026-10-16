// Mirror of BUSINESS_STATUS in src/domain/business/BusinessStatus.constants.ts
// — keep in sync.
export const BUSINESS_STATUS = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
  REJECTED: "rejected",
  SUSPENDED: "suspended",
} as const);
