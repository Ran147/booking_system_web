// Password rules shared by every form that sets or changes a password:
// sign-up (KAN-25, KAN-124), change password (KAN-53, HU-171) and password
// recovery (KAN-37). The strength meter and the validation schemas read the
// same rules, so what the meter shows never disagrees with what a form accepts.
export const PASSWORD_RULE = Object.freeze({
  MIN_LENGTH: 8,
  PATTERN: Object.freeze({
    DIGIT: /\d/,
    LOWERCASE: /[a-z]/,
    SYMBOL: /[^A-Za-z0-9]/,
    UPPERCASE: /[A-Z]/,
  }),
});

// Ids of the rules the meter lists; each one is also the last segment of its
// i18n key (common:auth.password.rules.<id>).
export const PASSWORD_RULE_ID = Object.freeze({
  DIGIT: "digit",
  LOWERCASE: "lowercase",
  MINIMUM_LENGTH: "minimumLength",
  SYMBOL: "symbol",
  UPPERCASE: "uppercase",
});

export type PasswordRuleId =
  (typeof PASSWORD_RULE_ID)[keyof typeof PASSWORD_RULE_ID];

export const PASSWORD_STRENGTH_LEVEL = Object.freeze({
  MEDIUM: "medium",
  STRONG: "strong",
  WEAK: "weak",
});

export type PasswordStrengthLevel =
  (typeof PASSWORD_STRENGTH_LEVEL)[keyof typeof PASSWORD_STRENGTH_LEVEL];

// A password is "strong" only when every rule is met, which is also the only
// case the schemas accept.
export const PASSWORD_STRENGTH_THRESHOLD = Object.freeze({
  MEDIUM_MINIMUM_MET_RULES: 3,
});
