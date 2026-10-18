import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Language } from "@/constants";
import { testI18n } from "@/test-utils";

/** Accessible actions and queries for the KAN-51 settings page. */
export interface SettingsPageObject {
  /** Returns the current theme option by its translated label. */
  getThemeOption: (accessibleName: string) => HTMLInputElement;
  /** Returns the language selector by its translated label. */
  getLanguageSelector: () => HTMLSelectElement;
  /** Selects one of the supported interface languages. */
  selectLanguage: (language: Language) => Promise<void>;
  /** Selects the dark theme. */
  selectDarkTheme: () => Promise<void>;
  /** Selects the light theme. */
  selectLightTheme: () => Promise<void>;
  /** Selects the system theme. */
  selectSystemTheme: () => Promise<void>;
}

export const createSettingsPage = (): SettingsPageObject => {
  const user = userEvent.setup();

  const getLanguageSelector = (): HTMLSelectElement =>
    screen.getByRole("combobox", {
      name: testI18n.t("business:settings.language.label"),
    });

  return {
    getThemeOption: (accessibleName): HTMLInputElement =>
      screen.getByRole("radio", { name: accessibleName }),
    getLanguageSelector,
    selectLanguage: async (language): Promise<void> => {
      await user.selectOptions(getLanguageSelector(), language);
    },
    selectDarkTheme: async (): Promise<void> => {
      await user.click(
        screen.getByRole("radio", { name: testI18n.t("theme.darkLabel") }),
      );
    },
    selectLightTheme: async (): Promise<void> => {
      await user.click(
        screen.getByRole("radio", { name: testI18n.t("theme.lightLabel") }),
      );
    },
    selectSystemTheme: async (): Promise<void> => {
      await user.click(
        screen.getByRole("radio", { name: testI18n.t("theme.systemLabel") }),
      );
    },
  };
};
