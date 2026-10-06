export const FIREBASE_ERROR_CODE = {
  FAILED_PRECONDITION: "functions/failed-precondition",
  INVALID_CREDENTIAL: "auth/invalid-credential",
  NETWORK_REQUEST_FAILED: "auth/network-request-failed",
  NOT_FOUND: "functions/not-found",
  PERMISSION_DENIED: "permission-denied",
  TOO_MANY_REQUESTS: "auth/too-many-requests",
  UNAVAILABLE: "unavailable",
  UNKNOWN: "unknown",
  USER_MISMATCH: "auth/user-mismatch",
  WRONG_PASSWORD: "auth/wrong-password",
} as const;
