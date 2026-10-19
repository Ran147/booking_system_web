// Mirror of PASSWORD_RULE in src/domain/user/PasswordRule.constants.ts — keep
// in sync (forms-validation-standards §5).
export const PASSWORD_RULE = Object.freeze({
  MIN_LENGTH: 8,
  PATTERN: Object.freeze({
    DIGIT: /\d/,
    LOWERCASE: /[a-z]/,
    SYMBOL: /[^A-Za-z0-9]/,
    UPPERCASE: /[A-Z]/,
  }),
} as const);
