import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE } from "@/constants";
import { testI18n } from "@/test-utils/testI18n";
import type { Nullable } from "@/types";

export interface EmailVerificationPendingBannerPageObject {
  readonly clickResend: () => Promise<void>;
  readonly findPendingMessage: () => Promise<HTMLElement>;
  readonly getResendButton: () => HTMLElement;
  readonly queryPendingMessage: () => Nullable<HTMLElement>;
}

export const createEmailVerificationPendingBannerPage =
  (): EmailVerificationPendingBannerPageObject => {
    const user = userEvent.setup();
    const pendingText = testI18n.t("customer:signUp.verification.pending");
    const getResendButton = (): HTMLElement =>
      screen.getByRole(ARIA_ROLE.BUTTON, {
        name: testI18n.t("customer:signUp.verification.resendAction"),
      });

    return {
      clickResend: async (): Promise<void> => {
        await user.click(getResendButton());
      },
      findPendingMessage: (): Promise<HTMLElement> =>
        screen.findByText(pendingText),
      getResendButton,
      queryPendingMessage: (): Nullable<HTMLElement> =>
        screen.queryByText(pendingText),
    };
  };
