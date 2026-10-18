// Mirror of PHONE_RULE in src/domain/user/PhoneRule.constants.ts — keep in
// sync (forms-validation-standards §6).
export const PHONE_RULE = Object.freeze({
  MAX_DIGITS: 15,
  MAX_LENGTH: 20,
  MIN_DIGITS: 7,
  PATTERN: Object.freeze({
    ALLOWED_CHARACTERS: /^[0-9+() -]+$/,
    DIGIT: /\d/g,
  }),
} as const);
