import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Nullable } from "@/shared/types";
import { testI18n } from "@/test-utils/testI18n";
import { CONTACT_FORM_CONSTANTS } from "../constants/contactForm.constants";

export interface ContactFormPageObject {
  clickRecaptcha: () => Promise<void>;
  clickSubmit: () => Promise<void>;
  getEmailInput: () => HTMLInputElement;
  getForm: () => HTMLFormElement;
  getMessageInput: () => HTMLTextAreaElement;
  getNameInput: () => HTMLInputElement;
  getRecaptchaButton: () => HTMLElement;
  getSubmitButton: () => HTMLButtonElement;
  getSubjectInput: () => HTMLInputElement;
  queryAllFieldErrors: (messageText: string) => HTMLElement[];
  queryFieldError: (messageText: string) => Nullable<HTMLElement>;
  queryServerErrorAlert: () => Nullable<HTMLElement>;
  querySuccessAlert: () => Nullable<HTMLElement>;
  typeInto: (
    fieldName: "email" | "message" | "name" | "subject",
    value: string,
  ) => Promise<void>;
}

export const createContactFormPage = (): ContactFormPageObject => {
  const user = userEvent.setup({ delay: null });

  const getForm = (): HTMLFormElement =>
    document.getElementById(CONTACT_FORM_CONSTANTS.FORM_ID) as HTMLFormElement;

  const getNameInput = (): HTMLInputElement =>
    screen.getByLabelText(
      new RegExp(testI18n.t("landing:contact.form.nameLabel"), "i"),
    ) as HTMLInputElement;

  const getEmailInput = (): HTMLInputElement =>
    screen.getByLabelText(
      new RegExp(testI18n.t("landing:contact.form.emailLabel"), "i"),
    ) as HTMLInputElement;

  const getSubjectInput = (): HTMLInputElement =>
    screen.getByLabelText(
      new RegExp(testI18n.t("landing:contact.form.subjectLabel"), "i"),
    ) as HTMLInputElement;

  const getMessageInput = (): HTMLTextAreaElement =>
    screen.getByLabelText(
      new RegExp(testI18n.t("landing:contact.form.messageLabel"), "i"),
    ) as HTMLTextAreaElement;

  const getRecaptchaButton = (): HTMLElement =>
    screen.getByRole("button", {
      name: testI18n.t("landing:contact.form.recaptchaLabel"),
    });

  const getSubmitButton = (): HTMLButtonElement =>
    screen.getByRole("button", {
      name: testI18n.t("landing:contact.form.submitButton"),
    }) as HTMLButtonElement;

  const querySuccessAlert = (): Nullable<HTMLElement> =>
    screen.queryByText(testI18n.t("landing:contact.form.success"));

  const queryServerErrorAlert = (): Nullable<HTMLElement> =>
    screen.queryByText(testI18n.t("landing:contact.form.serverError"));

  const queryFieldError = (messageText: string): Nullable<HTMLElement> =>
    screen.queryByText(messageText);

  const queryAllFieldErrors = (messageText: string): HTMLElement[] =>
    screen.queryAllByText(messageText);

  const typeInto = async (
    fieldName: "email" | "message" | "name" | "subject",
    value: string,
  ): Promise<void> => {
    const inputMap = {
      email: getEmailInput,
      message: getMessageInput,
      name: getNameInput,
      subject: getSubjectInput,
    };
    const target = inputMap[fieldName]();
    await user.clear(target);
    if (value) {
      await user.type(target, value);
    }
  };

  const clickRecaptcha = async (): Promise<void> => {
    await user.click(getRecaptchaButton());
  };

  const clickSubmit = async (): Promise<void> => {
    await user.click(getSubmitButton());
  };

  return {
    clickRecaptcha,
    clickSubmit,
    getEmailInput,
    getForm,
    getMessageInput,
    getNameInput,
    getRecaptchaButton,
    getSubmitButton,
    getSubjectInput,
    queryAllFieldErrors,
    queryFieldError,
    queryServerErrorAlert,
    querySuccessAlert,
    typeInto,
  };
};
