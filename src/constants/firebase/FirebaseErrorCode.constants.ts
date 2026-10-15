export const FIREBASE_ERROR_CODE = {
  FAILED_PRECONDITION: "functions/failed-precondition",
  // The Functions SDK reports a request that never reached the server (no
  // network) as internal: it cannot tell it apart from a backend crash.
  FUNCTIONS_INTERNAL: "functions/internal",
  FUNCTIONS_INVALID_ARGUMENT: "functions/invalid-argument",
  FUNCTIONS_PERMISSION_DENIED: "functions/permission-denied",
  FUNCTIONS_UNAVAILABLE: "functions/unavailable",
  INVALID_CREDENTIAL: "auth/invalid-credential",
  INVALID_EMAIL: "auth/invalid-email",
  INVALID_USER_TOKEN: "auth/invalid-user-token",
  NETWORK_REQUEST_FAILED: "auth/network-request-failed",
  NOT_FOUND: "functions/not-found",
  PERMISSION_DENIED: "permission-denied",
  REQUIRES_RECENT_LOGIN: "auth/requires-recent-login",
  TOO_MANY_REQUESTS: "auth/too-many-requests",
  UNAVAILABLE: "unavailable",
  UNKNOWN: "unknown",
  USER_DISABLED: "auth/user-disabled",
  USER_MISMATCH: "auth/user-mismatch",
  USER_NOT_FOUND: "auth/user-not-found",
  USER_TOKEN_EXPIRED: "auth/user-token-expired",
  WRONG_PASSWORD: "auth/wrong-password",
} as const;
