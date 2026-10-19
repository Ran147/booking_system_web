import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/shared/test-utils/testI18n";

export interface MyBookingsPageObject {
  readonly clickHistoryTab: () => Promise<void>;
  readonly clickNextPage: () => Promise<void>;
  readonly clickRetry: () => Promise<void>;
  readonly findEmptyMessage: (message: string) => Promise<HTMLElement>;
  readonly findErrorAlert: () => Promise<HTMLElement>;
  readonly findPaginationSummary: () => Promise<HTMLElement>;
  readonly findRows: () => Promise<HTMLElement[]>;
}

export const createMyBookingsPage = (): MyBookingsPageObject => {
  const user = userEvent.setup();

  const findRows = async (): Promise<HTMLElement[]> => {
    const table = await screen.findByRole("table", {
      name: testI18n.t("customer:myBookings.list.label"),
    });
    return within(table).getAllByRole("row").slice(1);
  };

  const clickButton = async (name: string): Promise<void> => {
    await user.click(await screen.findByRole("button", { name }));
  };

  return {
    clickHistoryTab: async (): Promise<void> => {
      await user.click(
        await screen.findByRole("tab", {
          name: testI18n.t("customer:myBookings.tabs.history"),
        }),
      );
    },
    clickNextPage: (): Promise<void> =>
      clickButton(testI18n.t("common:pagination.nextAction")),
    clickRetry: (): Promise<void> =>
      clickButton(testI18n.t("customer:myBookings.retryAction")),
    findEmptyMessage: (message: string): Promise<HTMLElement> =>
      screen.findByText(message),
    findErrorAlert: (): Promise<HTMLElement> => screen.findByRole("alert"),
    findPaginationSummary: (): Promise<HTMLElement> =>
      screen.findByText(/Página \d+/),
    findRows,
  };
};
