import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import { describe, expect, it } from "vitest";
import { testI18n } from "@/test-utils/testI18n";
import { PasswordInput } from "../PasswordInput";

const LABEL_PASSWORD = "Contraseña";
const TYPED_PASSWORD = "Secreta-123";

const ControlledPasswordInput = (): ReactElement => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <I18nextProvider i18n={testI18n}>
      <label htmlFor="password">{LABEL_PASSWORD}</label>
      <PasswordInput
        id="password"
        isVisible={isVisible}
        onToggleVisibility={() => setIsVisible((wasVisible) => !wasVisible)}
      />
    </I18nextProvider>
  );
};

describe("PasswordInput", () => {
  it("toggles between masked and readable text keeping the value and the focus", async () => {
    const user = userEvent.setup();
    render(<ControlledPasswordInput />);
    const passwordInput = screen.getByLabelText(LABEL_PASSWORD);

    await user.type(passwordInput, TYPED_PASSWORD);
    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", { name: testI18n.t("auth.password.show") }),
    );

    expect(passwordInput).toHaveAttribute("type", "text");
    expect(passwordInput).toHaveValue(TYPED_PASSWORD);
    expect(passwordInput).toHaveFocus();
  });

  it("changes its accessible name and pressed state with the visibility", async () => {
    const user = userEvent.setup();
    render(<ControlledPasswordInput />);
    const showButton = screen.getByRole("button", {
      name: testI18n.t("auth.password.show"),
    });
    expect(showButton).toHaveAttribute("aria-pressed", "false");

    await user.click(showButton);

    expect(
      screen.getByRole("button", { name: testI18n.t("auth.password.hide") }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});
