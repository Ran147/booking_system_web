import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE, type ValidationMessageKey } from "@/constants";
import { testI18n } from "@/test-utils/testI18n";
import type { Nullable } from "@/types";

const LAZY_PAGE_TIMEOUT_MS = 4_000;

export interface AcceptInvitationPageObject {
  readonly blurActiveField: () => Promise<void>;
  readonly clickRetry: () => Promise<void>;
  readonly findBusinessContext: (
    businessName: string,
    email: string,
  ) => Promise<HTMLElement>;
  readonly findServerAlert: () => Promise<HTMLElement>;
  readonly findTitle: () => Promise<HTMLElement>;
  readonly getConfirmationInput: () => HTMLElement;
  readonly getNewPasswordInput: () => HTMLElement;
  readonly getSignInLink: () => HTMLElement;
  readonly getSubmitButton: () => HTMLElement;
  readonly queryFieldErrors: (
    validationKey: ValidationMessageKey,
  ) => HTMLElement[];
  readonly queryNewPasswordInput: () => Nullable<HTMLElement>;
  readonly submit: () => Promise<void>;
  readonly typeConfirmation: (password: string) => Promise<void>;
  readonly typeNewPassword: (password: string) => Promise<void>;
}

export const createAcceptInvitationPage = (): AcceptInvitationPageObject => {
  const user = userEvent.setup();

  const getNewPasswordInput = (): HTMLElement =>
    screen.getByLabelText(testI18n.t("auth.invitation.newPasswordLabel"));
  const getConfirmationInput = (): HTMLElement =>
    screen.getByLabelText(testI18n.t("auth.invitation.confirmationLabel"));
  const getSubmitButton = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("auth.invitation.submitAction"),
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
    findBusinessContext: (
      businessName: string,
      email: string,
    ): Promise<HTMLElement> =>
      screen.findByText(
        testI18n.t("auth.invitation.businessContext", {
          businessName,
          email,
        }),
        {},
        { timeout: LAZY_PAGE_TIMEOUT_MS },
      ),
    findServerAlert: (): Promise<HTMLElement> =>
      screen.findByRole(ARIA_ROLE.ALERT, {}, { timeout: LAZY_PAGE_TIMEOUT_MS }),
    findTitle: (): Promise<HTMLElement> =>
      screen.findByRole(
        ARIA_ROLE.HEADING,
        { level: 1, name: testI18n.t("auth.invitation.title") },
        { timeout: LAZY_PAGE_TIMEOUT_MS },
      ),
    getConfirmationInput,
    getNewPasswordInput,
    getSignInLink: (): HTMLElement =>
      screen.getByRole("link", {
        name: testI18n.t("auth.invitation.signInAction"),
      }),
    getSubmitButton,
    queryFieldErrors: (validationKey: ValidationMessageKey): HTMLElement[] =>
      screen.queryAllByText(testI18n.t(`validation:${validationKey}`)),
    queryNewPasswordInput: (): Nullable<HTMLElement> =>
      screen.queryByLabelText(testI18n.t("auth.invitation.newPasswordLabel")),
    submit: async (): Promise<void> => {
      await user.click(getSubmitButton());
    },
    typeConfirmation: async (password: string): Promise<void> => {
      await user.type(getConfirmationInput(), password);
    },
    typeNewPassword: async (password: string): Promise<void> => {
      await user.type(getNewPasswordInput(), password);
    },
  };
};
