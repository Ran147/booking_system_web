import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/shared/test-utils/testI18n";
import type { Nullable } from "@/types";

export interface BusinessHomePageObject {
  readonly clickClosePlaceholderModal: () => Promise<void>;
  readonly clickCreateService: () => Promise<void>;
  readonly clickScheduleTool: () => Promise<void>;
  readonly findConfigurationsHeading: () => Promise<HTMLElement>;
  readonly findPageTitle: () => Promise<HTMLElement>;
  readonly findPlaceholderModalTitle: () => Promise<HTMLElement>;
  readonly findQuickAccessHeading: () => Promise<HTMLElement>;
  readonly findReadOnlyAlert: () => Promise<HTMLElement>;
  readonly queryReadOnlyAlert: () => Nullable<HTMLElement>;
}

export const createBusinessHomePage = (): BusinessHomePageObject => {
  const user = userEvent.setup();

  const findPageTitle = (): Promise<HTMLElement> =>
    screen.findByRole("heading", {
      level: 1,
      name: testI18n.t("business:home.title"),
    });

  const findQuickAccessHeading = (): Promise<HTMLElement> =>
    screen.findByRole("heading", {
      level: 2,
      name: testI18n.t("business:home.toolsTitle"),
    });

  const findConfigurationsHeading = (): Promise<HTMLElement> =>
    screen.findByRole("heading", {
      level: 2,
      name: testI18n.t("business:home.configsTitle"),
    });

  const clickCreateService = async (): Promise<void> => {
    const createServiceButton = screen.getByRole("button", {
      name: testI18n.t("business:home.tools.services.action"),
    });
    await user.click(createServiceButton);
  };

  const clickScheduleTool = async (): Promise<void> => {
    const scheduleCard = screen.getByText(
      testI18n.t("business:home.tools.schedule.title"),
    );
    await user.click(scheduleCard);
  };

  const findPlaceholderModalTitle = (): Promise<HTMLElement> =>
    screen.findByRole("heading", {
      level: 2,
      name: testI18n.t("business:home.placeholderModalTitle"),
    });

  const clickClosePlaceholderModal = async (): Promise<void> => {
    const closeButton = screen.getByRole("button", {
      name: testI18n.t("business:home.closeModal"),
    });
    await user.click(closeButton);
  };

  const findReadOnlyAlert = (): Promise<HTMLElement> =>
    screen.findByRole("alert");

  const queryReadOnlyAlert = (): Nullable<HTMLElement> =>
    screen.queryByRole("alert");

  return {
    clickClosePlaceholderModal,
    clickCreateService,
    clickScheduleTool,
    findConfigurationsHeading,
    findPageTitle,
    findPlaceholderModalTitle,
    findQuickAccessHeading,
    findReadOnlyAlert,
    queryReadOnlyAlert,
  };
};
