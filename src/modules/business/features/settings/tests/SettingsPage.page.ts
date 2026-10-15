import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Language } from "@/constants";
import { testI18n } from "@/test-utils";
import type { Nullable } from "@/types";

/** Accessible actions and queries for the KAN-51 settings page. */
export interface SettingsPageObject {
  /** Opens the subscriber-only business profile. */
  clickBusinessProfileLink: () => Promise<void>;
  /** Returns the subscriber-only business profile link. */
  getBusinessProfileLink: () => HTMLElement;
  /** Returns the language selector by its translated label. */
  getLanguageSelector: () => HTMLSelectElement;
  /** Returns null when the business profile link is not rendered. */
  queryBusinessProfileLink: () => Nullable<HTMLElement>;
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
    clickBusinessProfileLink: async (): Promise<void> => {
      await user.click(
        screen.getByRole("link", {
          name: testI18n.t("business:settings.businessProfile.action"),
        }),
      );
    },
    getBusinessProfileLink: (): HTMLElement =>
      screen.getByRole("link", {
        name: testI18n.t("business:settings.businessProfile.action"),
      }),
    getLanguageSelector,
    queryBusinessProfileLink: (): Nullable<HTMLElement> =>
      screen.queryByRole("link", {
        name: testI18n.t("business:settings.businessProfile.action"),
      }),
    selectLanguage: async (language): Promise<void> => {
      await user.selectOptions(getLanguageSelector(), language);
    },
  };
};
