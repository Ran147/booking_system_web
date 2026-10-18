// Error codes thrown by the Admin SDK's Auth API that functions handle.
export const FIREBASE_AUTH_ERROR_CODE = Object.freeze({
  EMAIL_ALREADY_EXISTS: "auth/email-already-exists",
  USER_NOT_FOUND: "auth/user-not-found",
} as const);
