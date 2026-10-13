import {
  evaluatePasswordStrength,
  PASSWORD_RULE_ID,
  PASSWORD_STRENGTH_LEVEL,
  type PasswordRuleId,
} from "@/domain";

const isRuleMet = (password: string, ruleId: PasswordRuleId): boolean =>
  evaluatePasswordStrength(password).rules.some(
    (rule) => rule.id === ruleId && rule.isMet,
  );

describe("evaluatePasswordStrength", () => {
  it("accepts a password that meets every rule as strong", () => {
    const passwordStrength = evaluatePasswordStrength("Reserva!2026");

    expect(passwordStrength.isValid).toBe(true);
    expect(passwordStrength.level).toBe(PASSWORD_STRENGTH_LEVEL.STRONG);
  });

  it("rates a password that meets three or four rules as medium", () => {
    const passwordStrength = evaluatePasswordStrength("reserva2026");

    expect(passwordStrength.isValid).toBe(false);
    expect(passwordStrength.level).toBe(PASSWORD_STRENGTH_LEVEL.MEDIUM);
  });

  it("rates an empty or short password as weak", () => {
    expect(evaluatePasswordStrength("").level).toBe(
      PASSWORD_STRENGTH_LEVEL.WEAK,
    );
    expect(evaluatePasswordStrength("abc").level).toBe(
      PASSWORD_STRENGTH_LEVEL.WEAK,
    );
  });

  it("marks each missing rule", () => {
    expect(isRuleMet("Reserva2026", PASSWORD_RULE_ID.SYMBOL)).toBe(false);
    expect(isRuleMet("reserva!2026", PASSWORD_RULE_ID.UPPERCASE)).toBe(false);
    expect(isRuleMet("RESERVA!2026", PASSWORD_RULE_ID.LOWERCASE)).toBe(false);
    expect(isRuleMet("Reserva!abc", PASSWORD_RULE_ID.DIGIT)).toBe(false);
    expect(isRuleMet("Re!2026", PASSWORD_RULE_ID.MINIMUM_LENGTH)).toBe(false);
  });
});
