import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/test-utils";

interface SettingsPageObject {
  getSaveError: () => HTMLElement;
  selectDarkTheme: () => Promise<void>;
  selectLightTheme: () => Promise<void>;
  selectTheme: (accessibleName: string) => Promise<void>;
}

export const createSettingsPage = (): SettingsPageObject => {
  const user = userEvent.setup();

  const selectTheme = async (accessibleName: string): Promise<void> => {
    await user.click(screen.getByRole("radio", { name: accessibleName }));
  };

  return {
    getSaveError: (): HTMLElement => screen.getByRole("alert"),
    selectTheme,
    selectDarkTheme: (): Promise<void> =>
      selectTheme(testI18n.t("theme.darkLabel")),
    selectLightTheme: (): Promise<void> =>
      selectTheme(testI18n.t("theme.lightLabel")),
  };
};
