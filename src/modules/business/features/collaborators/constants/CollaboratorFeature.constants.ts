import { COLLABORATOR_PERMISSION } from "@/domain";

export const COLLABORATOR_ALL_STATUS_FILTER = "" as const;

export const COLLABORATOR_BOOKING_ACTIVE_STATUSES = Object.freeze([
  "pending",
  "confirmed",
] as const);

export const COLLABORATOR_EMAIL_KIND = Object.freeze({
  INVITATION: "invitation",
  PASSWORD_RESET: "password_reset",
} as const);

export const COLLABORATOR_ERROR_REASON = Object.freeze({
  BUSINESS_NOT_ACTIVE: "business_not_active",
  CONCURRENT_MODIFICATION: "concurrent_modification",
  COOLDOWN_ACTIVE: "cooldown_active",
  EMAIL_ALREADY_IN_USE: "email_already_in_use",
  EMAIL_DISPATCH_FAILED: "email_dispatch_failed",
  INVALID_EMAIL_CHANGE_STATUS: "invalid_email_change_status",
  INVALID_STATUS_FOR_RESEND: "invalid_status_for_resend",
  INVALID_STATUS_TRANSITION: "invalid_status_transition",
  LIMIT_REACHED: "limit_reached",
  NOT_FOUND: "not_found",
} as const);

export const COLLABORATOR_FIELD = Object.freeze({
  BUSINESS_ID: "businessId",
  COLLABORATOR_ID: "collaboratorId",
  EMAIL: "email",
  FULL_NAME: "fullName",
  IS_OWNER: "is_owner",
  LAST_EMAIL_SENT_AT: "lastEmailSentAt",
  PERMISSIONS: "permissions",
  PHONE: "phone",
  SEARCH_NAME: "searchName",
  SERVICE_IDS: "serviceIds",
  SPECIALTY: "specialty",
  STARTS_AT: "startsAt",
  STATUS: "status",
  UPDATED_AT: "updatedAt",
  USER_ID: "userId",
} as const);

export const COLLABORATOR_PERMISSION_ITEMS = Object.freeze([
  COLLABORATOR_PERMISSION.MANAGE_BOOKINGS,
  COLLABORATOR_PERMISSION.MANAGE_CUSTOMERS,
  COLLABORATOR_PERMISSION.MANAGE_SCHEDULE_BLOCKS,
  COLLABORATOR_PERMISSION.MANAGE_SERVICES,
  COLLABORATOR_PERMISSION.VIEW_REPORTS,
] as const);

export const COLLABORATOR_RULE = Object.freeze({
  CURRENT_SUBSCRIPTION_ID: "current",
  MILLISECONDS_PER_SECOND: 1_000,
  RESEND_COOLDOWN_MS: 60_000,
  RESEND_COOLDOWN_SECONDS: 60,
  RESEND_TICK_MS: 1_000,
  SPECIALTY_MAX_LENGTH: 80,
} as const);

export const COLLABORATOR_STATUS_DIALOG_MODE = Object.freeze({
  DEACTIVATE: "deactivate",
  REACTIVATE: "reactivate",
} as const);

export type CollaboratorStatusDialogMode =
  (typeof COLLABORATOR_STATUS_DIALOG_MODE)[keyof typeof COLLABORATOR_STATUS_DIALOG_MODE];

export const DEFAULT_COLLABORATOR_FORM_VALUES = Object.freeze({
  email: "",
  fullName: "",
  permissions: [] as string[],
  phone: "",
  serviceIds: [] as string[],
  specialty: "",
});
