import { screen } from "@testing-library/react";
import { ARIA_ROLE } from "@/constants";
import { PASSWORD_RULE, type PasswordRuleId } from "@/domain";
import { testI18n } from "@/test-utils";

export interface PasswordStrengthMeterPageObject {
  readonly getLevelText: () => string;
  readonly getRuleItem: (ruleId: PasswordRuleId) => HTMLElement;
}

export const createPasswordStrengthMeterPage =
  (): PasswordStrengthMeterPageObject => ({
    getLevelText: (): string =>
      screen.getByRole(ARIA_ROLE.STATUS).textContent ?? "",
    getRuleItem: (ruleId: PasswordRuleId): HTMLElement =>
      screen
        .getByText(
          testI18n.t(`common:auth.password.rules.${ruleId}`, {
            count: PASSWORD_RULE.MIN_LENGTH,
          }),
        )
        .closest("li") as HTMLElement,
  });
