import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Language } from "@/constants";
import { testI18n } from "@/test-utils";

/** Accessible actions and queries for the KAN-51 settings page. */
export interface SettingsPageObject {
  /** Returns the language selector by its translated label. */
  getLanguageSelector: () => HTMLSelectElement;
  /** Selects one of the supported interface languages. */
  selectLanguage: (language: Language) => Promise<void>;
}

export const createSettingsPage = (): SettingsPageObject => {
  const user = userEvent.setup();

  const getLanguageSelector = (): HTMLSelectElement =>
    screen.getByRole("combobox", {
      name: testI18n.t("business:settings.language.label"),
    });

  return {
    getLanguageSelector,
    selectLanguage: async (language): Promise<void> => {
      await user.selectOptions(getLanguageSelector(), language);
    },
  };
};
