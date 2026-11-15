import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, Card, RadioGroup } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { BUSINESS_HOURS_CONFIRMATION_CARD_CONFIG } from "./BusinessHoursConfirmationCard.constants";
import type { BusinessHoursConfirmationCardProps } from "./BusinessHoursConfirmationCard.types";

export const BusinessHoursConfirmationCard = ({
  confirmationMode,
  confirmationOptions,
  isSaving,
  onModeChange,
  onSave,
}: BusinessHoursConfirmationCardProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-1 pb-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          {t("schedule.confirmation.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("schedule.confirmation.description")}
        </p>
      </div>

      <div className="mt-4">
        <RadioGroup
          label={t("schedule.confirmation.title")}
          options={confirmationOptions}
          value={confirmationMode}
          onValueChange={onModeChange}
        />
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t border-border">
        <Button
          disabled={isSaving}
          isLoading={isSaving}
          variant={BUSINESS_HOURS_CONFIRMATION_CARD_CONFIG.SAVE_BUTTON_VARIANT}
          onClick={onSave}
        >
          {t("schedule.confirmation.saveAction")}
        </Button>
      </div>
    </Card>
  );
};
