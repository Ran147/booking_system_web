import {
  Ban,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Trash2,
  User,
} from "lucide-react";
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
import { cn, formatDateTime, formatTime } from "@/utils";

interface AgendaCalendarViewProps {
  readonly blocks: readonly ScheduleBlock[];
  readonly bookings: readonly Booking[];
  readonly currentDate: Date;
  readonly onDateChange: (date: Date) => void;
  readonly onDeleteBlock?: (block: ScheduleBlock) => void;
  readonly onSelectBooking: (booking: Booking) => void;
  readonly onViewModeChange: (mode: ScheduleViewMode) => void;
  readonly timeZone?: string;
  readonly viewMode: ScheduleViewMode;
}

const getZonedDateString = (date: Date | string, tz: string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: tz,
    year: "numeric",
  }).format(dateObj);
};

const formatBlockDate = (
  date: Date | string,
  tz: string,
  lang: string,
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(lang, {
    day: "numeric",
    month: "short",
    timeZone: tz,
    year: "numeric",
  }).format(dateObj);
};

const formatBlockTime = (
  date: Date | string,
  tz: string,
  lang: string,
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return formatTime(dateObj, tz, lang);
};

export const AgendaCalendarView = ({
  blocks,
  bookings,
  currentDate,
  onDateChange,
  onDeleteBlock,
  onSelectBooking,
  onViewModeChange,
  timeZone = SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
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

  const currentDateStr = getZonedDateString(currentDate, timeZone);

  const currentDayBookings = bookings.filter(
    (booking) =>
      getZonedDateString(booking.startsAt, timeZone) === currentDateStr,
  );

  const currentDayBlocks = blocks.filter((block) => {
    const blockStartStr = getZonedDateString(block.startsAt, timeZone);
    const blockEndStr = getZonedDateString(block.endsAt, timeZone);
    return currentDateStr >= blockStartStr && currentDateStr <= blockEndStr;
  });

  const sortedBlocks = [...blocks].sort(
    (firstBlock, secondBlock) =>
      new Date(firstBlock.startsAt).getTime() -
      new Date(secondBlock.startsAt).getTime(),
  );

  const fullDayBlock = currentDayBlocks.find((block) => block.isFullDay);
  const timedBlocks = currentDayBlocks.filter((block) => !block.isFullDay);

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

      {fullDayBlock && (
        <div
          className="p-4 rounded-xl border border-destructive/40 bg-destructive/10 flex items-center justify-between gap-3 text-destructive shadow-xs"
          role="status"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-destructive/20 text-destructive">
              <Ban className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {t("schedule.blocks.allDayBlockedNotice", {
                  defaultValue: "Day blocked for bookings",
                })}
              </span>
              <span className="text-xs text-muted-foreground">
                {fullDayBlock.reason ||
                  (fullDayBlock.collaboratorId
                    ? t("schedule.blocks.collaborator")
                    : t("schedule.blocks.allBusiness"))}
              </span>
            </div>
          </div>
          {onDeleteBlock && (
            <Button
              className="text-destructive hover:bg-destructive/15 border-destructive/30"
              size={BUTTON_SIZE.SM}
              variant={BUTTON_VARIANT.OUTLINE}
              onClick={() => onDeleteBlock(fullDayBlock)}
            >
              <Trash2 className="size-3.5 mr-1" />
              {t("schedule.blocks.deleteAction", {
                defaultValue: "Delete block",
              })}
            </Button>
          )}
        </div>
      )}

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

          {currentDayBookings.length === 0 && timedBlocks.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground text-sm border-dashed">
              {t("schedule.agenda.noBookings")}
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {timedBlocks.map((block) => (
                <div
                  className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/5 flex items-center justify-between gap-3 text-left w-full shadow-xs"
                  key={block.id}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-destructive/15 text-destructive">
                      <Ban className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-destructive">
                          {t("schedule.blocks.blockedSlot", {
                            defaultValue: "Blocked schedule",
                          })}
                        </span>
                        <span className="text-xs font-semibold text-destructive/90 bg-destructive/10 px-2 py-0.5 rounded">
                          {formatTime(block.startsAt, timeZone, i18n.language)}{" "}
                          - {formatTime(block.endsAt, timeZone, i18n.language)}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                        {block.reason ||
                          (block.collaboratorId
                            ? t("schedule.blocks.collaborator")
                            : t("schedule.blocks.allBusiness"))}
                      </span>
                    </div>
                  </div>

                  {onDeleteBlock && (
                    <Button
                      ariaLabel={t("schedule.blocks.deleteAction", {
                        defaultValue: "Delete",
                      })}
                      className="text-destructive hover:bg-destructive/15"
                      size={BUTTON_SIZE.ICON}
                      variant={BUTTON_VARIANT.GHOST}
                      onClick={() => onDeleteBlock(block)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}

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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">
                          {booking.serviceSnapshot.name}
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          {formatTime(
                            booking.startsAt,
                            timeZone,
                            i18n.language,
                          )}
                        </span>
                      </div>
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

        <div className="flex flex-col gap-5">
          {/* Blocks on Selected Date */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Ban className="size-4 text-destructive" />
                {t("schedule.blocks.currentDayTitle", {
                  defaultValue: "Blocks for selected date",
                })}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">
                {currentDayBlocks.length}
              </span>
            </h3>

            {currentDayBlocks.length === 0 ? (
              <Card className="p-4 text-center text-muted-foreground text-xs border-dashed">
                {t("schedule.bookings.noBlocksForDate")}
              </Card>
            ) : (
              <div className="flex flex-col gap-2">
                {currentDayBlocks.map((block) => (
                  <div
                    className="p-3.5 rounded-xl border border-destructive/40 bg-destructive/10 flex flex-col gap-2 text-xs shadow-xs"
                    key={block.id}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <Clock className="size-3.5 text-destructive" />
                        {block.isFullDay
                          ? t("schedule.blocks.allDay")
                          : `${formatBlockTime(block.startsAt, timeZone, i18n.language)} - ${formatBlockTime(block.endsAt, timeZone, i18n.language)}`}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-destructive/15 text-destructive font-medium text-[11px]">
                        {block.collaboratorId
                          ? t("schedule.blocks.collaborator")
                          : t("schedule.blocks.allBusiness")}
                      </span>
                    </div>
                    {block.reason && (
                      <span className="text-foreground/80 font-medium">
                        {block.reason}
                      </span>
                    )}
                    {onDeleteBlock && (
                      <div className="flex justify-end pt-1">
                        <Button
                          className="text-destructive hover:bg-destructive/15 h-7 text-xs"
                          size={BUTTON_SIZE.SM}
                          variant={BUTTON_VARIANT.GHOST}
                          onClick={() => onDeleteBlock(block)}
                        >
                          <Trash2 className="size-3 mr-1" />
                          {t("schedule.blocks.deleteAction", {
                            defaultValue: "Delete",
                          })}
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* All Scheduled Blocks */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Calendar className="size-4 text-primary" />
                {t("schedule.blocks.allActiveBlocksTitle", {
                  defaultValue: "All active blocks",
                })}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                {sortedBlocks.length}
              </span>
            </h3>

            {sortedBlocks.length === 0 ? (
              <Card className="p-4 text-center text-muted-foreground text-xs border-dashed">
                {t("schedule.blocks.noBlocksRegistered", {
                  defaultValue: "No active schedule blocks registered.",
                })}
              </Card>
            ) : (
              <div className="flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
                {sortedBlocks.map((block) => {
                  const isBlockSelectedDate =
                    getZonedDateString(block.startsAt, timeZone) ===
                    currentDateStr;
                  return (
                    <div
                      className={cn(
                        "p-3 rounded-xl border flex flex-col gap-2 text-xs transition-colors shadow-xs",
                        isBlockSelectedDate
                          ? "border-destructive/60 bg-destructive/10 ring-1 ring-destructive/40"
                          : "border-border/80 bg-card hover:border-destructive/30",
                      )}
                      key={block.id}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-foreground flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-destructive" />
                          {formatBlockDate(
                            block.startsAt,
                            timeZone,
                            i18n.language,
                          )}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-destructive/15 text-destructive font-medium text-[11px]">
                          {block.collaboratorId
                            ? t("schedule.blocks.collaborator")
                            : t("schedule.blocks.allBusiness")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium">
                          <Clock className="size-3 text-destructive/80" />
                          {block.isFullDay
                            ? t("schedule.blocks.allDay")
                            : `${formatBlockTime(block.startsAt, timeZone, i18n.language)} - ${formatBlockTime(block.endsAt, timeZone, i18n.language)}`}
                        </span>
                        {block.reason && (
                          <span
                            className="font-medium text-foreground/90 max-w-[120px] truncate"
                            title={block.reason}
                          >
                            {block.reason}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        <Button
                          className="h-6 text-[11px] px-2 text-primary hover:text-primary/80"
                          size={BUTTON_SIZE.SM}
                          variant={BUTTON_VARIANT.GHOST}
                          onClick={() => onDateChange(new Date(block.startsAt))}
                        >
                          {t("schedule.blocks.goToDate", {
                            defaultValue: "View in calendar",
                          })}
                        </Button>
                        {onDeleteBlock && (
                          <Button
                            className="h-6 text-[11px] px-2 text-destructive hover:bg-destructive/15"
                            size={BUTTON_SIZE.SM}
                            variant={BUTTON_VARIANT.GHOST}
                            onClick={() => onDeleteBlock(block)}
                          >
                            <Trash2 className="size-3 mr-1" />
                            {t("schedule.blocks.deleteAction", {
                              defaultValue: "Delete",
                            })}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
