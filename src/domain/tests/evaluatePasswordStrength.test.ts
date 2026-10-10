import {
  evaluatePasswordStrength,
  PASSWORD_RULE_ID,
  PASSWORD_STRENGTH_LEVEL,
} from "@/shared/domain";
import type { NullableUndefined } from "@/shared/types";

const findRule = (
  password: string,
  ruleId: string,
): NullableUndefined<boolean> =>
  evaluatePasswordStrength(password).rules.find((rule) => rule.id === ruleId)
    ?.isMet;

describe("evaluatePasswordStrength", () => {
  it("accepts a password that meets every rule as strong", () => {
    const passwordStrength = evaluatePasswordStrength("Reserva!2026");

    expect(passwordStrength.isValid).toBe(true);
    expect(passwordStrength.level).toBe(PASSWORD_STRENGTH_LEVEL.STRONG);
    expect(passwordStrength.rules.every((rule) => rule.isMet)).toBe(true);
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
    expect(findRule("Reserva2026", PASSWORD_RULE_ID.SYMBOL)).toBe(false);
    expect(findRule("reserva!2026", PASSWORD_RULE_ID.UPPERCASE)).toBe(false);
    expect(findRule("RESERVA!2026", PASSWORD_RULE_ID.LOWERCASE)).toBe(false);
    expect(findRule("Reserva!abc", PASSWORD_RULE_ID.DIGIT)).toBe(false);
    expect(findRule("Re!2026", PASSWORD_RULE_ID.MIN_LENGTH)).toBe(false);
  });
});
