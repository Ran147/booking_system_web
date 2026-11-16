import { Clock } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Alert, ALERT_VARIANT, Button, Card } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { BusinessHoursDayRow } from "../BusinessHoursDayRow";
import { BUSINESS_HOURS_SCHEDULE_CARD_CONFIG } from "./BusinessHoursScheduleCard.constants";
import type { BusinessHoursScheduleCardProps } from "./BusinessHoursScheduleCard.types";

export const BusinessHoursScheduleCard = ({
  dayRows,
  errorMessage,
  isSaving,
  onSave,
  successMessage,
  timeZone,
}: BusinessHoursScheduleCardProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-1 pb-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Clock className="size-5 text-primary" />
          {t("schedule.hours.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("schedule.hours.description")} ({timeZone})
        </p>
      </div>

      {errorMessage && (
        <div className="mt-4">
          <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>{errorMessage}</Alert>
        </div>
      )}

      {successMessage && (
        <div className="mt-4">
          <Alert variant={ALERT_VARIANT.SUCCESS}>{successMessage}</Alert>
        </div>
      )}

      <div className="flex flex-col gap-4 mt-6 divide-y divide-border/60">
        {dayRows.map((dayRow) => (
          <BusinessHoursDayRow dayRow={dayRow} key={dayRow.day} />
        ))}
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t border-border">
        <Button
          disabled={isSaving}
          isLoading={isSaving}
          variant={BUSINESS_HOURS_SCHEDULE_CARD_CONFIG.SAVE_BUTTON_VARIANT}
          onClick={onSave}
        >
          {t("schedule.hours.saveAction")}
        </Button>
      </div>
    </Card>
  );
};
