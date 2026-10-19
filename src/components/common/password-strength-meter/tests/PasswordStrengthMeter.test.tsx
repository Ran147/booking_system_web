import { render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import {
  PASSWORD_RULE_ID,
  PASSWORD_STRENGTH_LEVEL,
  type PasswordStrengthLevel,
} from "@/domain";
import { testI18n } from "@/test-utils";
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
  testI18n.t("common:auth.password.strengthLabel", {
    level: testI18n.t(`common:auth.password.strength.${level}`),
  });

describe("PasswordStrengthMeter", () => {
  it("asks for a password while the field is empty", () => {
    renderMeter("");
    const meterPage = createPasswordStrengthMeterPage();

    expect(meterPage.getLevelText()).toBe(
      testI18n.t("common:auth.password.strengthEmpty"),
    );
  });

  it("shows the strength level as text, not colour only", () => {
    renderMeter("reserva2026");
    const meterPage = createPasswordStrengthMeterPage();

    expect(meterPage.getLevelText()).toBe(
      levelText(PASSWORD_STRENGTH_LEVEL.MEDIUM),
    );
  });

  it("marks which rules are met and which are missing", () => {
    renderMeter("reserva2026");
    const meterPage = createPasswordStrengthMeterPage();

    expect(meterPage.getRuleItem(PASSWORD_RULE_ID.LOWERCASE)).toHaveTextContent(
      testI18n.t("common:auth.password.ruleMet"),
    );
    expect(meterPage.getRuleItem(PASSWORD_RULE_ID.SYMBOL)).toHaveTextContent(
      testI18n.t("common:auth.password.ruleMissing"),
    );
  });

  it("rates a password that meets every rule as strong", () => {
    renderMeter("Reserva!2026");
    const meterPage = createPasswordStrengthMeterPage();

    expect(meterPage.getLevelText()).toBe(
      levelText(PASSWORD_STRENGTH_LEVEL.STRONG),
    );
  });
});
