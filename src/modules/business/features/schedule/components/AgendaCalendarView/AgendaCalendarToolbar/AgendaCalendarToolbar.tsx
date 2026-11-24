import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button, BUTTON_VARIANT, Card } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { AGENDA_CALENDAR_TOOLBAR_CONFIG } from "./AgendaCalendarToolbar.constants";
import type { AgendaCalendarToolbarProps } from "./AgendaCalendarToolbar.types";

export const AgendaCalendarToolbar = ({
  formattedHeaderTitle,
  isDayView,
  isWeekView,
  onNext,
  onPrevious,
  onSwitchToDayView,
  onSwitchToWeekView,
  onToday,
}: AgendaCalendarToolbarProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            size={AGENDA_CALENDAR_TOOLBAR_CONFIG.TEXT_BUTTON_SIZE}
            variant={AGENDA_CALENDAR_TOOLBAR_CONFIG.OUTLINE_VARIANT}
            onClick={onToday}
          >
            {t("schedule.agenda.today")}
          </Button>
          <Button
            ariaLabel={t("schedule.agenda.previous")}
            size={AGENDA_CALENDAR_TOOLBAR_CONFIG.NAVIGATION_ICON_SIZE}
            variant={AGENDA_CALENDAR_TOOLBAR_CONFIG.OUTLINE_VARIANT}
            onClick={onPrevious}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            ariaLabel={t("schedule.agenda.next")}
            size={AGENDA_CALENDAR_TOOLBAR_CONFIG.NAVIGATION_ICON_SIZE}
            variant={AGENDA_CALENDAR_TOOLBAR_CONFIG.OUTLINE_VARIANT}
            onClick={onNext}
          >
            <ChevronRight className="size-4" />
          </Button>

          <span className="text-base font-semibold text-foreground ml-2 capitalize">
            {formattedHeaderTitle}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
            <Button
              size={AGENDA_CALENDAR_TOOLBAR_CONFIG.TEXT_BUTTON_SIZE}
              variant={
                isDayView ? BUTTON_VARIANT.DEFAULT : BUTTON_VARIANT.GHOST
              }
              onClick={onSwitchToDayView}
            >
              {t("schedule.agenda.viewDay")}
            </Button>
            <Button
              size={AGENDA_CALENDAR_TOOLBAR_CONFIG.TEXT_BUTTON_SIZE}
              variant={
                isWeekView ? BUTTON_VARIANT.DEFAULT : BUTTON_VARIANT.GHOST
              }
              onClick={onSwitchToWeekView}
            >
              {t("schedule.agenda.viewWeek")}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
