import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Modal,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";

export interface SignOutConfirmDialogProps {
  readonly isOpen: boolean;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export const SignOutConfirmDialog = ({
  isOpen,
  onCancel,
  onConfirm,
}: SignOutConfirmDialogProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <Modal
      closeAriaLabel={t("layout.signOut.cancelAction")}
      isOpen={isOpen}
      onClose={onCancel}
      title={t("layout.signOut.confirmTitle")}
    >
      <div className="flex flex-col gap-4 p-4 text-sm text-foreground">
        <p>{t("layout.signOut.unsavedChangesConfirm")}</p>
        <div className="flex justify-end gap-2 pt-2">
          <Button
            onClick={onCancel}
            size={BUTTON_SIZE.MD}
            type="button"
            variant={BUTTON_VARIANT.OUTLINE}
          >
            {t("layout.signOut.cancelAction")}
          </Button>
          <Button
            onClick={onConfirm}
            size={BUTTON_SIZE.MD}
            type="button"
            variant={BUTTON_VARIANT.DESTRUCTIVE}
          >
            {t("layout.signOut.confirmAction")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
