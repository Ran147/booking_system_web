export const COLLABORATOR_EMAIL_KIND = Object.freeze({
  INVITATION: "invitation",
  PASSWORD_RESET: "password_reset",
} as const);

export const COLLABORATOR_ERROR_REASON = Object.freeze({
  BUSINESS_NOT_ACTIVE: "business_not_active",
  CANNOT_ACCEPT_INVITATION: "cannot_accept_invitation",
  CONCURRENT_MODIFICATION: "concurrent_modification",
  COOLDOWN_ACTIVE: "cooldown_active",
  EMAIL_ALREADY_IN_USE: "email_already_in_use",
  EMAIL_DISPATCH_FAILED: "email_dispatch_failed",
  INVALID_EMAIL_CHANGE_STATUS: "invalid_email_change_status",
  INVALID_STATUS_FOR_RESEND: "invalid_status_for_resend",
  INVALID_STATUS_TRANSITION: "invalid_status_transition",
  INVITATION_INVALID: "invitation_invalid",
  LIMIT_REACHED: "limit_reached",
  NOT_FOUND: "not_found",
} as const);

export const COLLABORATOR_HANDLER_ERROR = Object.freeze({
  BUSINESS_NOT_ACTIVE: "Business is not active",
  CANNOT_ACCEPT_INVITATION: "Cannot accept collaborator invitation",
  CONCURRENT_MODIFICATION: "Collaborator was modified concurrently",
  COOLDOWN_ACTIVE: "Cooldown active before resending email",
  EMAIL_ALREADY_IN_USE: "Email is already in use",
  EMAIL_DISPATCH_FAILED: "Failed to dispatch email",
  INVALID_EMAIL_CHANGE_STATUS: "Only invited collaborators can change email",
  INVALID_PAYLOAD: "Invalid collaborator payload",
  INVALID_SERVICE: "One or more services are invalid or inactive",
  INVALID_STATUS_FOR_RESEND: "Cannot resend email for this collaborator status",
  INVALID_STATUS_TRANSITION: "Invalid collaborator status transition",
  INVITATION_INVALID: "Invitation link is invalid or expired",
  LIMIT_REACHED: "Collaborator plan limit reached",
  NOT_FOUND: "Collaborator not found",
} as const);

export const COLLABORATOR_RULE_LIMIT = Object.freeze({
  CURRENT_SUBSCRIPTION_ID: "current",
  INVITATION_EXPIRY_MS: 604_800_000,
  INVITATION_TOKEN_BYTES: 32,
  MILLISECONDS_PER_SECOND: 1_000,
  RESEND_COOLDOWN_MS: 60_000,
  SPECIALTY_MAX_LENGTH: 80,
} as const);
