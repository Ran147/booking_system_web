import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import {
  toDisplayDate,
  type WeekDay,
} from "@/modules/customer/features/availability";
import type { Nullable } from "@/types";

export interface DateStripProps {
  readonly canGoToNextWeek: boolean;
  readonly canGoToPreviousWeek: boolean;
  readonly language: string;
  readonly onNextWeek: () => void;
  readonly onPreviousWeek: () => void;
  readonly onSelectDate: (date: string) => void;
  readonly selectedDate: Nullable<string>;
  readonly weekDays: readonly WeekDay[];
}

// The days are calendar days of the business; formatting them in UTC keeps
// the label from moving with the device time zone (AC-KAN-140-06).
const formatDayLabel = (date: string, language: string): string =>
  new Intl.DateTimeFormat(language, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "short",
  }).format(toDisplayDate(date));

/** A week of days; closed, past or too far days are disabled (P5-1). */
export const DateStrip = ({
  canGoToNextWeek,
  canGoToPreviousWeek,
  language,
  onNextWeek,
  onPreviousWeek,
  onSelectDate,
  selectedDate,
  weekDays,
}: DateStripProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.CUSTOMER);

  return (
    <div className="flex items-center gap-2">
      <Button
        ariaLabel={t("availability.previousWeek")}
        disabled={!canGoToPreviousWeek}
        onClick={onPreviousWeek}
        size="icon"
        variant="ghost"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
      </Button>
      <ul
        aria-label={t("availability.dateGroupLabel")}
        className="grid flex-1 grid-cols-7 gap-1"
      >
        {weekDays.map((weekDay) => (
          <li key={weekDay.date}>
            <Button
              aria-pressed={weekDay.date === selectedDate}
              className="h-auto w-full flex-col px-1 py-2 text-xs"
              disabled={weekDay.isDisabled}
              onClick={() => onSelectDate(weekDay.date)}
              title={
                weekDay.isDisabled
                  ? t("availability.dayUnavailable")
                  : undefined
              }
              variant={weekDay.date === selectedDate ? "primary" : "outline"}
            >
              {formatDayLabel(weekDay.date, language)}
            </Button>
          </li>
        ))}
      </ul>
      <Button
        ariaLabel={t("availability.nextWeek")}
        disabled={!canGoToNextWeek}
        onClick={onNextWeek}
        size="icon"
        variant="ghost"
      >
        <ChevronRight aria-hidden="true" className="size-4" />
      </Button>
    </div>
  );
};
