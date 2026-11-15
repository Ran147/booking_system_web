import { useTranslation } from "react-i18next";
import {
  CURRENCY_CODE,
  I18N_NAMESPACE,
  STRING,
  TONE,
  type Tone,
} from "@/constants";
import { BOOKING_STATUS, BOOKING_STATUS_TONE, type Booking } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import { formatDateTime, formatPrice } from "@/utils";
import { useUpdateBookingStatusMutation } from "../api";
import { SCHEDULE_CONSTANTS } from "../constants";

export interface BookingDetailRescheduleHistoryItem {
  readonly formattedPreviousStartsAt: string;
  readonly id: string;
}

export interface UseBookingDetailViewModelOptions {
  readonly booking: Nullable<Booking>;
  readonly hasStarted?: boolean;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
  readonly timeZone?: string;
}

export interface BookingDetailViewModelResult {
  readonly bookingTitle: string;
  readonly cancellation: Booking["cancellation"];
  readonly canCancel: boolean;
  readonly canCompleteOrNoShow: boolean;
  readonly canConfirm: boolean;
  readonly canReschedule: boolean;
  readonly collaboratorName: Nullable<string>;
  readonly customerId: string;
  readonly durationMinutes: number;
  readonly formattedDate: string;
  readonly formattedPrice: string;
  readonly handleCompleteBooking: () => void;
  readonly handleConfirmBooking: () => void;
  readonly handleMarkNoShow: () => void;
  readonly isModalOpen: boolean;
  readonly isUpdatingStatus: boolean;
  readonly rescheduleHistoryItems: readonly BookingDetailRescheduleHistoryItem[];
  readonly status: Nullable<Booking["status"]>;
  readonly statusTone: Tone;
}

type UpdatableBookingStatus =
  | typeof BOOKING_STATUS.COMPLETED
  | typeof BOOKING_STATUS.CONFIRMED
  | typeof BOOKING_STATUS.NO_SHOW;

export const useBookingDetailViewModel = ({
  booking,
  hasStarted = false,
  isOpen,
  onClose,
  onSuccess,
  timeZone = SCHEDULE_CONSTANTS.DEFAULT_APP_TIME_ZONE,
}: UseBookingDetailViewModelOptions): BookingDetailViewModelResult => {
  const { i18n } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const { businessId } = useCurrentBusiness();
  const updateStatusMutation = useUpdateBookingStatusMutation();

  const updateStatus = async (
    targetStatus: UpdatableBookingStatus,
  ): Promise<void> => {
    if (!booking) {
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        bookingId: booking.id,
        businessId,
        targetStatus,
      });
      onClose();
      onSuccess?.();
    } catch {
      // Query invalidation handles refresh on error
    }
  };

  if (!booking) {
    return {
      bookingTitle: STRING.EMPTY,
      cancellation: null,
      canCancel: false,
      canCompleteOrNoShow: false,
      canConfirm: false,
      canReschedule: false,
      collaboratorName: null,
      customerId: STRING.EMPTY,
      durationMinutes: 0,
      formattedDate: STRING.EMPTY,
      formattedPrice: STRING.EMPTY,
      handleCompleteBooking: () => undefined,
      handleConfirmBooking: () => undefined,
      handleMarkNoShow: () => undefined,
      isModalOpen: false,
      isUpdatingStatus: updateStatusMutation.isPending,
      rescheduleHistoryItems: [],
      status: null,
      statusTone: TONE.NEUTRAL,
    };
  }

  const isPending = booking.status === BOOKING_STATUS.PENDING;
  const isConfirmed = booking.status === BOOKING_STATUS.CONFIRMED;

  return {
    bookingTitle: booking.serviceSnapshot.name,
    cancellation: booking.cancellation,
    canCancel: isPending || isConfirmed,
    canCompleteOrNoShow: isConfirmed && hasStarted,
    canConfirm: isPending,
    canReschedule: (isPending || isConfirmed) && !hasStarted,
    collaboratorName: booking.collaboratorName,
    customerId: booking.customerId,
    durationMinutes: booking.serviceSnapshot.durationMinutes,
    formattedDate: formatDateTime(booking.startsAt, timeZone, i18n.language),
    formattedPrice: formatPrice(
      booking.serviceSnapshot.priceInCents,
      CURRENCY_CODE.CRC,
      i18n.language,
    ),
    handleCompleteBooking: (): void => {
      void updateStatus(BOOKING_STATUS.COMPLETED);
    },
    handleConfirmBooking: (): void => {
      void updateStatus(BOOKING_STATUS.CONFIRMED);
    },
    handleMarkNoShow: (): void => {
      void updateStatus(BOOKING_STATUS.NO_SHOW);
    },
    isModalOpen: isOpen,
    isUpdatingStatus: updateStatusMutation.isPending,
    rescheduleHistoryItems: booking.rescheduleHistory.map(
      (historyItem, index) => ({
        formattedPreviousStartsAt: formatDateTime(
          historyItem.previousStartsAt,
          timeZone,
          i18n.language,
        ),
        id: `${booking.id}-reschedule-${index}`,
      }),
    ),
    status: booking.status,
    statusTone: BOOKING_STATUS_TONE[booking.status],
  };
};
