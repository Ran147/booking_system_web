import { useState } from "react";
import type { Booking } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable, NullableUndefined } from "@/types";
import {
  useBookingHistoryQuery,
  useBookingListQuery,
  useBusinessHoursQuery,
  useScheduleBlocksQuery,
} from "../api";
import { useActiveServicesQuery } from "../api/useActiveServicesQuery";
import {
  SCHEDULE_CONSTANTS,
  SCHEDULE_TAB,
  SCHEDULE_VIEW_MODE,
  type ScheduleTab,
  type ScheduleViewMode,
} from "../constants";
import type {
  ActiveServiceOption,
  BookingHistoryFilterValues,
  BusinessHours,
  ScheduleBlock,
} from "../models";
import {
  useScheduleBlockViewModel,
  type ScheduleBlockViewModelResult,
} from "./useScheduleBlockViewModel";

export interface ScheduleViewModelResult {
  readonly activeTab: ScheduleTab;
  readonly blockViewModel: ScheduleBlockViewModelResult;
  readonly bookingHistory: readonly Booking[];
  readonly bookingList: readonly Booking[];
  readonly businessHours: NullableUndefined<BusinessHours>;
  readonly calendarViewMode: ScheduleViewMode;
  readonly handleClearFilters: () => void;
  readonly handleCloseCancel: () => void;
  readonly handleCloseDetail: () => void;
  readonly handleCloseReschedule: () => void;
  readonly handleFilterChange: <Key extends keyof BookingHistoryFilterValues>(
    key: Key,
    value: BookingHistoryFilterValues[Key],
  ) => void;
  readonly handleOpenCancel: () => void;
  readonly handleOpenReschedule: () => void;
  readonly handleSelectBooking: (booking: Booking) => void;
  readonly historyFilters: BookingHistoryFilterValues;
  readonly isCancelOpen: boolean;
  readonly isDetailOpen: boolean;
  readonly isLoading: boolean;
  readonly isNewBookingOpen: boolean;
  readonly isRescheduleOpen: boolean;
  readonly scheduleBlocks: readonly ScheduleBlock[];
  readonly selectedBooking: Nullable<Booking>;
  readonly selectedBookingHasStarted: boolean;
  readonly selectedDate: Date;
  readonly services: readonly ActiveServiceOption[];
  readonly setActiveTab: (tab: ScheduleTab) => void;
  readonly setCalendarViewMode: (viewMode: ScheduleViewMode) => void;
  readonly setIsNewBookingOpen: (isOpen: boolean) => void;
  readonly setSelectedDate: (date: Date) => void;
  readonly timeZone: string;
  readonly totalHistoryCount: number;
  readonly totalUpcomingCount: number;
}

export const useScheduleViewModel = (): ScheduleViewModelResult => {
  const { businessId } = useCurrentBusiness();

  const [activeTab, setActiveTab] = useState<ScheduleTab>(SCHEDULE_TAB.AGENDA);
  const [selectedBooking, setSelectedBooking] =
    useState<Nullable<Booking>>(null);
  const [selectedBookingHasStarted, setSelectedBookingHasStarted] =
    useState<boolean>(false);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState<boolean>(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState<boolean>(false);
  const [isCancelOpen, setIsCancelOpen] = useState<boolean>(false);

  const [calendarViewMode, setCalendarViewMode] = useState<ScheduleViewMode>(
    SCHEDULE_VIEW_MODE.DAY,
  );
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const [historyFilters, setHistoryFilters] =
    useState<BookingHistoryFilterValues>({
      status: SCHEDULE_CONSTANTS.ALL_FILTER_VALUE,
    });

  const businessHoursQuery = useBusinessHoursQuery(businessId);
  const scheduleBlocksQuery = useScheduleBlocksQuery(businessId);
  const bookingListQuery = useBookingListQuery(businessId);
  const bookingHistoryQuery = useBookingHistoryQuery(
    businessId,
    historyFilters,
  );
  const activeServicesQuery = useActiveServicesQuery(businessId);

  const blockViewModel = useScheduleBlockViewModel();

  const handleSelectBooking = (booking: Booking): void => {
    setSelectedBooking(booking);
    setSelectedBookingHasStarted(booking.startsAt.getTime() <= Date.now());
    setIsDetailOpen(true);
  };

  const handleCloseDetail = (): void => {
    setIsDetailOpen(false);
  };

  const handleOpenReschedule = (): void => {
    setIsDetailOpen(false);
    setIsRescheduleOpen(true);
  };

  const handleCloseReschedule = (): void => {
    setIsRescheduleOpen(false);
  };

  const handleOpenCancel = (): void => {
    setIsDetailOpen(false);
    setIsCancelOpen(true);
  };

  const handleCloseCancel = (): void => {
    setIsCancelOpen(false);
  };

  const handleFilterChange = <Key extends keyof BookingHistoryFilterValues>(
    key: Key,
    value: BookingHistoryFilterValues[Key],
  ): void => {
    setHistoryFilters((previous) => ({ ...previous, [key]: value }));
  };

  const handleClearFilters = (): void => {
    setHistoryFilters({ status: SCHEDULE_CONSTANTS.ALL_FILTER_VALUE });
  };

  return {
    activeTab,
    blockViewModel,
    bookingHistory: bookingHistoryQuery.data?.bookings ?? [],
    bookingList: bookingListQuery.data?.bookings ?? [],
    businessHours: businessHoursQuery.data?.businessHours,
    calendarViewMode,
    handleClearFilters,
    handleCloseCancel,
    handleCloseDetail,
    handleCloseReschedule,
    handleFilterChange,
    handleOpenCancel,
    handleOpenReschedule,
    handleSelectBooking,
    historyFilters,
    isCancelOpen,
    isDetailOpen,
    isLoading:
      businessHoursQuery.isLoading ||
      bookingListQuery.isLoading ||
      bookingHistoryQuery.isLoading,
    isNewBookingOpen,
    isRescheduleOpen,
    scheduleBlocks: scheduleBlocksQuery.data ?? [],
    selectedBooking,
    selectedBookingHasStarted,
    selectedDate,
    services: activeServicesQuery.data ?? [],
    setActiveTab,
    setCalendarViewMode,
    setIsNewBookingOpen,
    setSelectedDate,
    timeZone:
      businessHoursQuery.data?.timeZone &&
      businessHoursQuery.data.timeZone !== SCHEDULE_CONSTANTS.UTC_TIME_ZONE
        ? businessHoursQuery.data.timeZone
        : Intl.DateTimeFormat().resolvedOptions().timeZone,
    totalHistoryCount: bookingHistoryQuery.data?.totalCount ?? 0,
    totalUpcomingCount: bookingListQuery.data?.totalCount ?? 0,
  };
};
