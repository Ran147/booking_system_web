// reCAPTCHA v2 checkbox loaded from Google's official script, without an npm
// dependency (US-33, D-4). The test site key is public: Google documents it
// for automated tests and it always passes, so the emulators and e2e use it.
export const RECAPTCHA = Object.freeze({
  ONLOAD_CALLBACK_NAME: "onRecaptchaLoad",
  RENDER_MODE: "explicit",
  SCRIPT_PARAM: Object.freeze({
    LANGUAGE: "hl",
    ONLOAD: "onload",
    RENDER: "render",
  }),
  SCRIPT_URL: "https://www.google.com/recaptcha/api.js",
  TEST_SITE_KEY: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI",
} as const);
