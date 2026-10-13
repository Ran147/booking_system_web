import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/shared/test-utils/testI18n";
import type { Nullable } from "@/types";

export interface ServiceListPageObject {
  readonly clickCreateService: () => Promise<void>;
  readonly findColumnHeader: (name: string) => Promise<HTMLElement>;
  readonly findCreateServiceButton: () => Promise<HTMLElement>;
  readonly findEmptyStateDescription: () => Promise<HTMLElement>;
  readonly findEmptyStateTitle: () => Promise<HTMLElement>;
  readonly findHeading: () => Promise<HTMLElement>;
  readonly findTable: () => Promise<HTMLElement>;
  readonly queryReadOnlyAlert: () => Nullable<HTMLElement>;
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

  const findTable = (): Promise<HTMLElement> => screen.findByRole("table");

  const findColumnHeader = (name: string): Promise<HTMLElement> =>
    screen.findByRole("columnheader", { name });

  const findEmptyStateTitle = (): Promise<HTMLElement> =>
    screen.findByText(testI18n.t("business:services.list.emptyTitle"));

  const findEmptyStateDescription = (): Promise<HTMLElement> =>
    screen.findByText(testI18n.t("business:services.list.emptyDescription"));

  const queryReadOnlyAlert = (): Nullable<HTMLElement> =>
    screen.queryByRole("alert");

  return {
    clickCreateService,
    findColumnHeader,
    findCreateServiceButton,
    findEmptyStateDescription,
    findEmptyStateTitle,
    findHeading,
    findTable,
    queryReadOnlyAlert,
  };
};
