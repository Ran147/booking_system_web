// Password rules shared by every form that sets a password: subscriber sign-up
// (KAN-25), customer sign-up (KAN-124) and password recovery (KAN-37). The
// strength meter and the validation schema read the same rules, so what the
// meter shows can never disagree with what the form accepts
// (forms-validation-standards §5).
export const PASSWORD_RULE = {
  MIN_LENGTH: 8,
  PATTERN: {
    DIGIT: /\d/,
    LOWERCASE: /[a-z]/,
    SYMBOL: /[^A-Za-z0-9]/,
    UPPERCASE: /[A-Z]/,
  },
} as const;

// Ids of the rules the meter lists; they are also the last segment of their
// i18n keys (common:passwordStrength.rule.<id>).
export const PASSWORD_RULE_ID = {
  DIGIT: "digit",
  LOWERCASE: "lowercase",
  MIN_LENGTH: "minLength",
  SYMBOL: "symbol",
  UPPERCASE: "uppercase",
} as const;

export type PasswordRuleId =
  (typeof PASSWORD_RULE_ID)[keyof typeof PASSWORD_RULE_ID];

export const PASSWORD_STRENGTH_LEVEL = {
  MEDIUM: "medium",
  STRONG: "strong",
  WEAK: "weak",
} as const;

export type PasswordStrengthLevel =
  (typeof PASSWORD_STRENGTH_LEVEL)[keyof typeof PASSWORD_STRENGTH_LEVEL];

// A password is "strong" only when every rule is met, which is also the only
// case the schema accepts.
export const PASSWORD_STRENGTH_THRESHOLD = {
  MEDIUM_MIN_MET_RULES: 3,
} as const;
