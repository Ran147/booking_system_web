import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Modal,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { DeleteServiceConfirmDialogProps } from "./types/DeleteServiceConfirmDialog.types";

export const DeleteServiceConfirmDialog = ({
  isOpen,
  isPending = false,
  onCancel,
  onConfirm,
  serviceName,
}: DeleteServiceConfirmDialogProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={t("services.delete.confirmTitle")}
    >
      <div className="flex flex-col gap-4 p-4 text-sm text-foreground">
        <p>{t("services.delete.confirmDescription")}</p>
        {serviceName.length > 0 && (
          <p className="font-semibold text-foreground">{serviceName}</p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            ariaLabel={t("services.delete.cancelAction")}
            disabled={isPending}
            onClick={onCancel}
            size={BUTTON_SIZE.MD}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            {t("services.delete.cancelAction")}
          </Button>
          <Button
            ariaLabel={t("services.delete.confirmAction")}
            disabled={isPending}
            isLoading={isPending}
            onClick={onConfirm}
            size={BUTTON_SIZE.MD}
            type="button"
            variant={BUTTON_VARIANT.DESTRUCTIVE}
          >
            {t("services.delete.confirmAction")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
