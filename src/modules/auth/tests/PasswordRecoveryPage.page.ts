import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE, type ValidationMessageKey } from "@/constants";
import { testI18n } from "@/test-utils/testI18n";
import type { Nullable } from "@/types";

// The recovery route is lazy; its first load in a run can exceed 1 s.
const LAZY_PAGE_TIMEOUT_MS = 4_000;

export interface PasswordRecoveryPageObject {
  readonly findServerAlert: () => Promise<HTMLElement>;
  readonly findSentNotice: () => Promise<HTMLElement>;
  readonly findTitle: () => Promise<HTMLElement>;
  readonly getEmailInput: () => HTMLElement;
  readonly getRecaptcha: () => HTMLElement;
  readonly getSubmitButton: () => HTMLElement;
  readonly getCooldownButton: (seconds: number) => HTMLElement;
  readonly queryFieldErrors: (
    validationKey: ValidationMessageKey,
  ) => HTMLElement[];
  readonly querySentNotice: () => Nullable<HTMLElement>;
  readonly solveRecaptcha: () => Promise<void>;
  readonly submit: () => Promise<void>;
  readonly typeEmail: (email: string) => Promise<void>;
}

export const createPasswordRecoveryPage = (
  advanceTimers?: (milliseconds: number) => void,
): PasswordRecoveryPageObject => {
  const user = userEvent.setup(advanceTimers ? { advanceTimers } : undefined);

  const getEmailInput = (): HTMLElement =>
    screen.getByLabelText(testI18n.t("auth.passwordRecovery.emailLabel"));
  // RecaptchaField is replaced by a test double that emits a token on click.
  const getRecaptcha = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("auth.signIn.recaptchaLabel"),
    });
  const getSubmitButton = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("auth.passwordRecovery.submitAction"),
    });
  const sentNoticeText = testI18n.t("auth.passwordReset.requestSent");

  return {
    findSentNotice: (): Promise<HTMLElement> =>
      screen.findByText(sentNoticeText, {}, { timeout: LAZY_PAGE_TIMEOUT_MS }),
    findServerAlert: (): Promise<HTMLElement> =>
      screen.findByRole(ARIA_ROLE.ALERT, {}, { timeout: LAZY_PAGE_TIMEOUT_MS }),
    findTitle: (): Promise<HTMLElement> =>
      screen.findByRole(
        ARIA_ROLE.HEADING,
        { level: 1, name: testI18n.t("auth.passwordRecovery.title") },
        { timeout: LAZY_PAGE_TIMEOUT_MS },
      ),
    getCooldownButton: (seconds: number): HTMLElement =>
      screen.getByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("auth.passwordRecovery.cooldownLabel", {
          count: seconds,
        }),
      }),
    getEmailInput,
    getRecaptcha,
    getSubmitButton,
    queryFieldErrors: (validationKey: ValidationMessageKey): HTMLElement[] =>
      screen.queryAllByText(testI18n.t(`validation:${validationKey}`)),
    querySentNotice: (): Nullable<HTMLElement> =>
      screen.queryByText(sentNoticeText),
    solveRecaptcha: async (): Promise<void> => {
      await user.click(getRecaptcha());
    },
    submit: async (): Promise<void> => {
      await user.click(getSubmitButton());
    },
    typeEmail: async (email: string): Promise<void> => {
      await user.type(getEmailInput(), email);
    },
  };
};
