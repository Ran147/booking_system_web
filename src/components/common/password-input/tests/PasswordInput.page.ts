import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE } from "@/shared/constants";
import { testI18n } from "@/shared/test-utils";

export interface PasswordInputPageObject {
  readonly clickToggle: () => Promise<void>;
  readonly getHideButton: () => HTMLElement;
  readonly getPasswordField: (label: string) => HTMLElement;
  readonly getShowButton: () => HTMLElement;
  readonly typePassword: (label: string, password: string) => Promise<void>;
}

export const createPasswordInputPage = (): PasswordInputPageObject => {
  const user = userEvent.setup();

  const getShowButton = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("common:password.showAction"),
    });
  const getHideButton = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("common:password.hideAction"),
    });
  const getPasswordField = (label: string): HTMLElement =>
    screen.getByLabelText(label);

  return {
    clickToggle: async (): Promise<void> => {
      await user.click(screen.getByRole(ARIA_ROLE.BUTTON));
    },
    getHideButton,
    getPasswordField,
    getShowButton,
    typePassword: async (label: string, password: string): Promise<void> => {
      await user.type(getPasswordField(label), password);
    },
  };
};
