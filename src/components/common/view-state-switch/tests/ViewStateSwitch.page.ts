import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ARIA_ROLE } from "@/shared/constants";
import { testI18n } from "@/shared/test-utils/testI18n";
import type { Nullable } from "@/shared/types";

export interface ViewStateSwitchPageObject {
  clickRetry: () => Promise<void>;
  queryErrorAlert: () => Nullable<HTMLElement>;
  queryLoadingStatus: () => Nullable<HTMLElement>;
  queryText: (text: string) => Nullable<HTMLElement>;
}

export const createViewStateSwitchPage = (): ViewStateSwitchPageObject => {
  const user = userEvent.setup();

  return {
    clickRetry: async (): Promise<void> => {
      await user.click(
        screen.getByRole(ARIA_ROLE.BUTTON, {
          name: testI18n.t("actions.retry"),
        }),
      );
    },
    queryErrorAlert: (): Nullable<HTMLElement> =>
      screen.queryByRole(ARIA_ROLE.ALERT),
    queryLoadingStatus: (): Nullable<HTMLElement> =>
      screen.queryByRole(ARIA_ROLE.STATUS, {
        name: testI18n.t("status.loading"),
      }),
    queryText: (text: string): Nullable<HTMLElement> =>
      screen.queryByText(text),
  };
};
