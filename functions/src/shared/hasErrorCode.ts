// Admin SDK errors carry a string `code` (for example
// "auth/email-already-exists"); this reads it without trusting the shape.
export const hasErrorCode = (error: unknown, errorCode: string): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  error.code === errorCode;
