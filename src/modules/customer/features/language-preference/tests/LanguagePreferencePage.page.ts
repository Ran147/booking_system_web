import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/shared/test-utils";

export interface LanguagePreferencePageObject {
  clickEnglish: () => Promise<void>;
  clickSpanish: () => Promise<void>;
  getEnglishOption: () => HTMLButtonElement;
  getSpanishOption: () => HTMLButtonElement;
}

export const createLanguagePreferencePage =
  (): LanguagePreferencePageObject => {
    const user = userEvent.setup();
    const getEnglishOption = (): HTMLButtonElement =>
      screen.getByRole("button", {
        name: testI18n.t("common:language.englishLabel"),
      }) as HTMLButtonElement;
    const getSpanishOption = (): HTMLButtonElement =>
      screen.getByRole("button", {
        name: testI18n.t("common:language.spanishLabel"),
      }) as HTMLButtonElement;

    return {
      clickEnglish: async () => user.click(getEnglishOption()),
      clickSpanish: async () => user.click(getSpanishOption()),
      getEnglishOption,
      getSpanishOption,
    };
  };
