import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { testI18n } from "@/shared/test-utils/testI18n";

export interface CollaboratorProfilePageObject {
  readonly clickBackToList: () => Promise<void>;
  readonly clickConfirmDeactivate: () => Promise<void>;
  readonly clickConfirmReactivate: () => Promise<void>;
  readonly clickDeactivate: () => Promise<void>;
  readonly clickEdit: () => Promise<void>;
  readonly clickPermissions: () => Promise<void>;
  readonly clickReactivate: () => Promise<void>;
  readonly clickResendInvited: () => Promise<void>;
  readonly findCooldownButton: (seconds: number) => Promise<HTMLButtonElement>;
  readonly findNotFoundAlert: () => Promise<HTMLElement>;
  readonly findText: (text: string) => Promise<HTMLElement>;
}

export const createCollaboratorProfilePage =
  (): CollaboratorProfilePageObject => {
    const user = userEvent.setup();

    const clickEdit = async (): Promise<void> => {
      const button = await screen.findByRole("button", {
        name: testI18n.t("business:collaborators.profile.editAction"),
      });
      await user.click(button);
    };

    const clickPermissions = async (): Promise<void> => {
      const button = await screen.findByRole("button", {
        name: testI18n.t("business:collaborators.profile.permissionsAction"),
      });
      await user.click(button);
    };

    const clickDeactivate = async (): Promise<void> => {
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

    const clickReactivate = async (): Promise<void> => {
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

    const clickResendInvited = async (): Promise<void> => {
      const button = await screen.findByRole("button", {
        name: testI18n.t("business:collaborators.resend.invitedAction"),
      });
      await user.click(button);
    };

    const clickBackToList = async (): Promise<void> => {
      const button = await screen.findByRole("button", {
        name: testI18n.t("business:collaborators.profile.backAction"),
      });
      await user.click(button);
    };

    const findCooldownButton = (seconds: number): Promise<HTMLButtonElement> =>
      screen.findByRole("button", {
        name: testI18n.t("business:collaborators.resend.cooldownLabel", {
          count: seconds,
        }),
      });

    const findNotFoundAlert = (): Promise<HTMLElement> =>
      screen.findByText(testI18n.t("business:collaborators.profile.notFound"));

    const findText = (text: string): Promise<HTMLElement> =>
      screen.findByText(text);

    return {
      clickBackToList,
      clickConfirmDeactivate,
      clickConfirmReactivate,
      clickDeactivate,
      clickEdit,
      clickPermissions,
      clickReactivate,
      clickResendInvited,
      findCooldownButton,
      findNotFoundAlert,
      findText,
    };
  };
