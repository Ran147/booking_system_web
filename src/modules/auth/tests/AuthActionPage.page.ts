import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE } from "@/constants";
import { testI18n } from "@/test-utils/testI18n";

// The action route is lazy; its first load in a run can exceed 1 s.
const LAZY_PAGE_TIMEOUT_MS = 4_000;

export interface AuthActionPageObject {
  readonly clickRetry: () => Promise<void>;
  readonly findAlert: () => Promise<HTMLElement>;
  readonly findSignInLink: () => Promise<HTMLElement>;
  readonly findSuccess: () => Promise<HTMLElement>;
  readonly findTitle: () => Promise<HTMLElement>;
}

export const createAuthActionPage = (): AuthActionPageObject => {
  const user = userEvent.setup();

  return {
    clickRetry: async (): Promise<void> => {
      await user.click(
        await screen.findByRole(
          ARIA_ROLE.BUTTON,
          { name: testI18n.t("auth.emailVerification.retryAction") },
          { timeout: LAZY_PAGE_TIMEOUT_MS },
        ),
      );
    },
    findAlert: (): Promise<HTMLElement> =>
      screen.findByRole(ARIA_ROLE.ALERT, {}, { timeout: LAZY_PAGE_TIMEOUT_MS }),
    findSignInLink: (): Promise<HTMLElement> =>
      screen.findByRole(
        "link",
        { name: testI18n.t("auth.emailVerification.signInAction") },
        { timeout: LAZY_PAGE_TIMEOUT_MS },
      ),
    findSuccess: (): Promise<HTMLElement> =>
      screen.findByText(
        testI18n.t("auth.emailVerification.success"),
        {},
        { timeout: LAZY_PAGE_TIMEOUT_MS },
      ),
    findTitle: (): Promise<HTMLElement> =>
      screen.findByRole(
        ARIA_ROLE.HEADING,
        { level: 1, name: testI18n.t("auth.emailVerification.title") },
        { timeout: LAZY_PAGE_TIMEOUT_MS },
      ),
  };
};
