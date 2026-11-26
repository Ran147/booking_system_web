import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE } from "@/constants";
import { testI18n } from "@/test-utils/testI18n";

// The first render of a test run can be slow (i18n and the router load).
const PAGE_TIMEOUT_MS = 4_000;

const FIELD_LABEL_KEY = Object.freeze({
  email: "customer:signUp.form.emailLabel",
  fullName: "customer:signUp.form.fullNameLabel",
  password: "customer:signUp.form.passwordLabel",
  phone: "customer:signUp.form.phoneLabel",
} as const);

export type CustomerSignUpField = keyof typeof FIELD_LABEL_KEY;

export interface CustomerSignUpPageObject {
  readonly blurField: () => Promise<void>;
  readonly clickSubmit: () => Promise<void>;
  readonly doubleClickSubmit: () => Promise<void>;
  readonly findTitle: () => Promise<HTMLElement>;
  readonly getField: (field: CustomerSignUpField) => HTMLElement;
  readonly getRecaptcha: () => HTMLElement;
  readonly getSubmitButton: () => HTMLElement;
  readonly solveRecaptcha: () => Promise<void>;
  readonly typeInto: (
    field: CustomerSignUpField,
    value: string,
  ) => Promise<void>;
}

export const createCustomerSignUpPage = (): CustomerSignUpPageObject => {
  const user = userEvent.setup();
  const getField = (field: CustomerSignUpField): HTMLElement =>
    screen.getByLabelText(testI18n.t(FIELD_LABEL_KEY[field]), {
      exact: false,
      selector: "input",
    });
  const getSubmitButton = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("customer:signUp.form.submitAction"),
    });
  const getRecaptcha = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("customer:signUp.form.recaptchaLabel"),
    });

  return {
    blurField: async (): Promise<void> => {
      await user.tab();
    },
    clickSubmit: async (): Promise<void> => {
      await user.click(getSubmitButton());
    },
    doubleClickSubmit: async (): Promise<void> => {
      await user.dblClick(getSubmitButton());
    },
    findTitle: (): Promise<HTMLElement> =>
      screen.findByRole(
        ARIA_ROLE.HEADING,
        { level: 1, name: testI18n.t("customer:signUp.title") },
        { timeout: PAGE_TIMEOUT_MS },
      ),
    getField,
    getRecaptcha,
    getSubmitButton,
    solveRecaptcha: async (): Promise<void> => {
      await user.click(getRecaptcha());
    },
    typeInto: async (field, value): Promise<void> => {
      await user.type(getField(field), value);
    },
  };
};
