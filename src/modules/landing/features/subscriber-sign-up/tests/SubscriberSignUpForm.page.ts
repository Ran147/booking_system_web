import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE } from "@/shared/constants";
import { testI18n } from "@/shared/test-utils";

const FIELD_LABEL_KEY = {
  businessName: "landing:subscriberSignUp.form.businessNameLabel",
  businessSlug: "landing:subscriberSignUp.form.businessSlugLabel",
  email: "landing:subscriberSignUp.form.emailLabel",
  firstName: "landing:subscriberSignUp.form.firstNameLabel",
  lastName: "landing:subscriberSignUp.form.lastNameLabel",
  password: "landing:subscriberSignUp.form.passwordLabel",
  passwordConfirmation:
    "landing:subscriberSignUp.form.passwordConfirmationLabel",
  phone: "landing:subscriberSignUp.form.phoneLabel",
} as const;

const REGEXP_SPECIAL_CHARACTERS = /[.*+?^${}()|[\]\\]/g;

const escapeRegExp = (text: string): string =>
  text.replace(REGEXP_SPECIAL_CHARACTERS, "\\$&");

export type SubscriberSignUpField = keyof typeof FIELD_LABEL_KEY;

export interface SubscriberSignUpFormPageObject {
  readonly blurField: (field: SubscriberSignUpField) => Promise<void>;
  readonly clearAndType: (
    field: SubscriberSignUpField,
    value: string,
  ) => Promise<void>;
  readonly clickShowPassword: () => Promise<void>;
  readonly clickSubmit: () => Promise<void>;
  readonly getField: (field: SubscriberSignUpField) => HTMLElement;
  readonly getStrengthStatus: () => HTMLElement;
  readonly getSubmitButton: () => HTMLElement;
  readonly typeInto: (
    field: SubscriberSignUpField,
    value: string,
  ) => Promise<void>;
}

export const createSubscriberSignUpFormPage =
  (): SubscriberSignUpFormPageObject => {
    const user = userEvent.setup();

    // Required labels end with a decorative "*", so the label text is matched
    // whole, with that optional mark.
    const getField = (field: SubscriberSignUpField): HTMLElement =>
      screen.getByLabelText(
        new RegExp(`^${escapeRegExp(testI18n.t(FIELD_LABEL_KEY[field]))}\\*?$`),
      );
    const getSubmitButton = (): HTMLElement =>
      screen.getByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("landing:subscriberSignUp.form.submitAction"),
      });

    return {
      blurField: async (field: SubscriberSignUpField): Promise<void> => {
        await user.click(getField(field));
        await user.tab();
      },
      clearAndType: async (
        field: SubscriberSignUpField,
        value: string,
      ): Promise<void> => {
        await user.clear(getField(field));
        await user.type(getField(field), value);
      },
      clickShowPassword: async (): Promise<void> => {
        const [passwordShowButton] = screen.getAllByRole(ARIA_ROLE.BUTTON, {
          name: testI18n.t("common:password.showAction"),
        });
        await user.click(passwordShowButton as HTMLElement);
      },
      clickSubmit: async (): Promise<void> => {
        await user.click(getSubmitButton());
      },
      getField,
      getStrengthStatus: (): HTMLElement => screen.getByRole(ARIA_ROLE.STATUS),
      getSubmitButton,
      typeInto: async (
        field: SubscriberSignUpField,
        value: string,
      ): Promise<void> => {
        await user.type(getField(field), value);
      },
    };
  };
