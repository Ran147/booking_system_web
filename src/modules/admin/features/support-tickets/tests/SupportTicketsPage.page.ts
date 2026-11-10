import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/shared/test-utils/testI18n";
import type { Nullable } from "@/types";

export interface SupportTicketsPageObject {
  readonly clickClearFilter: () => Promise<void>;
  readonly clickCloseDetail: () => Promise<void>;
  readonly clickNextPage: () => Promise<void>;
  readonly clickPreviousPage: () => Promise<void>;
  readonly clickRetry: () => Promise<void>;
  readonly clickViewDetail: (rowIndex?: number) => Promise<void>;
  readonly findDetailModal: () => Promise<HTMLElement>;
  readonly findEmptyMessage: () => Promise<HTMLElement>;
  readonly findErrorAlert: () => Promise<HTMLElement>;
  readonly findPaginationSummary: () => Promise<HTMLElement>;
  readonly findRows: () => Promise<HTMLElement[]>;
  readonly queryDetailModal: () => Nullable<HTMLElement>;
  readonly selectStatusFilter: (statusLabel: string) => Promise<void>;
}

export const createSupportTicketsPage = (): SupportTicketsPageObject => {
  const user = userEvent.setup();

  const findRows = async (): Promise<HTMLElement[]> => {
    const table = await screen.findByRole("table");
    return within(table).getAllByRole("row").slice(1);
  };

  const clickButton = async (name: string): Promise<void> => {
    await user.click(await screen.findByRole("button", { name }));
  };

  return {
    clickClearFilter: (): Promise<void> =>
      clickButton(testI18n.t("admin:supportTickets.filters.clear")),
    clickCloseDetail: (): Promise<void> =>
      clickButton(testI18n.t("admin:supportTickets.detail.close")),
    clickNextPage: (): Promise<void> =>
      clickButton(testI18n.t("common:pagination.nextAction")),
    clickPreviousPage: (): Promise<void> =>
      clickButton(testI18n.t("common:pagination.previousAction")),
    clickRetry: (): Promise<void> =>
      clickButton(testI18n.t("admin:supportTickets.list.retryAction")),
    clickViewDetail: async (rowIndex = 0): Promise<void> => {
      const rows = await findRows();
      const targetRow = rows[rowIndex];
      if (!targetRow) {
        throw new Error(`Row at index ${rowIndex} not found.`);
      }
      const button = within(targetRow).getByRole("button", {
        name: new RegExp(testI18n.t("admin:supportTickets.table.viewDetail")),
      });
      await user.click(button);
    },
    findDetailModal: (): Promise<HTMLElement> =>
      screen.findByRole("dialog", {
        name: testI18n.t("admin:supportTickets.detail.title"),
      }),
    findEmptyMessage: (): Promise<HTMLElement> =>
      screen.findByText(testI18n.t("admin:supportTickets.list.empty")),
    findErrorAlert: (): Promise<HTMLElement> => screen.findByRole("alert"),
    findPaginationSummary: (): Promise<HTMLElement> =>
      screen.findByText(/Página \d+/i),
    findRows,
    queryDetailModal: (): Nullable<HTMLElement> =>
      screen.queryByRole("dialog", {
        name: testI18n.t("admin:supportTickets.detail.title"),
      }),
    selectStatusFilter: async (statusLabel: string): Promise<void> => {
      const select = await screen.findByLabelText(
        testI18n.t("admin:supportTickets.filters.statusLabel"),
      );
      await user.selectOptions(select, statusLabel);
    },
  };
};
