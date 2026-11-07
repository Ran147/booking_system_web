import { Ban, ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  BookingStatusLabel,
  Button,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  Card,
  StatusBadge,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import { BOOKING_STATUS_TONE, type Booking } from "@/domain";
import {
  SCHEDULE_CONSTANTS,
  SCHEDULE_VIEW_MODE,
  type ScheduleBlock,
  type ScheduleViewMode,
} from "@/modules/business/features/schedule";
import { formatDateTime } from "@/utils";

interface AgendaCalendarViewProps {
  readonly blocks: readonly ScheduleBlock[];
  readonly bookings: readonly Booking[];
  readonly currentDate: Date;
  readonly onDateChange: (date: Date) => void;
  readonly onSelectBooking: (booking: Booking) => void;
  readonly onViewModeChange: (mode: ScheduleViewMode) => void;
  readonly timeZone?: string;
  readonly viewMode: ScheduleViewMode;
}

export const AgendaCalendarView = ({
  blocks,
  bookings,
  currentDate,
  onDateChange,
  onSelectBooking,
  onViewModeChange,
  timeZone = "UTC",
  viewMode,
}: AgendaCalendarViewProps): ReactElement => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  const handlePrevious = (): void => {
    const nextDate = new Date(currentDate);
    const dayDelta =
      viewMode === SCHEDULE_VIEW_MODE.DAY ? 1 : SCHEDULE_CONSTANTS.DAYS_IN_WEEK;
    nextDate.setDate(nextDate.getDate() - dayDelta);
    onDateChange(nextDate);
  };

  const handleNext = (): void => {
    const nextDate = new Date(currentDate);
    const dayDelta =
      viewMode === SCHEDULE_VIEW_MODE.DAY ? 1 : SCHEDULE_CONSTANTS.DAYS_IN_WEEK;
    nextDate.setDate(nextDate.getDate() + dayDelta);
    onDateChange(nextDate);
  };

  const handleToday = (): void => {
    onDateChange(new Date());
  };

  const isSameDay = (first: Date, second: Date): boolean => {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    );
  };

  const currentDayBookings = bookings.filter((booking) =>
    isSameDay(booking.startsAt, currentDate),
  );

  const currentDayBlocks = blocks.filter((block) => {
    if (block.isFullDay) {
      return (
        currentDate >= new Date(block.startsAt) &&
        currentDate <= new Date(block.endsAt)
      );
    }
    return isSameDay(block.startsAt, currentDate);
  });

  const formattedCurrentDate = formatDateTime(
    currentDate,
    timeZone,
    i18n.language,
  );

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              size={BUTTON_SIZE.SM}
              variant={BUTTON_VARIANT.OUTLINE}
              onClick={handleToday}
            >
              {t("schedule.agenda.today")}
            </Button>
            <Button
              ariaLabel={t("schedule.agenda.previous")}
              size={BUTTON_SIZE.ICON}
              variant={BUTTON_VARIANT.OUTLINE}
              onClick={handlePrevious}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              ariaLabel={t("schedule.agenda.next")}
              size={BUTTON_SIZE.ICON}
              variant={BUTTON_VARIANT.OUTLINE}
              onClick={handleNext}
            >
              <ChevronRight className="size-4" />
            </Button>

            <span className="text-base font-semibold text-foreground ml-2 capitalize">
              {formattedCurrentDate}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border p-0.5 bg-muted/40">
              <Button
                size={BUTTON_SIZE.SM}
                variant={
                  viewMode === SCHEDULE_VIEW_MODE.DAY
                    ? BUTTON_VARIANT.DEFAULT
                    : BUTTON_VARIANT.GHOST
                }
                onClick={() => onViewModeChange(SCHEDULE_VIEW_MODE.DAY)}
              >
                {t("schedule.agenda.viewDay")}
              </Button>
              <Button
                size={BUTTON_SIZE.SM}
                variant={
                  viewMode === SCHEDULE_VIEW_MODE.WEEK
                    ? BUTTON_VARIANT.DEFAULT
                    : BUTTON_VARIANT.GHOST
                }
                onClick={() => onViewModeChange(SCHEDULE_VIEW_MODE.WEEK)}
              >
                {t("schedule.agenda.viewWeek")}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              {t("schedule.bookings.todayBookingsCount", {
                count: currentDayBookings.length,
              })}
            </h3>
            <span className="text-xs text-muted-foreground">
              {t("schedule.bookings.timeZoneNotice", { timeZone })}
            </span>
          </div>

          {currentDayBookings.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-sm border-dashed">
              {t("schedule.agenda.noBookings")}
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {currentDayBookings.map((booking) => (
                <Card
                  className="p-3.5 flex items-center justify-between cursor-pointer w-full text-left"
                  hoverable
                  key={booking.id}
                  onClick={() => onSelectBooking(booking)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <Clock className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-foreground">
                        {booking.serviceSnapshot.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <User className="size-3" />
                        {booking.customerId}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {t("schedule.bookings.durationMinutes", {
                        minutes: booking.serviceSnapshot.durationMinutes,
                      })}
                    </span>
                    <StatusBadge tone={BOOKING_STATUS_TONE[booking.status]}>
                      <BookingStatusLabel status={booking.status} />
                    </StatusBadge>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Ban className="size-4 text-destructive" />
            {t("schedule.blocks.title")} ({currentDayBlocks.length})
          </h3>

          {currentDayBlocks.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground text-xs border-dashed">
              {t("schedule.bookings.noBlocksForDate")}
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {currentDayBlocks.map((block) => (
                <div
                  className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 flex flex-col gap-1 text-xs"
                  key={block.id}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {block.isFullDay
                        ? t("schedule.blocks.allDay")
                        : formatDateTime(
                            block.startsAt,
                            timeZone,
                            i18n.language,
                          )}
                    </span>
                    <span className="text-muted-foreground">
                      {block.collaboratorId
                        ? t("schedule.blocks.collaborator")
                        : t("schedule.blocks.allBusiness")}
                    </span>
                  </div>
                  {block.reason && (
                    <span className="text-muted-foreground italic">
                      {block.reason}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
