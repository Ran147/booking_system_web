import {
  PASSWORD_RULE,
  PASSWORD_RULE_ID,
  PASSWORD_STRENGTH_LEVEL,
  PASSWORD_STRENGTH_THRESHOLD,
  type PasswordRuleId,
  type PasswordStrengthLevel,
} from "./PasswordRule.constants";

export interface PasswordRuleResult {
  readonly id: PasswordRuleId;
  readonly isMet: boolean;
}

export interface PasswordStrength {
  readonly isValid: boolean;
  readonly level: PasswordStrengthLevel;
  readonly rules: readonly PasswordRuleResult[];
}

const resolveStrengthLevel = (
  metRuleCount: number,
  ruleCount: number,
): PasswordStrengthLevel => {
  if (metRuleCount === ruleCount) return PASSWORD_STRENGTH_LEVEL.STRONG;
  if (metRuleCount >= PASSWORD_STRENGTH_THRESHOLD.MEDIUM_MIN_MET_RULES) {
    return PASSWORD_STRENGTH_LEVEL.MEDIUM;
  }
  return PASSWORD_STRENGTH_LEVEL.WEAK;
};

export const evaluatePasswordStrength = (
  password: string,
): PasswordStrength => {
  const rules: readonly PasswordRuleResult[] = [
    {
      id: PASSWORD_RULE_ID.MIN_LENGTH,
      isMet: password.length >= PASSWORD_RULE.MIN_LENGTH,
    },
    {
      id: PASSWORD_RULE_ID.LOWERCASE,
      isMet: PASSWORD_RULE.PATTERN.LOWERCASE.test(password),
    },
    {
      id: PASSWORD_RULE_ID.UPPERCASE,
      isMet: PASSWORD_RULE.PATTERN.UPPERCASE.test(password),
    },
    {
      id: PASSWORD_RULE_ID.DIGIT,
      isMet: PASSWORD_RULE.PATTERN.DIGIT.test(password),
    },
    {
      id: PASSWORD_RULE_ID.SYMBOL,
      isMet: PASSWORD_RULE.PATTERN.SYMBOL.test(password),
    },
  ];
  const metRuleCount = rules.filter((rule) => rule.isMet).length;

  return {
    isValid: metRuleCount === rules.length,
    level: resolveStrengthLevel(metRuleCount, rules.length),
    rules,
  };
};
