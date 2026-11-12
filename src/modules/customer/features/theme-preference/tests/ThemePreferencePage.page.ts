import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/test-utils/testI18n";

export interface ThemePreferencePageObject {
  clickDarkTheme: () => Promise<void>;
  clickLightTheme: () => Promise<void>;
  findActiveTheme: (theme: string) => Promise<HTMLElement>;
  getDarkThemeButton: () => HTMLElement;
  getLightThemeButton: () => HTMLElement;
}

export const createThemePreferencePage = (): ThemePreferencePageObject => {
  const user = userEvent.setup();
  const getDarkThemeButton = (): HTMLElement =>
    screen.getByRole("button", { name: /Oscuro/ });
  const getLightThemeButton = (): HTMLElement =>
    screen.getByRole("button", { name: /Claro/ });

  return {
    clickDarkTheme: async () => user.click(getDarkThemeButton()),
    clickLightTheme: async () => user.click(getLightThemeButton()),
    findActiveTheme: async (theme) =>
      screen.findByText(
        testI18n.t("customer:profile.preferences.activeTheme", { theme }),
      ),
    getDarkThemeButton,
    getLightThemeButton,
  };
};
