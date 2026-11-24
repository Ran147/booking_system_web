import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { COLLABORATOR_STATUS, type CollaboratorStatus } from "@/domain";
import { testI18n } from "@/shared/test-utils/testI18n";
import type { Nullable } from "@/types";

export interface CollaboratorListPageObject {
  readonly clickAddCollaborator: () => Promise<void>;
  readonly clickClearFilters: () => Promise<void>;
  readonly clickConfirmDeactivate: () => Promise<void>;
  readonly clickConfirmReactivate: () => Promise<void>;
  readonly clickDeactivateRowAction: () => Promise<void>;
  readonly clickNextPage: () => Promise<void>;
  readonly clickReactivateRowAction: () => Promise<void>;
  readonly clickResendActiveRowAction: () => Promise<void>;
  readonly clickResendInvitedRowAction: () => Promise<void>;
  readonly clickRetry: () => Promise<void>;
  readonly clickUpgradePlan: () => Promise<void>;
  readonly findEmptyState: (filtered?: boolean) => Promise<HTMLElement>;
  readonly findLimitDialogHeading: () => Promise<HTMLElement>;
  readonly findNoHigherPlanNotice: () => Promise<HTMLElement>;
  readonly findReadOnlyAlert: () => Promise<HTMLElement>;
  readonly findText: (text: string) => Promise<HTMLElement>;
  readonly findUsageCounter: (
    used: number,
    max: number,
  ) => Promise<HTMLElement>;
  readonly queryAddButton: () => Nullable<HTMLElement>;
  readonly queryUpgradeButton: () => Nullable<HTMLElement>;
  readonly selectStatusFilter: (
    status: CollaboratorStatus | "",
  ) => Promise<void>;
  readonly typeSearch: (searchTerm: string) => Promise<void>;
}

export const createCollaboratorListPage = (): CollaboratorListPageObject => {
  const user = userEvent.setup();

  const clickAddCollaborator = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("business:collaborators.list.addAction"),
    });
    await user.click(button);
  };

  const clickClearFilters = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("business:collaborators.list.clearFiltersAction"),
    });
    await user.click(button);
  };

  const clickRetry = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("business:collaborators.list.retryAction"),
    });
    await user.click(button);
  };

  const typeSearch = async (searchTerm: string): Promise<void> => {
    const searchInput = await screen.findByLabelText(
      testI18n.t("business:collaborators.list.searchLabel"),
    );
    await user.clear(searchInput);
    if (searchTerm) {
      await user.type(searchInput, searchTerm);
    }
  };

  const selectStatusFilter = async (
    status: CollaboratorStatus | "",
  ): Promise<void> => {
    const selectElement = await screen.findByLabelText(
      testI18n.t("business:collaborators.list.statusFilterLabel"),
    );
    await user.selectOptions(selectElement, status);
  };

  const clickDeactivateRowAction = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("business:collaborators.deactivate.action"),
    });
    await user.click(button);
  };

  const clickConfirmDeactivate = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("business:collaborators.deactivate.confirmAction"),
    });
    await user.click(button);
  };

  const clickReactivateRowAction = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("business:collaborators.reactivate.action"),
    });
    await user.click(button);
  };

  const clickConfirmReactivate = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("business:collaborators.reactivate.confirmAction"),
    });
    await user.click(button);
  };

  const clickResendInvitedRowAction = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("business:collaborators.resend.invitedAction"),
    });
    await user.click(button);
  };

  const clickResendActiveRowAction = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("business:collaborators.resend.activeAction"),
    });
    await user.click(button);
  };

  const clickNextPage = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("common:pagination.nextAction"),
    });
    await user.click(button);
  };

  const clickUpgradePlan = async (): Promise<void> => {
    const button = await screen.findByRole("button", {
      name: testI18n.t("business:collaborators.limit.upgradeAction"),
    });
    await user.click(button);
  };

  const findEmptyState = (filtered = false): Promise<HTMLElement> =>
    screen.findByText(
      filtered
        ? testI18n.t("business:collaborators.list.emptyFiltered")
        : testI18n.t("business:collaborators.list.empty"),
    );

  const findLimitDialogHeading = (): Promise<HTMLElement> =>
    screen.findByRole("heading", {
      name: testI18n.t("business:collaborators.limit.title"),
    });

  const findNoHigherPlanNotice = (): Promise<HTMLElement> =>
    screen.findByText(
      testI18n.t("business:collaborators.limit.noHigherPlanNotice"),
    );

  const findReadOnlyAlert = (): Promise<HTMLElement> =>
    screen.findByText(testI18n.t("business:collaborators.list.readOnly"));

  const findText = (text: string): Promise<HTMLElement> =>
    screen.findByText(text);

  const findUsageCounter = (used: number, max: number): Promise<HTMLElement> =>
    screen.findByText(
      testI18n.t("business:collaborators.limit.countSummary", {
        limit: max,
        used,
      }),
    );

  const queryAddButton = (): Nullable<HTMLElement> =>
    screen.queryByRole("button", {
      name: testI18n.t("business:collaborators.list.addAction"),
    });

  const queryUpgradeButton = (): Nullable<HTMLElement> =>
    screen.queryByRole("button", {
      name: testI18n.t("business:collaborators.limit.upgradeAction"),
    });

  return {
    clickAddCollaborator,
    clickClearFilters,
    clickConfirmDeactivate,
    clickConfirmReactivate,
    clickDeactivateRowAction,
    clickNextPage,
    clickReactivateRowAction,
    clickResendActiveRowAction,
    clickResendInvitedRowAction,
    clickRetry,
    clickUpgradePlan,
    findEmptyState,
    findLimitDialogHeading,
    findNoHigherPlanNotice,
    findReadOnlyAlert,
    findText,
    findUsageCounter,
    queryAddButton,
    queryUpgradeButton,
    selectStatusFilter,
    typeSearch,
  };
};

export { COLLABORATOR_STATUS };
