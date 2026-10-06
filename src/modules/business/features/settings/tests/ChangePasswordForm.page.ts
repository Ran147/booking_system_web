import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/test-utils";

export interface ChangePasswordFormPageObject {
  clickSubmit: () => Promise<void>;
  fillForm: (values: {
    confirmPassword: string;
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
  getConfirmPasswordInput: () => HTMLInputElement;
  getCurrentPasswordInput: () => HTMLInputElement;
  getNewPasswordInput: () => HTMLInputElement;
  toggleCurrentPasswordVisibility: () => Promise<void>;
}

export const createChangePasswordFormPage =
  (): ChangePasswordFormPageObject => {
    const user = userEvent.setup();
    const getCurrentPasswordInput = (): HTMLInputElement =>
      screen.getByLabelText(
        testI18n.t("business:settings.password.currentPasswordLabel"),
        { exact: false, selector: 'input[name="currentPassword"]' },
      );
    const getNewPasswordInput = (): HTMLInputElement =>
      screen.getByLabelText(
        testI18n.t("business:settings.password.newPasswordLabel"),
        { exact: false, selector: 'input[name="newPassword"]' },
      );
    const getConfirmPasswordInput = (): HTMLInputElement =>
      screen.getByLabelText(
        testI18n.t("business:settings.password.confirmPasswordLabel"),
        { exact: false, selector: 'input[name="confirmPassword"]' },
      );

    return {
      clickSubmit: async (): Promise<void> => {
        await user.click(
          screen.getByRole("button", {
            name: testI18n.t("business:settings.password.submitAction"),
          }),
        );
      },
      fillForm: async ({
        confirmPassword,
        currentPassword,
        newPassword,
      }): Promise<void> => {
        await user.type(getCurrentPasswordInput(), currentPassword);
        await user.type(getNewPasswordInput(), newPassword);
        await user.type(getConfirmPasswordInput(), confirmPassword);
      },
      getConfirmPasswordInput,
      getCurrentPasswordInput,
      getNewPasswordInput,
      toggleCurrentPasswordVisibility: async (): Promise<void> => {
        const [currentPasswordToggle] = screen.getAllByRole("button", {
          name: testI18n.t("auth.password.show"),
        });

        if (!currentPasswordToggle)
          throw new Error("visibility-toggle-missing");
        await user.click(currentPasswordToggle);
      },
    };
  };
