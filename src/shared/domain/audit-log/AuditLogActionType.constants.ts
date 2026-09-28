// Super admin actions recorded in the audit log (KAN-194, Q3 decided
// 2026-09-28). Each one is written by the Cloud Function that performs the
// action, in the same transaction (api-mutation-standards §6).
export const AUDIT_LOG_ACTION_TYPE = {
  BUSINESS_APPROVED: "business_approved",
  BUSINESS_REACTIVATED: "business_reactivated",
  BUSINESS_REJECTED: "business_rejected",
  BUSINESS_SUSPENDED: "business_suspended",
  PLAN_ACTIVATED: "plan_activated",
  PLAN_CREATED: "plan_created",
  PLAN_DEACTIVATED: "plan_deactivated",
  PLAN_PRICE_CHANGED: "plan_price_changed",
  PLAN_UPDATED: "plan_updated",
  PLATFORM_SETTINGS_UPDATED: "platform_settings_updated",
} as const;

export type AuditLogActionType =
  (typeof AUDIT_LOG_ACTION_TYPE)[keyof typeof AUDIT_LOG_ACTION_TYPE];
