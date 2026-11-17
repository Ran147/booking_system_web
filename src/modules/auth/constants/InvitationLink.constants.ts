export const ACCEPT_INVITATION_ERROR_REASON = Object.freeze({
  EMAIL_ALREADY_IN_USE: "email_already_in_use",
  INVALID_INVITATION: "invalid_invitation",
  RECAPTCHA_INVALID: "recaptcha_invalid",
} as const);

export const DEFAULT_ACCEPT_INVITATION_FORM_VALUES = Object.freeze({
  confirmation: "",
  newPassword: "",
} as const);

export const INVITATION_ERROR_KEY = Object.freeze({
  EMAIL_ALREADY_IN_USE: "common:auth.invitation.emailAlreadyInUse",
  LINK_INVALID: "common:auth.invitation.linkInvalid",
  NETWORK: "common:errors.network",
  TOO_MANY_REQUESTS: "common:auth.invitation.tooManyRequests",
  UNKNOWN: "common:errors.unknown",
  WEAK_PASSWORD: "common:auth.invitation.weakPassword",
} as const);

export type InvitationErrorKey =
  (typeof INVITATION_ERROR_KEY)[keyof typeof INVITATION_ERROR_KEY];

export const INVITATION_LINK_STATE = Object.freeze({
  CHECKING: "checking",
  INVALID: "invalid",
  NETWORK_ERROR: "network_error",
  VALID: "valid",
} as const);

export type InvitationLinkState =
  (typeof INVITATION_LINK_STATE)[keyof typeof INVITATION_LINK_STATE];
