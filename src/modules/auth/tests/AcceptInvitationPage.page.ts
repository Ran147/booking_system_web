import { screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { testI18n } from "@/test-utils/testI18n";

export interface AcceptInvitationPageObject {
  readonly completeRecaptcha: () => Promise<void>;
  readonly findTitle: () => Promise<HTMLElement>;
  readonly getPasswordInput: () => HTMLElement;
  readonly getSubmitButton: () => HTMLElement;
  readonly querySubmitButton: () => ReturnType<typeof screen.queryByRole>;
  readonly submit: () => Promise<void>;
  readonly typeConfirmation: (value: string) => Promise<void>;
  readonly typePassword: (value: string) => Promise<void>;
}

const RECAPTCHA_BUTTON_LABEL = "Complete reCAPTCHA";

export const createAcceptInvitationPage = (
  user: UserEvent = userEvent.setup(),
): AcceptInvitationPageObject => {
  const getPasswordInput = (): HTMLElement =>
    screen.getByLabelText(testI18n.t("auth.invitation.newPasswordLabel"));

  const getConfirmationInput = (): HTMLElement =>
    screen.getByLabelText(testI18n.t("auth.invitation.confirmationLabel"));

  const getSubmitButton = (): HTMLElement =>
    screen.getByRole("button", {
      name: new RegExp(
        `${testI18n.t("auth.invitation.submitAction")}|${testI18n.t("auth.invitation.submittingLabel")}`,
        "i",
      ),
    });

  return {
    completeRecaptcha: async (): Promise<void> => {
      const button = screen.getByRole("button", {
        name: RECAPTCHA_BUTTON_LABEL,
      });
      await user.click(button);
    },
    findTitle: (): Promise<HTMLElement> =>
      screen.findByRole("heading", {
        name: testI18n.t("auth.invitation.title"),
      }),
    getPasswordInput,
    getSubmitButton,
    querySubmitButton: (): ReturnType<typeof screen.queryByRole> =>
      screen.queryByRole("button", {
        name: testI18n.t("auth.invitation.submitAction"),
      }),
    submit: async (): Promise<void> => {
      await user.click(getSubmitButton());
    },
    typeConfirmation: async (value: string): Promise<void> => {
      const input = getConfirmationInput();
      await user.clear(input);
      if (value) {
        await user.type(input, value);
      }
      await waitFor(() => {
        if ((input as HTMLInputElement).value !== value) {
          throw new Error("Confirmation input value mismatch");
        }
      });
    },
    typePassword: async (value: string): Promise<void> => {
      const input = getPasswordInput();
      await user.clear(input);
      if (value) {
        await user.type(input, value);
      }
    },
  };
};
