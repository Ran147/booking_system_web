import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { useAgendaCalendarViewModel } from "@/modules/business/features/schedule";
import { AgendaCalendarToolbar } from "./AgendaCalendarToolbar";
import { AGENDA_CALENDAR_VIEW_CONFIG } from "./AgendaCalendarView.constants";
import type { AgendaCalendarViewProps } from "./AgendaCalendarView.types";
import { AgendaDayView } from "./AgendaDayView";
import { AgendaWeekView } from "./AgendaWeekView";

export const AgendaCalendarView = (
  props: AgendaCalendarViewProps,
): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const {
    allBlocks,
    dayView,
    formattedHeaderTitle,
    handleNext,
    handlePrevious,
    handleSwitchToDayView,
    handleSwitchToWeekView,
    handleToday,
    hasConfiguredHours,
    hasDeleteBlockAction,
    isDayView,
    isWeekView,
    timeZone,
    weekDays,
  } = useAgendaCalendarViewModel(props);

  return (
    <div className="flex flex-col gap-6">
      <AgendaCalendarToolbar
        formattedHeaderTitle={formattedHeaderTitle}
        isDayView={isDayView}
        isWeekView={isWeekView}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSwitchToDayView={handleSwitchToDayView}
        onSwitchToWeekView={handleSwitchToWeekView}
        onToday={handleToday}
      />

      {!hasConfiguredHours && (
        <Alert
          variant={AGENDA_CALENDAR_VIEW_CONFIG.UNCONFIGURED_HOURS_ALERT_VARIANT}
        >
          {t("schedule.hours.notConfiguredNotice")}
        </Alert>
      )}

      {isWeekView ? (
        <AgendaWeekView
          allBlocks={allBlocks}
          hasDeleteBlockAction={hasDeleteBlockAction}
          weekDays={weekDays}
        />
      ) : (
        <AgendaDayView
          allBlocks={allBlocks}
          dayView={dayView}
          hasDeleteBlockAction={hasDeleteBlockAction}
          timeZone={timeZone}
        />
      )}
    </div>
  );
};
