import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/test-utils";

/** Accessible actions and queries for Settings to business-profile navigation. */
export interface BusinessProfileSettingsNavigationPageObject {
  clickBusinessProfileLink: () => Promise<void>;
  findBusinessNameInput: () => Promise<HTMLInputElement>;
  findSettingsHeading: () => Promise<HTMLElement>;
}

export const createBusinessProfileSettingsNavigationPage =
  (): BusinessProfileSettingsNavigationPageObject => {
    const user = userEvent.setup();

    return {
      clickBusinessProfileLink: async (): Promise<void> => {
        await user.click(
          screen.getByRole("link", {
            name: testI18n.t("business:settings.businessProfile.action"),
          }),
        );
      },
      findBusinessNameInput: (): Promise<HTMLInputElement> =>
        screen.findByRole("textbox", {
          name: testI18n.t("business:businessProfile.name.label"),
        }),
      findSettingsHeading: (): Promise<HTMLElement> =>
        screen.findByRole("heading", {
          level: 1,
          name: testI18n.t("business:settings.title"),
        }),
    };
  };
