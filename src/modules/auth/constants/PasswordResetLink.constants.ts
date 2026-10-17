// The action URL Firebase puts in the reset email: ?mode=resetPassword&oobCode=…
// (US-36, D-3).
export const PASSWORD_RESET_MODE = Object.freeze({
  RESET_PASSWORD: "resetPassword",
} as const);

export const PASSWORD_RESET_LINK_STATE = Object.freeze({
  CHECKING: "checking",
  INVALID: "invalid",
  NETWORK_ERROR: "network_error",
  VALID: "valid",
} as const);

export type PasswordResetLinkState =
  (typeof PASSWORD_RESET_LINK_STATE)[keyof typeof PASSWORD_RESET_LINK_STATE];
