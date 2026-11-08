import { useMemo, useState } from "react";
import { PAGINATION } from "@/constants";
import { BOOKING_STATUS, type Booking } from "@/domain";
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
  readonly agendaBookings: readonly Booking[];
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
  readonly handleHistoryNextPage: () => void;
  readonly handleHistoryPreviousPage: () => void;
  readonly handleOpenCancel: () => void;
  readonly handleOpenReschedule: () => void;
  readonly handleSelectBooking: (booking: Booking) => void;
  readonly handleUpcomingNextPage: () => void;
  readonly handleUpcomingPreviousPage: () => void;
  readonly hasHistoryNextPage: boolean;
  readonly hasHistoryPreviousPage: boolean;
  readonly hasUpcomingNextPage: boolean;
  readonly hasUpcomingPreviousPage: boolean;
  readonly historyFilters: BookingHistoryFilterValues;
  readonly historyPage: number;
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
  readonly upcomingPage: number;
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
  const [upcomingPage, setUpcomingPage] = useState<number>(1);
  const [historyPage, setHistoryPage] = useState<number>(1);

  const [historyFilters, setHistoryFilters] =
    useState<BookingHistoryFilterValues>({
      status: SCHEDULE_CONSTANTS.ALL_FILTER_VALUE,
    });

  const businessHoursQuery = useBusinessHoursQuery(businessId);
  const scheduleBlocksQuery = useScheduleBlocksQuery(businessId);
  const bookingListQuery = useBookingListQuery(
    businessId,
    upcomingPage,
    PAGINATION.DEFAULT_PAGE_SIZE,
  );

  const timeZone =
    businessHoursQuery.data?.timeZone ||
    SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE;

  const bookingHistoryQuery = useBookingHistoryQuery(
    businessId,
    historyFilters,
    historyPage,
    PAGINATION.DEFAULT_PAGE_SIZE,
    timeZone,
  );
  const activeServicesQuery = useActiveServicesQuery(businessId);

  const blockViewModel = useScheduleBlockViewModel((createdDate) => {
    setSelectedDate(createdDate);
  });

  const totalUpcomingCount = bookingListQuery.data?.totalCount ?? 0;
  const hasUpcomingNextPage =
    upcomingPage * PAGINATION.DEFAULT_PAGE_SIZE < totalUpcomingCount;
  const hasUpcomingPreviousPage = upcomingPage > 1;

  const handleUpcomingNextPage = (): void => {
    if (hasUpcomingNextPage) {
      setUpcomingPage((previousPage) => previousPage + 1);
    }
  };

  const handleUpcomingPreviousPage = (): void => {
    if (hasUpcomingPreviousPage) {
      setUpcomingPage((previousPage) => Math.max(1, previousPage - 1));
    }
  };

  const totalHistoryCount = bookingHistoryQuery.data?.totalCount ?? 0;
  const hasHistoryNextPage =
    historyPage * PAGINATION.DEFAULT_PAGE_SIZE < totalHistoryCount;
  const hasHistoryPreviousPage = historyPage > 1;

  const handleHistoryNextPage = (): void => {
    if (hasHistoryNextPage) {
      setHistoryPage((previousPage) => previousPage + 1);
    }
  };

  const handleHistoryPreviousPage = (): void => {
    if (hasHistoryPreviousPage) {
      setHistoryPage((previousPage) => Math.max(1, previousPage - 1));
    }
  };

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
    setHistoryPage(1);
  };

  const handleClearFilters = (): void => {
    setHistoryFilters({ status: SCHEDULE_CONSTANTS.ALL_FILTER_VALUE });
    setHistoryPage(1);
  };

  const agendaBookings = useMemo(() => {
    const bookingsMap = new Map<string, Booking>();

    // First insert list bookings
    for (const booking of bookingListQuery.data?.bookings ?? []) {
      bookingsMap.set(booking.id, booking);
    }

    // Then merge with history bookings (preferring terminal status updates like cancelled)
    for (const booking of bookingHistoryQuery.data?.bookings ?? []) {
      const existing = bookingsMap.get(booking.id);
      if (!existing) {
        bookingsMap.set(booking.id, booking);
      } else if (
        booking.status === BOOKING_STATUS.CANCELLED ||
        booking.status === BOOKING_STATUS.COMPLETED ||
        booking.status === BOOKING_STATUS.NO_SHOW
      ) {
        bookingsMap.set(booking.id, booking);
      }
    }

    return Array.from(bookingsMap.values());
  }, [bookingHistoryQuery.data?.bookings, bookingListQuery.data?.bookings]);

  return {
    activeTab,
    agendaBookings,
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
    handleHistoryNextPage,
    handleHistoryPreviousPage,
    handleOpenCancel,
    handleOpenReschedule,
    handleSelectBooking,
    handleUpcomingNextPage,
    handleUpcomingPreviousPage,
    hasHistoryNextPage,
    hasHistoryPreviousPage,
    hasUpcomingNextPage,
    hasUpcomingPreviousPage,
    historyFilters,
    historyPage,
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
    timeZone,
    totalHistoryCount,
    totalUpcomingCount,
    upcomingPage,
  };
};
