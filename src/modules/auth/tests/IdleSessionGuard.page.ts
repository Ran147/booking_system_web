import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE } from "@/constants";
import { testI18n } from "@/test-utils/testI18n";
import type { Nullable } from "@/types";

export interface IdleSessionGuardPageObject {
  readonly clickSignOut: () => Promise<void>;
  readonly clickStayConnected: () => Promise<void>;
  readonly getStayConnectedButton: () => HTMLElement;
  readonly pressKey: () => Promise<void>;
  readonly queryWarning: () => Nullable<HTMLElement>;
  readonly readCurrentPath: () => string;
  readonly readSignOutReason: () => string;
}

export const CURRENT_PATH_TEST_ID = "idle-current-path";
export const SIGN_OUT_REASON_TEST_ID = "idle-sign-out-reason";

export const createIdleSessionGuardPage = (
  advanceTimers: (milliseconds: number) => void,
): IdleSessionGuardPageObject => {
  const user = userEvent.setup({ advanceTimers, delay: null });

  const getStayConnectedButton = (): HTMLElement =>
    screen.getByRole(ARIA_ROLE.BUTTON, {
      name: testI18n.t("auth.idle.stayConnectedAction"),
    });

  return {
    clickSignOut: async (): Promise<void> => {
      await user.click(
        screen.getByRole(ARIA_ROLE.BUTTON, {
          name: testI18n.t("auth.idle.signOutAction"),
        }),
      );
    },
    clickStayConnected: async (): Promise<void> => {
      await user.click(getStayConnectedButton());
    },
    getStayConnectedButton,
    pressKey: async (): Promise<void> => {
      await user.keyboard("a");
    },
    queryWarning: (): Nullable<HTMLElement> =>
      screen.queryByRole("dialog", {
        name: testI18n.t("auth.idle.warningTitle"),
      }),
    readCurrentPath: (): string =>
      screen.getByTestId(CURRENT_PATH_TEST_ID).textContent ?? "",
    readSignOutReason: (): string =>
      screen.getByTestId(SIGN_OUT_REASON_TEST_ID).textContent ?? "",
  };
};
