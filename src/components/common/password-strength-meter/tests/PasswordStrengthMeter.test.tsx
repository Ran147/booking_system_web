import { render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import {
  PASSWORD_RULE_ID,
  PASSWORD_STRENGTH_LEVEL,
  type PasswordStrengthLevel,
} from "@/shared/domain";
import { testI18n } from "@/shared/test-utils";
import { createPasswordStrengthMeterPage } from "./PasswordStrengthMeter.page";
import { PasswordStrengthMeter } from "../PasswordStrengthMeter";

const renderMeter = (password: string): void => {
  render(
    <I18nextProvider i18n={testI18n}>
      <PasswordStrengthMeter password={password} />
    </I18nextProvider>,
  );
};

const levelText = (level: PasswordStrengthLevel): string =>
  testI18n.t("common:passwordStrength.levelLabel", {
    level: testI18n.t(`common:passwordStrength.level.${level}`),
  });

describe("PasswordStrengthMeter", () => {
  it("KAN-25: asks for a password while the field is empty", () => {
    renderMeter("");
    const meterPage = createPasswordStrengthMeterPage();

    expect(meterPage.getLevelText()).toBe(
      testI18n.t("common:passwordStrength.emptyLabel"),
    );
  });

  it("KAN-25: shows the strength level as text, not colour only", () => {
    renderMeter("reserva2026");
    const meterPage = createPasswordStrengthMeterPage();

    expect(meterPage.getLevelText()).toBe(
      levelText(PASSWORD_STRENGTH_LEVEL.MEDIUM),
    );
  });

  it("KAN-25: marks which rules are met and which are missing", () => {
    renderMeter("reserva2026");
    const meterPage = createPasswordStrengthMeterPage();

    expect(meterPage.getRuleItem(PASSWORD_RULE_ID.LOWERCASE)).toHaveTextContent(
      testI18n.t("common:passwordStrength.ruleMet"),
    );
    expect(meterPage.getRuleItem(PASSWORD_RULE_ID.SYMBOL)).toHaveTextContent(
      testI18n.t("common:passwordStrength.ruleMissing"),
    );
  });

  it("KAN-25: rates a password that meets every rule as strong", () => {
    renderMeter("Reserva!2026");
    const meterPage = createPasswordStrengthMeterPage();

    expect(meterPage.getLevelText()).toBe(
      levelText(PASSWORD_STRENGTH_LEVEL.STRONG),
    );
  });
});
