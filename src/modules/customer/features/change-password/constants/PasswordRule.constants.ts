export const PASSWORD_RULE = Object.freeze({
  MIN_LENGTH: 8,
  PATTERN: Object.freeze({
    DIGIT: /\d/,
    LOWERCASE: /[a-z]/,
    SYMBOL: /[^A-Za-z0-9]/,
    UPPERCASE: /[A-Z]/,
  }),
});

export const CHANGE_PASSWORD_MESSAGE_KEY = Object.freeze({
  CURRENT_INVALID: "currentInvalidError",
  MISMATCH: "mismatchError",
  SAME_AS_CURRENT: "sameAsCurrentError",
});

export const PASSWORD_FIELD_NAME = Object.freeze({
  CONFIRMATION: "confirmation",
  CURRENT_PASSWORD: "currentPassword",
  NEW_PASSWORD: "newPassword",
});
