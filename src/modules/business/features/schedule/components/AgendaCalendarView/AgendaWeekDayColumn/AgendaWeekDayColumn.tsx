import { Ban, Clock, User } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  BookingStatusLabel,
  Button,
  Card,
  StatusBadge,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { cn } from "@/utils";
import { AGENDA_WEEK_DAY_COLUMN_CONFIG } from "./AgendaWeekDayColumn.constants";
import type { AgendaWeekDayColumnProps } from "./AgendaWeekDayColumn.types";

export const AgendaWeekDayColumn = ({
  dayItem,
}: AgendaWeekDayColumnProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-xl border p-3 transition-all text-xs min-h-[240px]",
        dayItem.isClosed
          ? "bg-muted/40 border-border/60 opacity-80"
          : "bg-card border-border",
        dayItem.isSelected && "ring-2 ring-primary/40 border-primary/40",
        dayItem.isToday && "border-primary font-medium",
      )}
    >
      <Button
        className="flex items-center justify-between pb-2 border-b border-border/60 text-left hover:text-primary transition-colors cursor-pointer w-full h-auto p-0 font-normal"
        variant={AGENDA_WEEK_DAY_COLUMN_CONFIG.DAY_HEADER_BUTTON_VARIANT}
        onClick={dayItem.onSelect}
      >
        <div className="flex items-center gap-1.5">
          <span className="font-semibold capitalize text-foreground">
            {dayItem.dayName}
          </span>
          <span className="text-muted-foreground">{dayItem.dayNumber}</span>
        </div>
        {dayItem.isToday && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            {t("schedule.agenda.today")}
          </span>
        )}
      </Button>

      {dayItem.fullDayBlock ? (
        <div className="p-1.5 rounded-md bg-destructive/15 text-destructive text-[11px] font-medium flex items-center gap-1">
          <Ban className="size-3 shrink-0" />
          <span className="truncate">{dayItem.fullDayBlock.fullDayLabel}</span>
        </div>
      ) : dayItem.isClosed ? (
        <span className="text-[11px] text-muted-foreground italic py-1 text-center">
          {t("schedule.hours.closedDay")}
        </span>
      ) : dayItem.isEmpty ? (
        <span className="text-[11px] text-muted-foreground font-medium py-1">
          {t("schedule.agenda.freeSlots")}
        </span>
      ) : null}

      {dayItem.timedBlocks.map((blockItem) => (
        <div
          className="p-1.5 rounded-md bg-destructive/10 text-destructive text-[11px] border border-destructive/20 flex flex-col gap-0.5"
          key={blockItem.id}
        >
          <span className="font-semibold flex items-center gap-1">
            <Clock className="size-2.5" />
            {blockItem.formattedStartTime}
          </span>
          {blockItem.reason && (
            <span className="text-[10px] truncate opacity-90">
              {blockItem.reason}
            </span>
          )}
        </div>
      ))}

      <div className="flex flex-col gap-1.5 mt-0.5">
        {dayItem.bookings.map((bookingItem) => (
          <Card
            className="p-2 rounded-lg border border-border/80 bg-card hover:bg-muted/60 transition-colors text-left flex flex-col gap-1 cursor-pointer shadow-2xs"
            hoverable
            key={bookingItem.id}
            onClick={bookingItem.onSelect}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="font-semibold text-primary text-[11px]">
                {bookingItem.formattedStartTime}
              </span>
              <StatusBadge tone={bookingItem.statusTone}>
                <BookingStatusLabel status={bookingItem.status} />
              </StatusBadge>
            </div>
            <span className="font-medium text-foreground truncate text-[11px]">
              {bookingItem.serviceName}
            </span>
            <span className="text-muted-foreground truncate text-[10px] flex items-center gap-1">
              <User className="size-2.5" />
              {bookingItem.customerId}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
};
