import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/shared/test-utils/testI18n";

export interface CollaboratorFormPageObject {
  readonly clickCancel: () => Promise<void>;
  readonly clickGoToServices: () => Promise<void>;
  readonly clickSubmitCreate: () => Promise<void>;
  readonly clickSubmitEdit: () => Promise<void>;
  readonly findEmailInput: () => Promise<HTMLInputElement>;
  readonly findNoActiveServicesAlert: () => Promise<HTMLElement>;
  readonly findText: (text: string) => Promise<HTMLElement>;
  readonly toggleCheckboxByLabel: (label: string) => Promise<void>;
  readonly typeEmail: (email: string) => Promise<void>;
  readonly typeFullName: (fullName: string) => Promise<void>;
  readonly typePhone: (phone: string) => Promise<void>;
  readonly typeSpecialty: (specialty: string) => Promise<void>;
}

export const createCollaboratorFormPage = (): CollaboratorFormPageObject => {
  const user = userEvent.setup();

  const findFullNameInput = (): Promise<HTMLInputElement> =>
    screen.findByLabelText(
      testI18n.t("business:collaborators.form.fullNameLabel"),
    );

  const findEmailInput = (): Promise<HTMLInputElement> =>
    screen.findByLabelText(
      testI18n.t("business:collaborators.form.emailLabel"),
    );

  const findPhoneInput = (): Promise<HTMLInputElement> =>
    screen.findByLabelText(
      testI18n.t("business:collaborators.form.phoneLabel"),
    );

  const findSpecialtyInput = (): Promise<HTMLInputElement> =>
    screen.findByLabelText(
      testI18n.t("business:collaborators.form.specialtyLabel"),
    );

  const typeFullName = async (fullName: string): Promise<void> => {
    const input = await findFullNameInput();
    await user.clear(input);
    if (fullName) {
      await user.type(input, fullName);
    }
  };

  const typeEmail = async (email: string): Promise<void> => {
    const input = await findEmailInput();
    await user.clear(input);
    if (email) {
      await user.type(input, email);
    }
  };

  const typePhone = async (phone: string): Promise<void> => {
    const input = await findPhoneInput();
    await user.clear(input);
    if (phone) {
      await user.type(input, phone);
    }
  };

  const typeSpecialty = async (specialty: string): Promise<void> => {
    const input = await findSpecialtyInput();
    await user.clear(input);
    if (specialty) {
      await user.type(input, specialty);
    }
  };

  const toggleCheckboxByLabel = async (label: string): Promise<void> => {
    const checkbox = await screen.findByRole("checkbox", { name: label });
    await user.click(checkbox);
  };

  const clickSubmitCreate = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("business:collaborators.create.submitAction"),
    });
    await user.click(button);
  };

  const clickSubmitEdit = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("business:collaborators.edit.submitAction"),
    });
    await user.click(button);
  };

  const clickCancel = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("common:actions.cancel"),
    });
    await user.click(button);
  };

  const clickGoToServices = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("business:collaborators.create.noActiveServicesAction"),
    });
    await user.click(button);
  };

  const findNoActiveServicesAlert = (): Promise<HTMLElement> =>
    screen.findByText(
      testI18n.t("business:collaborators.create.noActiveServices"),
    );

  const findText = (text: string): Promise<HTMLElement> =>
    screen.findByText(text);

  return {
    clickCancel,
    clickGoToServices,
    clickSubmitCreate,
    clickSubmitEdit,
    findEmailInput,
    findNoActiveServicesAlert,
    findText,
    toggleCheckboxByLabel,
    typeEmail,
    typeFullName,
    typePhone,
    typeSpecialty,
  };
};
