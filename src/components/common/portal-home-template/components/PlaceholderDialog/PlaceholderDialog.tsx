import { Construction } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Modal,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { PlaceholderDialogProps } from "./PlaceholderDialog.types";

export const PlaceholderDialog = ({
  item,
  onClose,
}: PlaceholderDialogProps): ReactElement => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);

  return (
    <Modal
      isOpen={item !== null}
      onClose={onClose}
      title={t("business:home.placeholderModalTitle")}
    >
      <div className="space-y-6 pt-2">
        <div className="flex items-start gap-4 rounded-xl border border-border/80 bg-muted/40 p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Construction className="size-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {item ? item.title : t("business:home.placeholderModalTitle")}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("business:home.placeholderModalDescription")}
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={onClose}
            size={BUTTON_SIZE.MD}
            type="button"
            variant={BUTTON_VARIANT.DEFAULT}
          >
            {t("business:home.closeModal")}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
