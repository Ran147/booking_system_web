import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STRING } from "@/constants";
import { CURRENT_PATH_TEST_ID } from "@/modules/auth/tests/CurrentPathProbe";
import { testI18n } from "@/test-utils";
import type { Nullable } from "@/types";

export const PORTAL_CONTENT_TEXT = "Business portal content";

export interface BusinessStatusGatePageObject {
  readonly clickRetry: () => Promise<void>;
  readonly clickSignOut: () => Promise<void>;
  readonly findCurrentPath: () => Promise<string>;
  readonly findErrorAlert: () => Promise<HTMLElement>;
  readonly findPortalContent: () => Promise<HTMLElement>;
  readonly findScreenTitle: (title: string) => Promise<HTMLElement>;
  readonly queryNavigation: () => Nullable<HTMLElement>;
  readonly queryPortalContent: () => Nullable<HTMLElement>;
}

export const createBusinessStatusGatePage =
  (): BusinessStatusGatePageObject => {
    const user = userEvent.setup();

    return {
      clickRetry: async (): Promise<void> => {
        await user.click(
          screen.getByRole("button", {
            name: testI18n.t("business:layout.statusGate.retryAction"),
          }),
        );
      },
      clickSignOut: async (): Promise<void> => {
        await user.click(
          screen.getByRole("button", {
            name: testI18n.t("business:layout.statusGate.signOutAction"),
          }),
        );
      },
      findCurrentPath: async (): Promise<string> =>
        (await screen.findByTestId(CURRENT_PATH_TEST_ID)).textContent ??
        STRING.EMPTY,
      findErrorAlert: (): Promise<HTMLElement> => screen.findByRole("alert"),
      findPortalContent: (): Promise<HTMLElement> =>
        screen.findByText(PORTAL_CONTENT_TEXT),
      findScreenTitle: (title: string): Promise<HTMLElement> =>
        screen.findByRole("heading", { level: 1, name: title }),
      queryNavigation: (): Nullable<HTMLElement> =>
        screen.queryByRole("navigation"),
      queryPortalContent: (): Nullable<HTMLElement> =>
        screen.queryByText(PORTAL_CONTENT_TEXT),
    };
  };
