export const KEYBOARD_KEY = Object.freeze({
  ENTER: "Enter",
  SPACE: " ",
} as const);

export const SUPPORT_LIMITS = Object.freeze({
  MESSAGE_MAX_LENGTH: 5000,
  MESSAGE_MIN_LENGTH: 1,
  SUBJECT_MAX_LENGTH: 120,
  SUBJECT_MIN_LENGTH: 1,
} as const);
