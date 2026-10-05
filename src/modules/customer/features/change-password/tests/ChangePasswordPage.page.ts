import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/shared/test-utils";

export interface ChangePasswordPageObject {
  changeConfirmation: (password: string) => Promise<void>;
  changeCurrentPassword: (password: string) => Promise<void>;
  changeNewPassword: (password: string) => Promise<void>;
  clickSave: () => Promise<void>;
  clickShowPassword: () => Promise<void>;
  getConfirmationInput: () => HTMLInputElement;
  getCurrentPasswordInput: () => HTMLInputElement;
  getNewPasswordInput: () => HTMLInputElement;
  getSaveButton: () => HTMLButtonElement;
}

export const createChangePasswordPage = (): ChangePasswordPageObject => {
  const user = userEvent.setup();

  const getInput = (label: string): HTMLInputElement =>
    screen.getByLabelText(new RegExp(`^${label}`)) as HTMLInputElement;

  const replaceInputValue = async (
    input: HTMLInputElement,
    password: string,
  ): Promise<void> => {
    await user.clear(input);
    if (password) await user.type(input, password);
  };

  const getCurrentPasswordInput = (): HTMLInputElement =>
    getInput(testI18n.t("customer:profile.password.currentPasswordLabel"));
  const getNewPasswordInput = (): HTMLInputElement =>
    getInput(testI18n.t("customer:profile.password.newPasswordLabel"));
  const getConfirmationInput = (): HTMLInputElement =>
    getInput(testI18n.t("customer:profile.password.confirmationLabel"));

  return {
    changeConfirmation: async (password) =>
      replaceInputValue(getConfirmationInput(), password),
    changeCurrentPassword: async (password) =>
      replaceInputValue(getCurrentPasswordInput(), password),
    changeNewPassword: async (password) =>
      replaceInputValue(getNewPasswordInput(), password),
    clickSave: async () =>
      user.click(
        screen.getByRole("button", {
          name: testI18n.t("customer:profile.password.saveAction"),
        }),
      ),
    clickShowPassword: async () =>
      user.click(
        screen.getAllByRole("button", {
          name: testI18n.t("customer:profile.password.showPassword"),
        })[0]!,
      ),
    getConfirmationInput,
    getCurrentPasswordInput,
    getNewPasswordInput,
    getSaveButton: () =>
      screen.getByRole("button", {
        name: testI18n.t("customer:profile.password.saveAction"),
      }) as HTMLButtonElement,
  };
};
