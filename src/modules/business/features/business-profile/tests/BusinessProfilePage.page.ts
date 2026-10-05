import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/test-utils";

export interface BusinessProfilePageObject {
  clickSave: () => Promise<void>;
  findNameInput: () => Promise<HTMLInputElement>;
  getDescriptionInput: () => HTMLTextAreaElement;
  getFacebookInput: () => HTMLInputElement;
  getSaveButton: () => HTMLElement;
  replaceName: (name: string) => Promise<void>;
}

export const createBusinessProfilePage = (): BusinessProfilePageObject => {
  const user = userEvent.setup();

  const findNameInput = async (): Promise<HTMLInputElement> =>
    screen.findByRole("textbox", {
      name: testI18n.t("business:businessProfile.name.label"),
    });

  const getDescriptionInput = (): HTMLTextAreaElement =>
    screen.getByLabelText(
      testI18n.t("business:businessProfile.descriptionField.label"),
    );

  const getFacebookInput = (): HTMLInputElement =>
    screen.getByLabelText(
      testI18n.t("business:businessProfile.socialLinks.facebookLabel"),
    );

  const getSaveButton = (): HTMLElement =>
    screen.getByRole("button", {
      name: testI18n.t("business:businessProfile.saveAction"),
    });

  const replaceName = async (name: string): Promise<void> => {
    const input = await findNameInput();
    await user.clear(input);
    await user.type(input, name);
  };

  const clickSave = async (): Promise<void> => {
    await user.click(getSaveButton());
  };

  return {
    clickSave,
    findNameInput,
    getDescriptionInput,
    getFacebookInput,
    getSaveButton,
    replaceName,
  };
};
