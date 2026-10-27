import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/shared/test-utils/testI18n";
import type { Nullable } from "@/types";

export interface BusinessSidebarPageObject {
  readonly clickCancelSignOut: () => Promise<void>;
  readonly clickClosePlaceholderModal: () => Promise<void>;
  readonly clickConfirmSignOut: () => Promise<void>;
  readonly clickCreateServiceItem: () => Promise<void>;
  readonly clickMobileSettingsItem: () => Promise<void>;
  readonly clickOpenMenuButton: () => Promise<void>;
  readonly clickSettingsItem: () => Promise<void>;
  readonly clickScheduleItem: () => Promise<void>;
  readonly clickSignOutButton: () => Promise<void>;
  readonly findBrandName: (name: string) => Promise<HTMLElement>;
  readonly findBusinessLogo: (name: string) => Promise<HTMLElement>;
  readonly findCollaboratorName: (name: string) => Promise<HTMLElement>;
  readonly findCreateServiceItem: () => Promise<HTMLElement>;
  readonly findDashboardItem: () => Promise<HTMLElement>;
  readonly findNetworkErrorAnnouncement: () => Promise<HTMLElement>;
  readonly findPlaceholderModalHeading: () => Promise<HTMLElement>;
  readonly findRoleBadge: (roleLabel: string) => Promise<HTMLElement>;
  readonly findSettingsItem: () => Promise<HTMLElement>;
  readonly findSidebarNav: () => Promise<HTMLElement>;
  readonly findSignOutConfirmDialog: () => Promise<HTMLElement>;
  readonly queryCollaboratorsItem: () => Nullable<HTMLElement>;
  readonly queryPlaceholderModalHeading: () => Nullable<HTMLElement>;
  readonly queryProfileItem: () => Nullable<HTMLElement>;
  readonly querySettingsItem: () => Nullable<HTMLElement>;
  readonly querySubscriptionItem: () => Nullable<HTMLElement>;
}

export const createBusinessSidebarPage = (): BusinessSidebarPageObject => {
  const user = userEvent.setup();

  const findSidebarNav = (): Promise<HTMLElement> =>
    screen.findByRole("navigation", {
      name: testI18n.t("business:layout.sidebar.ariaLabel"),
    });

  const findBrandName = async (name: string): Promise<HTMLElement> => {
    const nav = await findSidebarNav();
    const sidebar = nav.closest("aside") ?? document.body;
    return within(sidebar).findByText(name);
  };

  const findCollaboratorName = async (name: string): Promise<HTMLElement> => {
    const nav = await findSidebarNav();
    const sidebar = nav.closest("aside") ?? document.body;
    return within(sidebar).findByText(name);
  };

  const findBusinessLogo = async (name: string): Promise<HTMLElement> => {
    const nav = await findSidebarNav();
    const sidebar = nav.closest("aside") ?? document.body;
    return within(sidebar).findByRole("img", { name });
  };

  const findRoleBadge = async (roleLabel: string): Promise<HTMLElement> => {
    const nav = await findSidebarNav();
    const sidebar = nav.closest("aside") ?? document.body;
    return within(sidebar).findByText(roleLabel);
  };

  const findDashboardItem = (): Promise<HTMLElement> =>
    screen.findByRole("button", {
      name: new RegExp(testI18n.t("business:layout.sidebar.dashboard"), "i"),
    });

  const findCreateServiceItem = (): Promise<HTMLElement> =>
    screen.findByRole("button", {
      name: new RegExp(testI18n.t("business:layout.sidebar.services"), "i"),
    });

  const clickCreateServiceItem = async (): Promise<void> => {
    const item = await findCreateServiceItem();
    await user.click(item);
  };

  const clickScheduleItem = async (): Promise<void> => {
    const item = await screen.findByRole("button", {
      name: new RegExp(testI18n.t("business:layout.sidebar.schedule"), "i"),
    });
    await user.click(item);
  };

  const findSettingsItem = (): Promise<HTMLElement> =>
    screen.findByRole("button", {
      name: new RegExp(testI18n.t("business:layout.sidebar.settings"), "i"),
    });

  const clickSettingsItem = async (): Promise<void> => {
    await user.click(await findSettingsItem());
  };

  const clickOpenMenuButton = async (): Promise<void> => {
    await user.click(
      await screen.findByRole("button", {
        name: testI18n.t("business:layout.sidebar.openMenu"),
      }),
    );
  };

  const clickMobileSettingsItem = async (): Promise<void> => {
    const drawer = await screen.findByRole("dialog");
    await user.click(
      within(drawer).getByRole("button", {
        name: new RegExp(testI18n.t("business:layout.sidebar.settings"), "i"),
      }),
    );
  };

  const findPlaceholderModalHeading = (): Promise<HTMLElement> =>
    screen.findByRole("heading", {
      level: 2,
      name: testI18n.t("business:home.placeholderModalTitle"),
    });

  const queryPlaceholderModalHeading = (): Nullable<HTMLElement> =>
    screen.queryByRole("heading", {
      level: 2,
      name: testI18n.t("business:home.placeholderModalTitle"),
    });

  const clickClosePlaceholderModal = async (): Promise<void> => {
    const closeButton = await screen.findByRole("button", {
      name: testI18n.t("business:home.closeModal"),
    });
    await user.click(closeButton);
  };

  const clickSignOutButton = async (): Promise<void> => {
    const signOutButton = await screen.findByRole("button", {
      name: testI18n.t("business:layout.sidebar.signOut"),
    });
    await user.click(signOutButton);
  };

  const findSignOutConfirmDialog = (): Promise<HTMLElement> =>
    screen.findByText(
      testI18n.t("business:layout.signOut.unsavedChangesConfirm"),
    );

  const clickConfirmSignOut = async (): Promise<void> => {
    const confirmButton = await screen.findByRole("button", {
      name: testI18n.t("business:layout.signOut.confirmAction"),
    });
    await user.click(confirmButton);
  };

  const clickCancelSignOut = async (): Promise<void> => {
    const cancelButton = await screen.findByRole("button", {
      name: testI18n.t("business:layout.signOut.cancelAction"),
    });
    await user.click(cancelButton);
  };

  const findNetworkErrorAnnouncement = (): Promise<HTMLElement> =>
    screen.findByText(testI18n.t("common:errors.network"));

  const queryCollaboratorsItem = (): Nullable<HTMLElement> =>
    screen.queryByRole("button", {
      name: new RegExp(
        testI18n.t("business:layout.sidebar.collaborators"),
        "i",
      ),
    });

  const querySettingsItem = (): Nullable<HTMLElement> =>
    screen.queryByRole("button", {
      name: new RegExp(testI18n.t("business:layout.sidebar.settings"), "i"),
    });

  const queryProfileItem = (): Nullable<HTMLElement> =>
    screen.queryByRole("button", {
      name: new RegExp(testI18n.t("business:layout.sidebar.profile"), "i"),
    });

  const querySubscriptionItem = (): Nullable<HTMLElement> =>
    screen.queryByRole("button", {
      name: new RegExp(testI18n.t("business:layout.sidebar.subscription"), "i"),
    });

  return {
    clickCancelSignOut,
    clickClosePlaceholderModal,
    clickConfirmSignOut,
    clickCreateServiceItem,
    clickMobileSettingsItem,
    clickOpenMenuButton,
    clickSettingsItem,
    clickScheduleItem,
    clickSignOutButton,
    findBrandName,
    findBusinessLogo,
    findCollaboratorName,
    findCreateServiceItem,
    findDashboardItem,
    findNetworkErrorAnnouncement,
    findPlaceholderModalHeading,
    findRoleBadge,
    findSettingsItem,
    findSidebarNav,
    findSignOutConfirmDialog,
    queryCollaboratorsItem,
    queryPlaceholderModalHeading,
    queryProfileItem,
    querySettingsItem,
    querySubscriptionItem,
  };
};
