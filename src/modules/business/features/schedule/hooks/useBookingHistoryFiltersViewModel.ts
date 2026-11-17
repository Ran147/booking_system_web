import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import type { SelectFieldOption } from "@/components/common";
import { I18N_NAMESPACE, STRING } from "@/constants";
import { BOOKING_STATUS, type BookingStatus } from "@/domain";
import { SCHEDULE_CONSTANTS } from "../constants";
import type { BookingHistoryFilterValues } from "../models";

export interface UseBookingHistoryFiltersViewModelOptions {
  readonly filters: BookingHistoryFilterValues;
  readonly onFilterChange: <Key extends keyof BookingHistoryFilterValues>(
    key: Key,
    value: BookingHistoryFilterValues[Key],
  ) => void;
}

export interface BookingHistoryFiltersViewModelResult {
  readonly dateValue: string;
  readonly handleDateChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly handleStatusChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  readonly statusOptions: readonly SelectFieldOption[];
  readonly statusValue: string;
}

export const useBookingHistoryFiltersViewModel = ({
  filters,
  onFilterChange,
}: UseBookingHistoryFiltersViewModelOptions): BookingHistoryFiltersViewModelResult => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);

  const statusOptions: readonly SelectFieldOption[] = [
    {
      label: t("schedule.history.allStatuses"),
      value: SCHEDULE_CONSTANTS.ALL_FILTER_VALUE,
    },
    {
      label: t("common:bookingStatus.pending"),
      value: BOOKING_STATUS.PENDING,
    },
    {
      label: t("common:bookingStatus.confirmed"),
      value: BOOKING_STATUS.CONFIRMED,
    },
    {
      label: t("common:bookingStatus.completed"),
      value: BOOKING_STATUS.COMPLETED,
    },
    {
      label: t("common:bookingStatus.cancelled"),
      value: BOOKING_STATUS.CANCELLED,
    },
    {
      label: t("common:bookingStatus.no_show"),
      value: BOOKING_STATUS.NO_SHOW,
    },
  ];

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>): void => {
    onFilterChange("date", event.target.value);
  };

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>): void => {
    onFilterChange(
      "status",
      event.target.value as
        BookingStatus | typeof SCHEDULE_CONSTANTS.ALL_FILTER_VALUE,
    );
  };

  return {
    dateValue: filters.date ?? filters.startDate ?? STRING.EMPTY,
    handleDateChange,
    handleStatusChange,
    statusOptions,
    statusValue: filters.status ?? SCHEDULE_CONSTANTS.ALL_FILTER_VALUE,
  };
};
