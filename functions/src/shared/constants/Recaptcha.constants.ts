// reCAPTCHA v2 server-side verification (US-33, D-4). The test secret is
// public: Google documents it for automated tests and it approves every
// token. It is used only inside the Emulator Suite, so local runs and e2e
// need no secret; deployed functions read RECAPTCHA_SECRET_KEY from Secret
// Manager.
export const RECAPTCHA_VERIFICATION = Object.freeze({
  EMULATOR_ENV_VAR: "FUNCTIONS_EMULATOR",
  EMULATOR_FLAG_ENABLED: "true",
  FORM_FIELD: Object.freeze({
    RESPONSE: "response",
    SECRET: "secret",
  }),
  SECRET_NAME: "RECAPTCHA_SECRET_KEY",
  TEST_SECRET_KEY: "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe",
  VERIFY_URL: "https://www.google.com/recaptcha/api/siteverify",
} as const);

// Developer-facing messages sent with the HttpsError; the client maps the
// error code to a translated key and never shows these.
export const RECAPTCHA_VERIFICATION_ERROR = Object.freeze({
  MISSING_TOKEN: "recaptchaToken is required",
  REJECTED: "The reCAPTCHA token was rejected",
  UNREACHABLE: "The reCAPTCHA verification service could not be reached",
} as const);
