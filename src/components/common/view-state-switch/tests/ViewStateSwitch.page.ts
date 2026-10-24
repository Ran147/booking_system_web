import { screen } from "@testing-library/react";
import { ARIA_ROLE } from "@/shared/constants";
import { testI18n } from "@/shared/test-utils/testI18n";
import type { Nullable } from "@/shared/types";

export interface ViewStateSwitchPageObject {
  queryErrorAlert: () => Nullable<HTMLElement>;
  queryLoadingStatus: () => Nullable<HTMLElement>;
  queryText: (text: string) => Nullable<HTMLElement>;
}

export const createViewStateSwitchPage = (): ViewStateSwitchPageObject => ({
  queryErrorAlert: (): Nullable<HTMLElement> =>
    screen.queryByRole(ARIA_ROLE.ALERT),
  queryLoadingStatus: (): Nullable<HTMLElement> =>
    screen.queryByRole(ARIA_ROLE.STATUS, {
      name: testI18n.t("status.loading"),
    }),
  queryText: (text: string): Nullable<HTMLElement> => screen.queryByText(text),
});
