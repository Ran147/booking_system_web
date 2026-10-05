import { render } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { testI18n } from "@/shared/test-utils";
import { createPasswordInputPage } from "./PasswordInput.page";
import { PasswordInput } from "../PasswordInput";

const PASSWORD_LABEL = "Contraseña";
const TYPED_PASSWORD = "Reserva!2026";

const renderPasswordInput = (): void => {
  render(
    <I18nextProvider i18n={testI18n}>
      <PasswordInput label={PASSWORD_LABEL} name="password" />
    </I18nextProvider>,
  );
};

describe("PasswordInput", () => {
  it("KAN-25: masks the password until the person shows it", async () => {
    renderPasswordInput();
    const passwordInputPage = createPasswordInputPage();

    await passwordInputPage.typePassword(PASSWORD_LABEL, TYPED_PASSWORD);

    const passwordField = passwordInputPage.getPasswordField(PASSWORD_LABEL);
    expect(passwordField).toHaveAttribute("type", "password");
    expect(passwordInputPage.getShowButton()).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("KAN-25: shows and hides the password keeping the typed value", async () => {
    renderPasswordInput();
    const passwordInputPage = createPasswordInputPage();
    await passwordInputPage.typePassword(PASSWORD_LABEL, TYPED_PASSWORD);

    await passwordInputPage.clickToggle();

    const passwordField = passwordInputPage.getPasswordField(PASSWORD_LABEL);
    expect(passwordField).toHaveAttribute("type", "text");
    expect(passwordField).toHaveValue(TYPED_PASSWORD);
    expect(passwordInputPage.getHideButton()).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    await passwordInputPage.clickToggle();

    expect(passwordField).toHaveAttribute("type", "password");
    expect(passwordField).toHaveValue(TYPED_PASSWORD);
  });
});
