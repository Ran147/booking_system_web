import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, BUTTON_VARIANT } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { COLLABORATOR_STATUS } from "@/domain";
import type { CollaboratorDetailData } from "../models";

interface CollaboratorProfileActionsProps {
  readonly collaborator: CollaboratorDetailData;
  readonly cooldownSecondsRemaining: number;
  readonly isResendingEmail: boolean;
  readonly onDeactivate: () => void;
  readonly onEdit: () => void;
  readonly onPermissions: () => void;
  readonly onReactivate: () => void;
  readonly onResendEmail: () => void;
}

export const CollaboratorProfileActions = ({
  collaborator,
  cooldownSecondsRemaining,
  isResendingEmail,
  onDeactivate,
  onEdit,
  onPermissions,
  onReactivate,
  onResendEmail,
}: CollaboratorProfileActionsProps): ReactElement => {
  const { t } = useTranslation([I18N_NAMESPACE.BUSINESS]);
  const isInvited = collaborator.status === COLLABORATOR_STATUS.INVITED;
  const isActive = collaborator.status === COLLABORATOR_STATUS.ACTIVE;
  const isInactive = collaborator.status === COLLABORATOR_STATUS.INACTIVE;
  const canResend = isInvited || isActive;

  const resendLabel = isResendingEmail
    ? t("business:collaborators.resend.sendingLabel")
    : cooldownSecondsRemaining > 0
      ? t("business:collaborators.resend.cooldownLabel", {
          count: cooldownSecondsRemaining,
        })
      : isInvited
        ? t("business:collaborators.resend.invitedAction")
        : t("business:collaborators.resend.activeAction");

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={onEdit} type="button" variant={BUTTON_VARIANT.OUTLINE}>
        {t("business:collaborators.profile.editAction")}
      </Button>
      <Button
        onClick={onPermissions}
        type="button"
        variant={BUTTON_VARIANT.OUTLINE}
      >
        {t("business:collaborators.profile.permissionsAction")}
      </Button>
      {canResend && (
        <Button
          disabled={cooldownSecondsRemaining > 0}
          isLoading={isResendingEmail}
          onClick={onResendEmail}
          type="button"
          variant={BUTTON_VARIANT.SECONDARY}
        >
          {resendLabel}
        </Button>
      )}
      {isActive && (
        <Button
          onClick={onDeactivate}
          type="button"
          variant={BUTTON_VARIANT.DESTRUCTIVE}
        >
          {t("business:collaborators.deactivate.action")}
        </Button>
      )}
      {isInactive && (
        <Button onClick={onReactivate} type="button">
          {t("business:collaborators.reactivate.action")}
        </Button>
      )}
    </div>
  );
};
