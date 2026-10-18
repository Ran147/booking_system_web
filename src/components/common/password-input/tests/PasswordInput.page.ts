import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE } from "@/constants";
import { testI18n } from "@/test-utils";

export interface PasswordInputPageObject {
  readonly clickToggle: () => Promise<void>;
  readonly getHideButton: () => HTMLElement;
  readonly getPasswordField: (label: string) => HTMLElement;
  readonly getShowButton: () => HTMLElement;
  readonly typePassword: (label: string, password: string) => Promise<void>;
}

export const createPasswordInputPage = (): PasswordInputPageObject => {
  const user = userEvent.setup();
  const getPasswordField = (label: string): HTMLElement =>
    screen.getByLabelText(label);

  return {
    clickToggle: async (): Promise<void> => {
      await user.click(screen.getByRole(ARIA_ROLE.BUTTON));
    },
    getHideButton: (): HTMLElement =>
      screen.getByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("common:auth.password.hide"),
      }),
    getPasswordField,
    getShowButton: (): HTMLElement =>
      screen.getByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("common:auth.password.show"),
      }),
    typePassword: async (label: string, password: string): Promise<void> => {
      await user.type(getPasswordField(label), password);
    },
  };
};
