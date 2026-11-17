import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CollaboratorPermission } from "@/domain";
import { testI18n } from "@/shared/test-utils/testI18n";

export interface CollaboratorPermissionsPageObject {
  readonly clickCancel: () => Promise<void>;
  readonly clickSave: () => Promise<void>;
  readonly findPermissionCheckbox: (
    permission: CollaboratorPermission,
  ) => Promise<HTMLInputElement>;
  readonly findText: (text: string) => Promise<HTMLElement>;
  readonly togglePermission: (
    permission: CollaboratorPermission,
  ) => Promise<void>;
}

export const createCollaboratorPermissionsPage =
  (): CollaboratorPermissionsPageObject => {
    const user = userEvent.setup();

    const findPermissionCheckbox = (
      permission: CollaboratorPermission,
    ): Promise<HTMLInputElement> =>
      screen.findByRole("checkbox", {
        name: testI18n.t(
          `business:collaborators.permissions.items.${permission}.label`,
        ),
      });

    const togglePermission = async (
      permission: CollaboratorPermission,
    ): Promise<void> => {
      const checkbox = await findPermissionCheckbox(permission);
      await user.click(checkbox);
    };

    const clickSave = async (): Promise<void> => {
      const button = await screen.findByRole("button", {
        name: testI18n.t("business:collaborators.permissions.saveAction"),
      });
      await user.click(button);
    };

    const clickCancel = async (): Promise<void> => {
      const button = await screen.findByRole("button", {
        name: testI18n.t("common:actions.cancel"),
      });
      await user.click(button);
    };

    const findText = (text: string): Promise<HTMLElement> =>
      screen.findByText(text);

    return {
      clickCancel,
      clickSave,
      findPermissionCheckbox,
      findText,
      togglePermission,
    };
  };
