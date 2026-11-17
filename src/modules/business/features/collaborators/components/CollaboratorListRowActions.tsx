import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, BUTTON_SIZE, BUTTON_VARIANT } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { COLLABORATOR_STATUS } from "@/domain";
import type { CollaboratorListItem } from "../models";

interface CollaboratorListRowActionsProps {
  readonly isResending: boolean;
  readonly item: CollaboratorListItem;
  readonly onDeactivate: (collaborator: CollaboratorListItem) => void;
  readonly onEdit: (collaboratorId: string) => void;
  readonly onPermissions: (collaboratorId: string) => void;
  readonly onReactivate: (collaborator: CollaboratorListItem) => void;
  readonly onResendEmail: (collaborator: CollaboratorListItem) => void;
}

export const CollaboratorListRowActions = ({
  isResending,
  item,
  onDeactivate,
  onEdit,
  onPermissions,
  onReactivate,
  onResendEmail,
}: CollaboratorListRowActionsProps): ReactElement => {
  const { t } = useTranslation([I18N_NAMESPACE.BUSINESS]);
  const isActive = item.status === COLLABORATOR_STATUS.ACTIVE;
  const isInactive = item.status === COLLABORATOR_STATUS.INACTIVE;
  const isInvited = item.status === COLLABORATOR_STATUS.INVITED;

  return (
    <div className="flex flex-wrap justify-end gap-2">
      <Button
        onClick={(): void => {
          onEdit(item.id);
        }}
        size={BUTTON_SIZE.SM}
        type="button"
        variant={BUTTON_VARIANT.OUTLINE}
      >
        {t("business:collaborators.profile.editAction")}
      </Button>
      <Button
        onClick={(): void => {
          onPermissions(item.id);
        }}
        size={BUTTON_SIZE.SM}
        type="button"
        variant={BUTTON_VARIANT.OUTLINE}
      >
        {t("business:collaborators.permissions.action")}
      </Button>
      {(isInvited || isActive) && (
        <Button
          isLoading={isResending}
          onClick={(): void => {
            onResendEmail(item);
          }}
          size={BUTTON_SIZE.SM}
          type="button"
          variant={BUTTON_VARIANT.SECONDARY}
        >
          {isInvited
            ? t("business:collaborators.resend.invitedAction")
            : t("business:collaborators.resend.activeAction")}
        </Button>
      )}
      {isActive && (
        <Button
          onClick={(): void => {
            onDeactivate(item);
          }}
          size={BUTTON_SIZE.SM}
          type="button"
          variant={BUTTON_VARIANT.DESTRUCTIVE}
        >
          {t("business:collaborators.deactivate.action")}
        </Button>
      )}
      {isInactive && (
        <Button
          onClick={(): void => {
            onReactivate(item);
          }}
          size={BUTTON_SIZE.SM}
          type="button"
          variant={BUTTON_VARIANT.SECONDARY}
        >
          {t("business:collaborators.reactivate.action")}
        </Button>
      )}
    </div>
  );
};
