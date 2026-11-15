import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CURRENCY_CODE, I18N_NAMESPACE, type Tone } from "@/constants";
import {
  BOOKING_STATUS_TONE,
  type Booking,
  type BookingStatus,
} from "@/domain";
import { formatDateTime, formatPrice } from "@/utils";
import { SCHEDULE_CONSTANTS } from "../constants";

export interface BookingTableRowItem {
  readonly customerId: string;
  readonly formattedDate: string;
  readonly formattedPrice: string;
  readonly id: string;
  readonly onSelect: () => void;
  readonly serviceName: string;
  readonly status: BookingStatus;
  readonly statusTone: Tone;
}

export interface UseBookingTableViewModelOptions {
  readonly bookings: readonly Booking[];
  readonly currencyCode?: string;
  readonly isLoading?: boolean;
  readonly onSelectBooking: (booking: Booking) => void;
  readonly timeZone?: string;
}

export interface BookingTableViewModelResult {
  readonly isEmpty: boolean;
  readonly rows: readonly BookingTableRowItem[];
}

export const useBookingTableViewModel = ({
  bookings,
  currencyCode = CURRENCY_CODE.CRC,
  isLoading = false,
  onSelectBooking,
  timeZone = SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
}: UseBookingTableViewModelOptions): BookingTableViewModelResult => {
  const { i18n } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const language = i18n.language;

  const rows = useMemo(
    () =>
      bookings.map((booking) => ({
        customerId: booking.customerId,
        formattedDate: formatDateTime(booking.startsAt, timeZone, language),
        formattedPrice: formatPrice(
          booking.serviceSnapshot.priceInCents,
          currencyCode,
          language,
        ),
        id: booking.id,
        onSelect: (): void => onSelectBooking(booking),
        serviceName: booking.serviceSnapshot.name,
        status: booking.status,
        statusTone: BOOKING_STATUS_TONE[booking.status],
      })),
    [bookings, currencyCode, language, onSelectBooking, timeZone],
  );

  return {
    isEmpty: bookings.length === 0 && !isLoading,
    rows,
  };
};
