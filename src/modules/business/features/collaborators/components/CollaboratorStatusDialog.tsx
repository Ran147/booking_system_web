import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_VARIANT,
  Modal,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { Nullable } from "@/types";
import {
  COLLABORATOR_STATUS_DIALOG_MODE,
  type CollaboratorStatusDialogMode,
} from "../constants/CollaboratorFeature.constants";

interface CollaboratorStatusDialogProps {
  readonly collaboratorName: string;
  readonly hasBookingsLoadError?: boolean;
  readonly isLoading: boolean;
  readonly mode: Nullable<CollaboratorStatusDialogMode>;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly upcomingBookingsCount: number;
}

export const CollaboratorStatusDialog = ({
  collaboratorName,
  hasBookingsLoadError = false,
  isLoading,
  mode,
  onClose,
  onConfirm,
  upcomingBookingsCount,
}: CollaboratorStatusDialogProps): ReactElement => {
  const { t } = useTranslation([I18N_NAMESPACE.BUSINESS]);
  const isDeactivate = mode === COLLABORATOR_STATUS_DIALOG_MODE.DEACTIVATE;

  return (
    <Modal
      isOpen={Boolean(mode)}
      onClose={onClose}
      title={
        isDeactivate
          ? t("business:collaborators.deactivate.title")
          : t("business:collaborators.reactivate.title")
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-foreground">
          {isDeactivate
            ? t("business:collaborators.deactivate.confirmLabel", {
                name: collaboratorName,
              })
            : t("business:collaborators.reactivate.confirmLabel", {
                name: collaboratorName,
              })}
        </p>

        {isDeactivate && hasBookingsLoadError && (
          <Alert variant={ALERT_VARIANT.WARNING}>
            {t("business:collaborators.deactivate.bookingsLoadWarning", {
              name: collaboratorName,
            })}
          </Alert>
        )}

        {isDeactivate && !hasBookingsLoadError && upcomingBookingsCount > 0 && (
          <Alert variant={ALERT_VARIANT.WARNING}>
            {t("business:collaborators.deactivate.confirmWithBookings", {
              count: upcomingBookingsCount,
              name: collaboratorName,
            })}
          </Alert>
        )}

        <div className="flex justify-end gap-3">
          <Button
            disabled={isLoading}
            onClick={onClose}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            {isDeactivate
              ? t("business:collaborators.deactivate.cancelAction")
              : t("business:collaborators.reactivate.cancelAction")}
          </Button>
          <Button
            isLoading={isLoading}
            onClick={onConfirm}
            type="button"
            variant={
              isDeactivate ? BUTTON_VARIANT.DESTRUCTIVE : BUTTON_VARIANT.PRIMARY
            }
          >
            {isDeactivate
              ? isLoading
                ? t("business:collaborators.deactivate.confirmingLabel")
                : t("business:collaborators.deactivate.confirmAction")
              : isLoading
                ? t("business:collaborators.reactivate.confirmingLabel")
                : t("business:collaborators.reactivate.confirmAction")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
