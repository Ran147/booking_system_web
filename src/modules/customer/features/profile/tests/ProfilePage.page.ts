import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/test-utils/testI18n";

export interface ProfilePageObject {
  clickRetry: () => Promise<void>;
  findEmptyMessage: () => Promise<HTMLElement>;
  findErrorMessage: () => Promise<HTMLElement>;
  findNotProvidedHints: () => Promise<HTMLElement[]>;
  findProfileValue: (value: string) => Promise<HTMLElement>;
  getLoadingStatus: () => HTMLElement;
}

export const createProfilePage = (): ProfilePageObject => {
  const user = userEvent.setup();

  return {
    clickRetry: async (): Promise<void> => {
      await user.click(
        screen.getByRole("button", { name: testI18n.t("actions.retry") }),
      );
    },
    findEmptyMessage: (): Promise<HTMLElement> =>
      screen.findByText(testI18n.t("customer:profile.view.empty")),
    findErrorMessage: (): Promise<HTMLElement> =>
      screen.findByText(testI18n.t("errors.network")),
    findNotProvidedHints: (): Promise<HTMLElement[]> =>
      screen.findAllByText(testI18n.t("customer:profile.view.notProvidedHint")),
    findProfileValue: (value: string): Promise<HTMLElement> =>
      screen.findByText(value),
    getLoadingStatus: (): HTMLElement =>
      screen.getByRole("status", { name: testI18n.t("status.loading") }),
  };
};
