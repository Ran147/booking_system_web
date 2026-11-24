import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  BUTTON_VARIANT,
  InputField,
  Modal,
  toast,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { CollaboratorInvitationLinkDialogState } from "../models";

interface CollaboratorInvitationLinkDialogProps {
  readonly dialog: CollaboratorInvitationLinkDialogState;
  readonly onClose: () => void;
}

export const CollaboratorInvitationLinkDialog = ({
  dialog,
  onClose,
}: CollaboratorInvitationLinkDialogProps): ReactElement => {
  const { t } = useTranslation([I18N_NAMESPACE.BUSINESS]);

  const handleCopyLink = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(dialog.invitationUrl);
      toast.success(t("business:collaborators.invitationLink.copiedSuccess"));
    } catch {
      toast.error(t("business:collaborators.invitationLink.copyError"));
    }
  };

  return (
    <Modal
      isOpen={dialog.isOpen}
      onClose={onClose}
      title={t("business:collaborators.invitationLink.title")}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          {t("business:collaborators.invitationLink.description", {
            name: dialog.collaboratorName,
          })}
        </p>

        <InputField
          label={t("business:collaborators.invitationLink.linkLabel")}
          name="collaborator-invitation-link"
          onChange={(): void => undefined}
          readOnly
          type="text"
          value={dialog.invitationUrl}
        />

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            onClick={(): void => {
              void handleCopyLink();
            }}
            type="button"
            variant={BUTTON_VARIANT.SECONDARY}
          >
            {t("business:collaborators.invitationLink.copyAction")}
          </Button>
          <Button onClick={onClose} type="button">
            {t("business:collaborators.invitationLink.closeAction")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
