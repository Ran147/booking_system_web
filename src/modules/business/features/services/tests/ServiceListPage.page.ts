import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/shared/test-utils/testI18n";
import type { Nullable } from "@/types";

export interface ServiceListPageObject {
  readonly changeSearchTerm: (searchTerm: string) => Promise<void>;
  readonly changeStatusFilter: (statusValue: string) => Promise<void>;
  readonly clickClearFilters: () => Promise<void>;
  readonly clickCreateService: () => Promise<void>;
  readonly clickEditService: (serviceName?: string) => Promise<void>;
  readonly clickNextPage: () => Promise<void>;
  readonly clickPreviousPage: () => Promise<void>;
  readonly clickRetry: () => Promise<void>;
  readonly findColumnHeader: (name: string) => Promise<HTMLElement>;
  readonly findCreateServiceButton: () => Promise<HTMLElement>;
  readonly findEmptyStateDescription: () => Promise<HTMLElement>;
  readonly findEmptyStateTitle: () => Promise<HTMLElement>;
  readonly findErrorAlert: () => Promise<HTMLElement>;
  readonly findHeading: () => Promise<HTMLElement>;
  readonly findNextPageButton: () => Promise<HTMLElement>;
  readonly findNoResultsDescription: () => Promise<HTMLElement>;
  readonly findNoResultsTitle: () => Promise<HTMLElement>;
  readonly findPaginationSummary: () => Promise<HTMLElement>;
  readonly findPreviousPageButton: () => Promise<HTMLElement>;
  readonly findRowByName: (serviceName: string) => Promise<HTMLElement>;
  readonly findTable: () => Promise<HTMLElement>;
  readonly queryClearFiltersButton: () => Nullable<HTMLElement>;
  readonly queryReadOnlyAlert: () => Nullable<HTMLElement>;
  readonly queryRowByName: (serviceName: string) => Nullable<HTMLElement>;
}

export const createServiceListPage = (): ServiceListPageObject => {
  const user = userEvent.setup();

  const findHeading = (): Promise<HTMLElement> =>
    screen.findByRole("heading", {
      level: 1,
      name: testI18n.t("business:services.list.title"),
    });

  const findCreateServiceButton = async (): Promise<HTMLElement> => {
    const buttons = await screen.findAllByRole("button", {
      name: testI18n.t("business:services.list.createServiceAction"),
    });
    const firstButton = buttons[0];
    if (!firstButton) {
      throw new Error("Create service button not found");
    }
    return firstButton;
  };

  const clickCreateService = async (): Promise<void> => {
    const button = await findCreateServiceButton();
    await user.click(button);
  };

  const clickEditService = async (serviceName?: string): Promise<void> => {
    if (serviceName) {
      const row = await findRowByName(serviceName);
      const editButton = within(row).getByRole("button", {
        name: testI18n.t("business:services.list.editAction"),
      });
      await user.click(editButton);
      return;
    }

    const editButtons = await screen.findAllByRole("button", {
      name: testI18n.t("business:services.list.editAction"),
    });
    const firstButton = editButtons[0];
    if (!firstButton) {
      throw new Error("Edit service button not found");
    }
    await user.click(firstButton);
  };

  const findTable = (): Promise<HTMLElement> => screen.findByRole("table");

  const findColumnHeader = (name: string): Promise<HTMLElement> =>
    screen.findByRole("columnheader", { name });

  const findEmptyStateTitle = (): Promise<HTMLElement> =>
    screen.findByText(testI18n.t("business:services.list.emptyTitle"));

  const findEmptyStateDescription = (): Promise<HTMLElement> =>
    screen.findByText(testI18n.t("business:services.list.emptyDescription"));

  const queryReadOnlyAlert = (): Nullable<HTMLElement> =>
    screen.queryByText(testI18n.t("business:errors.readOnly"));

  const changeSearchTerm = async (searchTerm: string): Promise<void> => {
    const searchInput = await screen.findByRole("searchbox", {
      name: testI18n.t("business:services.list.searchLabel"),
    });
    await user.clear(searchInput);
    if (searchTerm.length > 0) {
      await user.type(searchInput, searchTerm);
    }
  };

  const changeStatusFilter = async (statusValue: string): Promise<void> => {
    const select = await screen.findByRole("combobox", {
      name: testI18n.t("business:services.list.filterStatusLabel"),
    });
    await user.selectOptions(select, statusValue);
  };

  const clickClearFilters = async (): Promise<void> => {
    const clearButtons = await screen.findAllByRole("button", {
      name: testI18n.t("business:services.list.clearFiltersAction"),
    });
    const firstButton = clearButtons[0];
    if (!firstButton) {
      throw new Error("Clear filters button not found");
    }
    await user.click(firstButton);
  };

  const queryClearFiltersButton = (): Nullable<HTMLElement> =>
    screen.queryByRole("button", {
      name: testI18n.t("business:services.list.clearFiltersAction"),
    });

  const findNoResultsTitle = (): Promise<HTMLElement> =>
    screen.findByText(testI18n.t("business:services.list.noResults"));

  const findNoResultsDescription = (): Promise<HTMLElement> =>
    screen.findByText(
      testI18n.t("business:services.list.noResultsDescription"),
    );

  const findErrorAlert = (): Promise<HTMLElement> =>
    screen.findByText(testI18n.t("common:errors.network"));

  const clickRetry = async (): Promise<void> => {
    const retryButton = await screen.findByRole("button", {
      name: testI18n.t("business:services.list.retryAction"),
    });
    await user.click(retryButton);
  };

  const findRowByName = (serviceName: string): Promise<HTMLElement> =>
    screen.findByRole("row", { name: new RegExp(serviceName, "i") });

  const queryRowByName = (serviceName: string): Nullable<HTMLElement> =>
    screen.queryByRole("row", { name: new RegExp(serviceName, "i") });

  const findNextPageButton = (): Promise<HTMLElement> =>
    screen.findByRole("button", {
      name: testI18n.t("common:pagination.nextAction"),
    });

  const findPreviousPageButton = (): Promise<HTMLElement> =>
    screen.findByRole("button", {
      name: testI18n.t("common:pagination.previousAction"),
    });

  const clickNextPage = async (): Promise<void> => {
    const nextButton = await findNextPageButton();
    await user.click(nextButton);
  };

  const clickPreviousPage = async (): Promise<void> => {
    const previousButton = await findPreviousPageButton();
    await user.click(previousButton);
  };

  const findPaginationSummary = (): Promise<HTMLElement> =>
    screen.findByText(/página|page/i);

  return {
    changeSearchTerm,
    changeStatusFilter,
    clickClearFilters,
    clickCreateService,
    clickEditService,
    clickNextPage,
    clickPreviousPage,
    clickRetry,
    findColumnHeader,
    findCreateServiceButton,
    findEmptyStateDescription,
    findEmptyStateTitle,
    findErrorAlert,
    findHeading,
    findNextPageButton,
    findNoResultsDescription,
    findNoResultsTitle,
    findPaginationSummary,
    findPreviousPageButton,
    findRowByName,
    findTable,
    queryClearFiltersButton,
    queryReadOnlyAlert,
    queryRowByName,
  };
};
