import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE, type ValidationMessageKey } from "@/constants";
import { testI18n } from "@/test-utils/testI18n";
import { CURRENT_PATH_TEST_ID } from "./CurrentPathProbe";

// The sign-in route is lazy; its first load in a run can exceed 1 s.
const LAZY_PAGE_TIMEOUT_MS = 2_000;

export interface SignInPageObject {
  readonly blurActiveField: () => Promise<void>;
  readonly clearEmail: () => Promise<void>;
  readonly doubleClickSubmit: () => Promise<void>;
  readonly findCurrentPath: () => Promise<string>;
  readonly findServerAlert: () => Promise<HTMLElement>;
  readonly findTitle: () => Promise<HTMLElement>;
  readonly getEmailInput: () => HTMLElement;
  readonly getPasswordInput: () => HTMLElement;
  readonly getPasswordToggle: () => HTMLElement;
  readonly getRecaptcha: () => HTMLElement;
  readonly getSubmitButton: () => HTMLElement;
  readonly getSubmittingButton: () => HTMLElement;
  readonly queryFieldErrors: (
    validationKey: ValidationMessageKey,
  ) => HTMLElement[];
  readonly solveRecaptcha: () => Promise<void>;
  readonly submit: () => Promise<void>;
  readonly togglePassword: () => Promise<void>;
  readonly typeEmail: (email: string) => Promise<void>;
  readonly typePassword: (password: string) => Promise<void>;
}

export const createSignInPage = (): SignInPageObject => {
  const user = userEvent.setup();

  const getEmailInput = (): HTMLElement =>
    screen.getByLabelText(testI18n.t("auth.signIn.emailLabel"));
  const getPasswordInput = (): HTMLElement =>
    screen.getByLabelText(testI18n.t("auth.signIn.passwordLabel"));
  const getPasswordToggle = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: new RegExp(
        `^(${testI18n.t("auth.password.show")}|${testI18n.t("auth.password.hide")})$`,
      ),
    });
  // RecaptchaField is replaced by a test double that emits a token on click.
  const getRecaptcha = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("auth.signIn.recaptchaLabel"),
    });
  const getSubmitButton = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("auth.signIn.submitAction"),
    });
  const getSubmittingButton = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("auth.signIn.submittingLabel"),
    });

  return {
    blurActiveField: async (): Promise<void> => {
      await user.tab();
    },
    clearEmail: async (): Promise<void> => {
      await user.clear(getEmailInput());
    },
    doubleClickSubmit: async (): Promise<void> => {
      await user.dblClick(getSubmitButton());
    },
    findCurrentPath: async (): Promise<string> =>
      (await screen.findByTestId(CURRENT_PATH_TEST_ID)).textContent ?? "",
    findServerAlert: (): Promise<HTMLElement> =>
      screen.findByRole(ARIA_ROLE.ALERT, {}, { timeout: LAZY_PAGE_TIMEOUT_MS }),
    findTitle: (): Promise<HTMLElement> =>
      screen.findByRole(
        ARIA_ROLE.HEADING,
        { level: 1, name: testI18n.t("auth.signIn.title") },
        { timeout: LAZY_PAGE_TIMEOUT_MS },
      ),
    getEmailInput,
    getPasswordInput,
    getPasswordToggle,
    getRecaptcha,
    getSubmitButton,
    getSubmittingButton,
    queryFieldErrors: (validationKey: ValidationMessageKey): HTMLElement[] =>
      screen.queryAllByText(testI18n.t(`validation:${validationKey}`)),
    solveRecaptcha: async (): Promise<void> => {
      await user.click(getRecaptcha());
    },
    submit: async (): Promise<void> => {
      await user.click(getSubmitButton());
    },
    togglePassword: async (): Promise<void> => {
      await user.click(getPasswordToggle());
    },
    typeEmail: async (email: string): Promise<void> => {
      await user.type(getEmailInput(), email);
    },
    typePassword: async (password: string): Promise<void> => {
      await user.type(getPasswordInput(), password);
    },
  };
};
