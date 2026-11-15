import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import { BOOKING_STATUS_TONE, type Booking } from "@/domain";
import type { NullableUndefined } from "@/types";
import { formatDateTime, formatTime } from "@/utils";
import {
  AGENDA_LOCALE,
  AGENDA_SEPARATOR,
  DAY_OF_WEEK_BY_INDEX,
  SCHEDULE_CONSTANTS,
  SCHEDULE_VIEW_MODE,
} from "../constants";
import type {
  AgendaBlockViewItem,
  AgendaBookingViewItem,
  AgendaWeekDayViewItem,
  BusinessHours,
  ScheduleBlock,
  UseAgendaCalendarViewModelOptions,
  UseAgendaCalendarViewModelResult,
} from "../models";

const getZonedDateString = (
  dateValue: Date | string,
  timeZone: string,
): string => {
  const dateObject =
    typeof dateValue === "string" ? new Date(dateValue) : dateValue;

  return new Intl.DateTimeFormat(AGENDA_LOCALE.ISO_DATE, {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).format(dateObject);
};

const formatBlockDate = (
  dateValue: Date | string,
  timeZone: string,
  language: string,
): string => {
  const dateObject =
    typeof dateValue === "string" ? new Date(dateValue) : dateValue;

  return new Intl.DateTimeFormat(language, {
    day: "numeric",
    month: "short",
    timeZone,
    year: "numeric",
  }).format(dateObject);
};

const formatBlockTime = (
  dateValue: Date | string,
  timeZone: string,
  language: string,
): string => {
  const dateObject =
    typeof dateValue === "string" ? new Date(dateValue) : dateValue;

  return formatTime(dateObject, timeZone, language);
};

const deduplicateBookings = (bookings: readonly Booking[]): Booking[] => {
  const bookingsMap = new Map<string, Booking>();

  for (const bookingItem of bookings) {
    bookingsMap.set(bookingItem.id, bookingItem);
  }

  return Array.from(bookingsMap.values());
};

const getWeekDays = (baseDate: Date): Date[] => {
  const dateCopy = new Date(baseDate);
  const dayOfWeek = dateCopy.getDay();
  const daysFromMonday =
    (dayOfWeek + SCHEDULE_CONSTANTS.DAYS_IN_WEEK - 1) %
    SCHEDULE_CONSTANTS.DAYS_IN_WEEK;
  const monday = new Date(dateCopy);
  monday.setDate(dateCopy.getDate() - daysFromMonday);

  return Array.from({ length: SCHEDULE_CONSTANTS.DAYS_IN_WEEK }, (_, index) => {
    const weekDay = new Date(monday);
    weekDay.setDate(monday.getDate() + index);
    return weekDay;
  });
};

const formatDayName = (
  date: Date,
  timeZone: string,
  language: string,
): string =>
  new Intl.DateTimeFormat(language, {
    timeZone,
    weekday: "short",
  }).format(date);

const formatDayNumber = (date: Date, timeZone: string): string =>
  new Intl.DateTimeFormat(AGENDA_LOCALE.DAY_NUMBER, {
    day: "numeric",
    timeZone,
  }).format(date);

const isHoursConfigured = (
  businessHours?: NullableUndefined<BusinessHours>,
): boolean => {
  if (!businessHours) {
    return false;
  }

  return Object.values(businessHours).some(
    (ranges) => Array.isArray(ranges) && ranges.length > 0,
  );
};

interface BlockBuilderContext {
  readonly allBusinessLabel: string;
  readonly allDayLabel: string;
  readonly collaboratorLabel: string;
  readonly currentDateString: string;
  readonly language: string;
  readonly onDateChange: (date: Date) => void;
  readonly onDeleteBlock?: (block: ScheduleBlock) => void;
  readonly onViewModeChange: (mode: typeof SCHEDULE_VIEW_MODE.DAY) => void;
  readonly timeZone: string;
}

const buildBlockViewItem = (
  block: ScheduleBlock,
  context: BlockBuilderContext,
): AgendaBlockViewItem => {
  const formattedStartTime = formatBlockTime(
    block.startsAt,
    context.timeZone,
    context.language,
  );
  const formattedEndTime = formatBlockTime(
    block.endsAt,
    context.timeZone,
    context.language,
  );

  const scopeLabel = block.collaboratorId
    ? context.collaboratorLabel
    : context.allBusinessLabel;

  return {
    block,
    displayReasonOrScope: block.reason || scopeLabel,
    formattedDate: formatBlockDate(
      block.startsAt,
      context.timeZone,
      context.language,
    ),
    formattedStartTime,
    formattedTimeRange: block.isFullDay
      ? context.allDayLabel
      : `${formattedStartTime}${AGENDA_SEPARATOR.TIME_RANGE}${formattedEndTime}`,
    fullDayLabel: block.reason || context.allDayLabel,
    id: block.id,
    isFullDay: block.isFullDay,
    isSelectedDate:
      getZonedDateString(block.startsAt, context.timeZone) ===
      context.currentDateString,
    onDelete: (): void => context.onDeleteBlock?.(block),
    onFocusDate: (): void => context.onDateChange(new Date(block.startsAt)),
    onOpenInDayView: (): void => {
      context.onDateChange(new Date(block.startsAt));
      context.onViewModeChange(SCHEDULE_VIEW_MODE.DAY);
    },
    reason: block.reason,
    scopeLabel,
  };
};

const buildBookingViewItem = (
  booking: Booking,
  timeZone: string,
  language: string,
  onSelectBooking: (booking: Booking) => void,
): AgendaBookingViewItem => ({
  booking,
  customerId: booking.customerId,
  durationMinutes: booking.serviceSnapshot.durationMinutes,
  formattedStartTime: formatTime(booking.startsAt, timeZone, language),
  id: booking.id,
  onSelect: (): void => onSelectBooking(booking),
  serviceName: booking.serviceSnapshot.name,
  status: booking.status,
  statusTone: BOOKING_STATUS_TONE[booking.status],
});

export const useAgendaCalendarViewModel = ({
  blocks,
  bookings,
  businessHours,
  currentDate,
  onDateChange,
  onDeleteBlock,
  onSelectBooking,
  onViewModeChange,
  timeZone = SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
  viewMode,
}: UseAgendaCalendarViewModelOptions): UseAgendaCalendarViewModelResult => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const language = i18n.language;
  const allDayLabel = t("schedule.blocks.allDay");
  const collaboratorLabel = t("schedule.blocks.collaborator");
  const allBusinessLabel = t("schedule.blocks.allBusiness");

  const currentDateString = getZonedDateString(currentDate, timeZone);
  const todayDateString = getZonedDateString(new Date(), timeZone);

  const allBlocks = useMemo(() => {
    const context: BlockBuilderContext = {
      allBusinessLabel,
      allDayLabel,
      collaboratorLabel,
      currentDateString,
      language,
      onDateChange,
      onDeleteBlock,
      onViewModeChange,
      timeZone,
    };

    return [...blocks]
      .sort(
        (firstBlock, secondBlock) =>
          new Date(firstBlock.startsAt).getTime() -
          new Date(secondBlock.startsAt).getTime(),
      )
      .map((block) => buildBlockViewItem(block, context));
  }, [
    allBusinessLabel,
    allDayLabel,
    blocks,
    collaboratorLabel,
    currentDateString,
    language,
    onDateChange,
    onDeleteBlock,
    onViewModeChange,
    timeZone,
  ]);

  const deduplicatedBookings = useMemo(
    () => deduplicateBookings(bookings),
    [bookings],
  );

  const weekDays = useMemo((): readonly AgendaWeekDayViewItem[] => {
    const context: BlockBuilderContext = {
      allBusinessLabel,
      allDayLabel,
      collaboratorLabel,
      currentDateString,
      language,
      onDateChange,
      onDeleteBlock,
      onViewModeChange,
      timeZone,
    };

    return getWeekDays(currentDate).map((dayDate) => {
      const dayDateString = getZonedDateString(dayDate, timeZone);
      const dayKey = DAY_OF_WEEK_BY_INDEX[dayDate.getDay()]!;
      const isClosed = Boolean(
        businessHours &&
        (!businessHours[dayKey] || businessHours[dayKey]!.length === 0),
      );

      const dayBookings = deduplicatedBookings
        .filter(
          (booking) =>
            getZonedDateString(booking.startsAt, timeZone) === dayDateString,
        )
        .map((booking) =>
          buildBookingViewItem(booking, timeZone, language, onSelectBooking),
        );

      const dayBlocks = blocks.filter((block) => {
        const blockStartString = getZonedDateString(block.startsAt, timeZone);
        const blockEndString = getZonedDateString(block.endsAt, timeZone);
        return (
          dayDateString >= blockStartString && dayDateString <= blockEndString
        );
      });

      const foundFullDayBlock = dayBlocks.find((block) => block.isFullDay);
      const timedBlocks = dayBlocks
        .filter((block) => !block.isFullDay)
        .map((block) => buildBlockViewItem(block, context));

      return {
        bookings: dayBookings,
        date: dayDate,
        dateKey: dayDateString,
        dayName: formatDayName(dayDate, timeZone, language),
        dayNumber: formatDayNumber(dayDate, timeZone),
        fullDayBlock: foundFullDayBlock
          ? buildBlockViewItem(foundFullDayBlock, context)
          : null,
        isClosed,
        isEmpty: dayBookings.length === 0 && timedBlocks.length === 0,
        isSelected: dayDateString === currentDateString,
        isToday: dayDateString === todayDateString,
        onSelect: (): void => {
          onDateChange(dayDate);
          onViewModeChange(SCHEDULE_VIEW_MODE.DAY);
        },
        timedBlocks,
      };
    });
  }, [
    allBusinessLabel,
    allDayLabel,
    blocks,
    businessHours,
    collaboratorLabel,
    currentDate,
    currentDateString,
    deduplicatedBookings,
    language,
    onDateChange,
    onDeleteBlock,
    onSelectBooking,
    onViewModeChange,
    timeZone,
    todayDateString,
  ]);

  const dayView = useMemo(() => {
    const context: BlockBuilderContext = {
      allBusinessLabel,
      allDayLabel,
      collaboratorLabel,
      currentDateString,
      language,
      onDateChange,
      onDeleteBlock,
      onViewModeChange,
      timeZone,
    };

    const currentDayBookings = deduplicatedBookings
      .filter(
        (booking) =>
          getZonedDateString(booking.startsAt, timeZone) === currentDateString,
      )
      .map((booking) =>
        buildBookingViewItem(booking, timeZone, language, onSelectBooking),
      );

    const currentDayBlockItems = blocks
      .filter((block) => {
        const blockStartString = getZonedDateString(block.startsAt, timeZone);
        const blockEndString = getZonedDateString(block.endsAt, timeZone);
        return (
          currentDateString >= blockStartString &&
          currentDateString <= blockEndString
        );
      })
      .map((block) => buildBlockViewItem(block, context));

    const fullDayBlock =
      currentDayBlockItems.find((block) => block.isFullDay) ?? null;
    const timedBlocks = currentDayBlockItems.filter(
      (block) => !block.isFullDay,
    );

    return {
      bookings: currentDayBookings,
      currentDayBlocks: currentDayBlockItems,
      fullDayBlock,
      isEmpty: currentDayBookings.length === 0 && timedBlocks.length === 0,
      timedBlocks,
    };
  }, [
    allBusinessLabel,
    allDayLabel,
    blocks,
    collaboratorLabel,
    currentDateString,
    deduplicatedBookings,
    language,
    onDateChange,
    onDeleteBlock,
    onSelectBooking,
    onViewModeChange,
    timeZone,
  ]);

  const formattedCurrentDate = formatDateTime(currentDate, timeZone, language);
  const lastWeekDayIndex = SCHEDULE_CONSTANTS.DAYS_IN_WEEK - 1;
  const firstWeekDay = weekDays[0];
  const lastWeekDay = weekDays[lastWeekDayIndex];
  const formattedWeekRange =
    firstWeekDay && lastWeekDay
      ? `${formatBlockDate(firstWeekDay.date, timeZone, language)}${AGENDA_SEPARATOR.DATE_RANGE}${formatBlockDate(lastWeekDay.date, timeZone, language)}`
      : formattedCurrentDate;

  const isDayView = viewMode === SCHEDULE_VIEW_MODE.DAY;

  const handlePrevious = (): void => {
    const nextDate = new Date(currentDate);
    const dayDelta = isDayView ? 1 : SCHEDULE_CONSTANTS.DAYS_IN_WEEK;
    nextDate.setDate(nextDate.getDate() - dayDelta);
    onDateChange(nextDate);
  };

  const handleNext = (): void => {
    const nextDate = new Date(currentDate);
    const dayDelta = isDayView ? 1 : SCHEDULE_CONSTANTS.DAYS_IN_WEEK;
    nextDate.setDate(nextDate.getDate() + dayDelta);
    onDateChange(nextDate);
  };

  const handleToday = (): void => {
    onDateChange(new Date());
  };

  const handleSwitchToDayView = (): void => {
    onViewModeChange(SCHEDULE_VIEW_MODE.DAY);
  };

  const handleSwitchToWeekView = (): void => {
    onViewModeChange(SCHEDULE_VIEW_MODE.WEEK);
  };

  return {
    allBlocks,
    dayView,
    formattedHeaderTitle: isDayView ? formattedCurrentDate : formattedWeekRange,
    handleNext,
    handlePrevious,
    handleSwitchToDayView,
    handleSwitchToWeekView,
    handleToday,
    hasConfiguredHours: isHoursConfigured(businessHours),
    hasDeleteBlockAction: Boolean(onDeleteBlock),
    isDayView,
    isWeekView: !isDayView,
    timeZone,
    weekDays,
  };
};
