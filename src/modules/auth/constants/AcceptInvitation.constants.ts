export const ACCEPT_INVITATION_ERROR_KEY = Object.freeze({
  EMAIL_ALREADY_IN_USE: "auth.invitation.emailAlreadyInUse",
  LINK_INVALID: "auth.invitation.linkInvalid",
  NETWORK: "errors.network",
  RECAPTCHA_REJECTED: "validation:recaptchaRequired",
  TOO_MANY_REQUESTS: "auth.invitation.tooManyRequests",
  UNKNOWN: "errors.unknown",
  WEAK_PASSWORD: "auth.invitation.weakPassword",
} as const);

export type AcceptInvitationErrorKey =
  (typeof ACCEPT_INVITATION_ERROR_KEY)[keyof typeof ACCEPT_INVITATION_ERROR_KEY];

export const ACCEPT_INVITATION_FORM_DEFAULTS = Object.freeze({
  confirmation: "",
  newPassword: "",
} as const);

export const ACCEPT_INVITATION_LINK_STATE = Object.freeze({
  CHECKING: "checking",
  INVALID: "invalid",
  NETWORK_ERROR: "network_error",
  VALID: "valid",
} as const);

export type AcceptInvitationLinkState =
  (typeof ACCEPT_INVITATION_LINK_STATE)[keyof typeof ACCEPT_INVITATION_LINK_STATE];

export const ACCEPT_INVITATION_REASON = Object.freeze({
  CANNOT_ACCEPT_INVITATION: "cannot_accept_invitation",
  INVITATION_INVALID: "invitation_invalid",
} as const);
