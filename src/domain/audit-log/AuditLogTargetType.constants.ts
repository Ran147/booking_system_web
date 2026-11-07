export const AUDIT_LOG_TARGET_TYPE = Object.freeze({
  BUSINESS: "business",
  PLAN: "plan",
  PLATFORM_SETTINGS: "platform_settings",
});

export type AuditLogTargetType =
  (typeof AUDIT_LOG_TARGET_TYPE)[keyof typeof AUDIT_LOG_TARGET_TYPE];
