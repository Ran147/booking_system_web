export const CONTACT_FORM_CONSTANTS = Object.freeze({
  FIELD_LIMITS: Object.freeze({
    MESSAGE_MAX_LENGTH: 1000,
    MESSAGE_MIN_LENGTH: 10,
    NAME_MAX_LENGTH: 100,
    NAME_MIN_LENGTH: 2,
    SUBJECT_MAX_LENGTH: 150,
    SUBJECT_MIN_LENGTH: 3,
  }),
  FIELD_NAMES: Object.freeze({
    EMAIL: "email",
    MESSAGE: "message",
    NAME: "name",
    RECAPTCHA_TOKEN: "recaptchaToken",
    SUBJECT: "subject",
  }),
  FORM_ID: "landing-contact-form",
});
