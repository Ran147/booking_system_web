export const CHANGE_PASSWORD_ERROR_CODE = Object.freeze({
  CURRENT_INVALID: "current-invalid",
  NETWORK: "network",
  REAUTHENTICATION_INVALID: "reauthentication-invalid",
  TOO_MANY_ATTEMPTS: "too-many-attempts",
  UNKNOWN: "unknown",
  WEAK_PASSWORD: "weak-password",
});

export type ChangePasswordErrorCode =
  (typeof CHANGE_PASSWORD_ERROR_CODE)[keyof typeof CHANGE_PASSWORD_ERROR_CODE];
