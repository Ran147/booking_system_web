import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import { testI18n } from "@/test-utils";
import { createPasswordInputPage } from "./PasswordInput.page";
import { PasswordInput } from "../PasswordInput";
import type { PasswordInputProps } from "../models/passwordInput.model";

const PASSWORD_LABEL = "Contraseña";
const TYPED_PASSWORD = "Reserva!2026";

const renderPasswordInput = (
  passwordInputProps: Partial<PasswordInputProps> = {},
): ((nextProps: Partial<PasswordInputProps>) => void) => {
  const buildTree = (props: Partial<PasswordInputProps>): ReactElement => (
    <I18nextProvider i18n={testI18n}>
      <PasswordInput label={PASSWORD_LABEL} name="password" {...props} />
    </I18nextProvider>
  );
  const { rerender } = render(buildTree(passwordInputProps));
  return (nextProps): void => {
    rerender(buildTree(nextProps));
  };
};

describe("PasswordInput", () => {
  it("masks the password until the person shows it", async () => {
    renderPasswordInput();
    const passwordInputPage = createPasswordInputPage();

    await passwordInputPage.typePassword(PASSWORD_LABEL, TYPED_PASSWORD);

    expect(passwordInputPage.getPasswordField(PASSWORD_LABEL)).toHaveAttribute(
      "type",
      "password",
    );
    expect(passwordInputPage.getShowButton()).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("shows and hides the password keeping the typed value", async () => {
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

  it("controlled: follows isVisible and asks the owner to toggle", async () => {
    const handleToggleVisibility = vi.fn();
    const rerenderPasswordInput = renderPasswordInput({
      isVisible: false,
      onToggleVisibility: handleToggleVisibility,
    });
    const passwordInputPage = createPasswordInputPage();

    await passwordInputPage.clickToggle();

    expect(handleToggleVisibility).toHaveBeenCalledTimes(1);
    expect(passwordInputPage.getPasswordField(PASSWORD_LABEL)).toHaveAttribute(
      "type",
      "password",
    );

    rerenderPasswordInput({
      isVisible: true,
      onToggleVisibility: handleToggleVisibility,
    });

    expect(passwordInputPage.getPasswordField(PASSWORD_LABEL)).toHaveAttribute(
      "type",
      "text",
    );
  });

  it("hides the password again when visibilityResetKey changes", async () => {
    const rerenderPasswordInput = renderPasswordInput({
      visibilityResetKey: 0,
    });
    const passwordInputPage = createPasswordInputPage();
    await passwordInputPage.clickToggle();
    expect(passwordInputPage.getPasswordField(PASSWORD_LABEL)).toHaveAttribute(
      "type",
      "text",
    );

    rerenderPasswordInput({ visibilityResetKey: 1 });

    expect(passwordInputPage.getPasswordField(PASSWORD_LABEL)).toHaveAttribute(
      "type",
      "password",
    );
  });

  it("disables the toggle together with the field", () => {
    renderPasswordInput({ disabled: true });
    const passwordInputPage = createPasswordInputPage();

    expect(passwordInputPage.getPasswordField(PASSWORD_LABEL)).toBeDisabled();
    expect(passwordInputPage.getShowButton()).toBeDisabled();
  });
});
