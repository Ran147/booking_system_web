// requestPasswordReset (US-36, D-1b). The reset email is sent by Firebase Auth
// through the Identity Toolkit REST API, in the language of the account.
export const PASSWORD_RESET = Object.freeze({
  DEFAULT_WEB_API_KEY: "demo-web-api-key",
  EMULATOR_AUTH_PATH: "identitytoolkit.googleapis.com/v1/accounts:sendOobCode",
  EMULATOR_ENV_VAR: "FUNCTIONS_EMULATOR",
  EMULATOR_FLAG_ENABLED: "true",
  EMULATOR_HOST_ENV_VAR: "FIREBASE_AUTH_EMULATOR_HOST",
  LOCALE_HEADER: "X-Firebase-Locale",
  PRODUCTION_URL:
    "https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode",
  REQUEST_TYPE: "PASSWORD_RESET",
  WEB_API_KEY_ENV_VAR: "FIREBASE_WEB_API_KEY",
} as const);

// Developer-facing messages sent with the HttpsError; the client maps the
// error code to a translated key and never shows these.
export const PASSWORD_RESET_ERROR = Object.freeze({
  INVALID_PAYLOAD: "email and recaptchaToken are required",
} as const);
