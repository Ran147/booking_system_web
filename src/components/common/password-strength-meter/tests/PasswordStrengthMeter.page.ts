import { screen } from "@testing-library/react";
import { ARIA_ROLE } from "@/shared/constants";
import type { PasswordRuleId } from "@/shared/domain";
import { testI18n } from "@/shared/test-utils";

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
        .getByText(testI18n.t(`common:passwordStrength.rule.${ruleId}`))
        .closest("li") as HTMLElement,
  });
