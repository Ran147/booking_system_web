export const PASSWORD_RULE = {
  MIN_LENGTH: 8,
  PATTERN: {
    DIGIT: /\d/,
    LOWERCASE: /[a-z]/,
    SYMBOL: /[^A-Za-z0-9]/,
    UPPERCASE: /[A-Z]/,
  },
} as const;

export const PASSWORD_STRENGTH = {
  MEDIUM_MINIMUM_RULES: 3,
  STRONG_MINIMUM_RULES: 5,
} as const;
