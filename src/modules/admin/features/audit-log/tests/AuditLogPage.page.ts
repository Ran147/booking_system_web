import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/shared/test-utils/testI18n";
import type { Nullable } from "@/types";

export interface AuditLogPageObject {
  readonly clickClearFilters: () => Promise<void>;
  readonly clickCloseModal: () => Promise<void>;
  readonly clickNextPage: () => Promise<void>;
  readonly clickPreviousPage: () => Promise<void>;
  readonly clickRetry: () => Promise<void>;
  readonly clickViewDetail: (rowIndex?: number) => Promise<void>;
  readonly enterFromDate: (dateText: string) => Promise<void>;
  readonly enterToDate: (dateText: string) => Promise<void>;
  readonly findDetailModal: () => Promise<HTMLElement>;
  readonly findEmptyMessage: () => Promise<HTMLElement>;
  readonly findErrorAlert: () => Promise<HTMLElement>;
  readonly findFilteredEmptyMessage: () => Promise<HTMLElement>;
  readonly findInvalidActionTypeWarning: () => Promise<HTMLElement>;
  readonly findInvalidDateRangeError: () => Promise<HTMLElement>;
  readonly findPaginationSummary: () => Promise<HTMLElement>;
  readonly findRows: () => Promise<HTMLElement[]>;
  readonly queryDetailModal: () => Nullable<HTMLElement>;
  readonly selectActionType: (label: string) => Promise<void>;
}

export const createAuditLogPage = (): AuditLogPageObject => {
  const user = userEvent.setup();

  const findRows = async (): Promise<HTMLElement[]> => {
    const table = await screen.findByRole("table");
    return within(table).getAllByRole("row").slice(1);
  };

  const clickButton = async (name: string): Promise<void> => {
    await user.click(await screen.findByRole("button", { name }));
  };

  return {
    clickClearFilters: (): Promise<void> =>
      clickButton(testI18n.t("admin:auditLog.filters.clear")),
    clickCloseModal: (): Promise<void> =>
      clickButton(testI18n.t("admin:auditLog.detail.close")),
    clickNextPage: (): Promise<void> =>
      clickButton(testI18n.t("common:pagination.nextAction")),
    clickPreviousPage: (): Promise<void> =>
      clickButton(testI18n.t("common:pagination.previousAction")),
    clickRetry: (): Promise<void> =>
      clickButton(testI18n.t("admin:auditLog.list.retryAction")),
    clickViewDetail: async (rowIndex = 0): Promise<void> => {
      const rows = await findRows();
      const targetRow = rows[rowIndex];
      if (!targetRow) {
        throw new Error(`Row at index ${rowIndex} not found.`);
      }
      const button = within(targetRow).getByRole("button", {
        name: new RegExp(testI18n.t("admin:auditLog.table.viewDetail")),
      });
      await user.click(button);
    },
    enterFromDate: async (dateText: string): Promise<void> => {
      const input = await screen.findByLabelText(
        testI18n.t("admin:auditLog.filters.from"),
      );
      fireEvent.change(input, { target: { value: dateText } });
    },
    enterToDate: async (dateText: string): Promise<void> => {
      const input = await screen.findByLabelText(
        testI18n.t("admin:auditLog.filters.to"),
      );
      fireEvent.change(input, { target: { value: dateText } });
    },
    findDetailModal: (): Promise<HTMLElement> =>
      screen.findByRole("dialog", {
        name: testI18n.t("admin:auditLog.detail.title"),
      }),
    findEmptyMessage: (): Promise<HTMLElement> =>
      screen.findByText(testI18n.t("admin:auditLog.list.empty")),
    findErrorAlert: (): Promise<HTMLElement> => screen.findByRole("alert"),
    findFilteredEmptyMessage: (): Promise<HTMLElement> =>
      screen.findByText(testI18n.t("admin:auditLog.list.emptyFiltered")),
    findInvalidActionTypeWarning: (): Promise<HTMLElement> =>
      screen.findByText(testI18n.t("admin:auditLog.filters.invalidActionType")),
    findInvalidDateRangeError: (): Promise<HTMLElement> =>
      screen.findByText(testI18n.t("admin:auditLog.filters.invalidDateRange")),
    findPaginationSummary: (): Promise<HTMLElement> =>
      screen.findByText(/Página \d+/i),
    findRows,
    queryDetailModal: (): Nullable<HTMLElement> =>
      screen.queryByRole("dialog", {
        name: testI18n.t("admin:auditLog.detail.title"),
      }),
    selectActionType: async (label: string): Promise<void> => {
      const select = await screen.findByLabelText(
        testI18n.t("admin:auditLog.filters.actionType"),
      );
      await user.selectOptions(select, label);
    },
  };
};
