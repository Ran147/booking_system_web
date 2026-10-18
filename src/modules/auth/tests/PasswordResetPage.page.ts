import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE, type ValidationMessageKey } from "@/constants";
import { testI18n } from "@/test-utils/testI18n";
import type { Nullable } from "@/types";

// The reset route is lazy; its first load in a run can exceed 1 s.
const LAZY_PAGE_TIMEOUT_MS = 4_000;

export interface PasswordResetPageObject {
  readonly blurActiveField: () => Promise<void>;
  readonly findServerAlert: () => Promise<HTMLElement>;
  readonly findTitle: () => Promise<HTMLElement>;
  readonly getConfirmationInput: () => HTMLElement;
  readonly getNewPasswordInput: () => HTMLElement;
  readonly getRuleItem: (
    ruleId: "digit" | "lowercase" | "minimumLength" | "symbol" | "uppercase",
  ) => HTMLElement;
  readonly getSubmitButton: () => HTMLElement;
  readonly queryFieldErrors: (
    validationKey: ValidationMessageKey,
  ) => HTMLElement[];
  readonly queryNewPasswordInput: () => Nullable<HTMLElement>;
  readonly toggleBothPasswords: () => Promise<void>;
  readonly typeConfirmation: (password: string) => Promise<void>;
  readonly typeNewPassword: (password: string) => Promise<void>;
  readonly submit: () => Promise<void>;
  readonly clickRetry: () => Promise<void>;
  readonly getRequestNewLink: () => HTMLElement;
}

export const createPasswordResetPage = (): PasswordResetPageObject => {
  const user = userEvent.setup();

  const getNewPasswordInput = (): HTMLElement =>
    screen.getByLabelText(testI18n.t("auth.passwordReset.newPasswordLabel"));
  const getConfirmationInput = (): HTMLElement =>
    screen.getByLabelText(testI18n.t("auth.passwordReset.confirmationLabel"));
  const getSubmitButton = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("auth.passwordReset.submitAction"),
    });
  const getToggles = (): HTMLElement[] =>
    screen.getAllByRole(ARIA_ROLE.BUTTON, {
      name: new RegExp(
        `^(${testI18n.t("auth.password.show")}|${testI18n.t("auth.password.hide")})$`,
      ),
    });

  return {
    blurActiveField: async (): Promise<void> => {
      await user.tab();
    },
    clickRetry: async (): Promise<void> => {
      await user.click(
        screen.getByRole(ARIA_ROLE.BUTTON, {
          name: testI18n.t("auth.passwordReset.retryAction"),
        }),
      );
    },
    findServerAlert: (): Promise<HTMLElement> =>
      screen.findByRole(ARIA_ROLE.ALERT, {}, { timeout: LAZY_PAGE_TIMEOUT_MS }),
    findTitle: (): Promise<HTMLElement> =>
      screen.findByRole(
        ARIA_ROLE.HEADING,
        { level: 1, name: testI18n.t("auth.passwordReset.title") },
        { timeout: LAZY_PAGE_TIMEOUT_MS },
      ),
    getConfirmationInput,
    getNewPasswordInput,
    getRequestNewLink: (): HTMLElement =>
      screen.getByRole("link", {
        name: testI18n.t("auth.passwordReset.requestNewLinkAction"),
      }),
    getRuleItem: (ruleId): HTMLElement => {
      const ruleText = testI18n.t(`auth.password.rules.${ruleId}`, {
        count: 8,
      });
      const ruleItem = screen.getByText(ruleText).closest("li");
      if (!ruleItem) throw new Error(`Rule item not found: ${ruleId}`);
      return ruleItem;
    },
    getSubmitButton,
    queryFieldErrors: (validationKey: ValidationMessageKey): HTMLElement[] =>
      screen.queryAllByText(testI18n.t(`validation:${validationKey}`)),
    queryNewPasswordInput: (): Nullable<HTMLElement> =>
      screen.queryByLabelText(
        testI18n.t("auth.passwordReset.newPasswordLabel"),
      ),
    submit: async (): Promise<void> => {
      await user.click(getSubmitButton());
    },
    toggleBothPasswords: async (): Promise<void> => {
      for (const toggle of getToggles()) await user.click(toggle);
    },
    typeConfirmation: async (password: string): Promise<void> => {
      await user.type(getConfirmationInput(), password);
    },
    typeNewPassword: async (password: string): Promise<void> => {
      await user.type(getNewPasswordInput(), password);
    },
  };
};
