import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, BUTTON_VARIANT, Modal } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { CollaboratorLimitDialogState } from "../models";

interface CollaboratorLimitDialogProps {
  readonly dialog: CollaboratorLimitDialogState;
  readonly onClose: () => void;
  readonly onUpgrade: () => void;
}

export const CollaboratorLimitDialog = ({
  dialog,
  onClose,
  onUpgrade,
}: CollaboratorLimitDialogProps): ReactElement => {
  const { t } = useTranslation([I18N_NAMESPACE.BUSINESS]);

  return (
    <Modal
      isOpen={dialog.isOpen}
      onClose={onClose}
      title={t("business:collaborators.limit.title")}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground">
          {t("business:collaborators.limit.reached", {
            limit: dialog.limit ?? 0,
          })}
        </p>
        {!dialog.hasHigherPlan && (
          <p className="text-sm text-muted-foreground">
            {t("business:collaborators.limit.noHigherPlanNotice")}
          </p>
        )}
        <div className="flex justify-end gap-3">
          <Button
            onClick={onClose}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            {t("business:collaborators.limit.closeAction")}
          </Button>
          {dialog.hasHigherPlan && (
            <Button onClick={onUpgrade} type="button">
              {t("business:collaborators.limit.upgradeAction")}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
