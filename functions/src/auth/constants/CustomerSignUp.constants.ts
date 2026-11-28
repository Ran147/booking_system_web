// completeCustomerSignUp (KAN-123, KAN-126). The account is created on the
// server and Firebase Auth emails its own verification template (spec D1, D2).
export const CUSTOMER_SIGN_UP = Object.freeze({
  DEFAULT_THEME: "system",
  IDENTITY_TOOLKIT: Object.freeze({
    EMULATOR_BASE_PATH: "identitytoolkit.googleapis.com/v1",
    PRODUCTION_BASE_URL: "https://identitytoolkit.googleapis.com/v1",
    SEND_OOB_CODE: "accounts:sendOobCode",
    SIGN_IN_WITH_CUSTOM_TOKEN: "accounts:signInWithCustomToken",
    VERIFY_EMAIL_REQUEST_TYPE: "VERIFY_EMAIL",
  }),
} as const);

// What the visitor learns about the verification email. An email that
// already has an account answers "sent" too, so the answer never reveals it
// (AC-KAN-123-06, AS-4).
export const VERIFICATION_EMAIL_STATUS = Object.freeze({
  SEND_FAILED: "sendFailed",
  SENT: "sent",
} as const);

export type VerificationEmailStatus =
  (typeof VERIFICATION_EMAIL_STATUS)[keyof typeof VERIFICATION_EMAIL_STATUS];

// Developer-facing messages; the client maps the error code, never these.
export const CUSTOMER_SIGN_UP_ERROR = Object.freeze({
  INVALID_PAYLOAD:
    "fullName, phone, email, password, recaptchaToken, language and continueUrl are required",
  MISSING_WEB_API_KEY:
    "FIREBASE_WEB_API_KEY is not set: the verification email cannot be requested",
} as const);
