import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE, STRING } from "@/constants";
import type { Booking } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import { useRescheduleBookingMutation } from "../api";
import { SCHEDULE_BOOKING_ERROR_CODE, SCHEDULE_CONSTANTS } from "../constants";

export interface RescheduleBookingViewModelResult {
  readonly closeForm: () => void;
  readonly date: string;
  readonly errorMessage: Nullable<string>;
  readonly handleDateChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly handleTimeChange: (event: ChangeEvent<HTMLInputElement>) => void;
  readonly isModalOpen: boolean;
  readonly isRescheduling: boolean;
  readonly serviceName: string;
  readonly submitForm: () => Promise<boolean>;
  readonly time: string;
  readonly updateDate: (newDate: string) => void;
  readonly updateTime: (newTime: string) => void;
}

interface UseRescheduleBookingViewModelOptions {
  readonly booking: Nullable<Booking>;
  readonly isOpen?: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const formatLocalDate = (targetDate: Date): string => {
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(
    SCHEDULE_CONSTANTS.TWO_DIGIT_PAD,
    SCHEDULE_CONSTANTS.ZERO_PAD_CHAR,
  );
  const day = String(targetDate.getDate()).padStart(
    SCHEDULE_CONSTANTS.TWO_DIGIT_PAD,
    SCHEDULE_CONSTANTS.ZERO_PAD_CHAR,
  );
  return `${year}-${month}-${day}`;
};

const formatLocalTime = (targetDate: Date): string => {
  const hours = String(targetDate.getHours()).padStart(
    SCHEDULE_CONSTANTS.TWO_DIGIT_PAD,
    SCHEDULE_CONSTANTS.ZERO_PAD_CHAR,
  );
  const minutes = String(targetDate.getMinutes()).padStart(
    SCHEDULE_CONSTANTS.TWO_DIGIT_PAD,
    SCHEDULE_CONSTANTS.ZERO_PAD_CHAR,
  );
  return `${hours}:${minutes}`;
};

const getTomorrowAtDefaultHour = (): Date => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(SCHEDULE_CONSTANTS.DEFAULT_RESCHEDULE_HOUR, 0, 0, 0);
  return tomorrow;
};

const resolveInitialDateTime = (
  booking: Nullable<Booking>,
): { readonly date: string; readonly time: string } => {
  if (booking && booking.startsAt.getTime() > Date.now()) {
    return {
      date: formatLocalDate(booking.startsAt),
      time: formatLocalTime(booking.startsAt),
    };
  }

  const tomorrow = getTomorrowAtDefaultHour();
  return {
    date: formatLocalDate(tomorrow),
    time: formatLocalTime(tomorrow),
  };
};

export const useRescheduleBookingViewModel = ({
  booking,
  isOpen = false,
  onClose,
  onSuccess,
}: UseRescheduleBookingViewModelOptions): RescheduleBookingViewModelResult => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.VALIDATION,
    I18N_NAMESPACE.COMMON,
  ]);
  const { businessId } = useCurrentBusiness();
  const rescheduleMutation = useRescheduleBookingMutation();

  const [prevBookingId, setPrevBookingId] = useState<Nullable<string>>(
    booking?.id ?? null,
  );
  const initialDateTime = resolveInitialDateTime(booking);
  const [date, setDate] = useState<string>(initialDateTime.date);
  const [time, setTime] = useState<string>(initialDateTime.time);
  const [errorMessage, setErrorMessage] = useState<Nullable<string>>(null);

  if (booking && booking.id !== prevBookingId) {
    setPrevBookingId(booking.id);
    const nextDateTime = resolveInitialDateTime(booking);
    setDate(nextDateTime.date);
    setTime(nextDateTime.time);
    setErrorMessage(null);
  }

  const closeForm = (): void => {
    const nextDateTime = resolveInitialDateTime(booking);
    setDate(nextDateTime.date);
    setTime(nextDateTime.time);
    setErrorMessage(null);
    onClose();
  };

  const submitForm = async (): Promise<boolean> => {
    setErrorMessage(null);

    if (!booking) {
      return false;
    }

    if (!date || !time) {
      setErrorMessage(t("validation:required"));
      return false;
    }

    const localTargetDate = new Date(
      `${date}T${time}${SCHEDULE_CONSTANTS.SECONDS_SUFFIX}`,
    );
    if (localTargetDate.getTime() <= Date.now()) {
      setErrorMessage(t("schedule.bookings.slotUnavailableError"));
      return false;
    }

    const newStartsAtIso = localTargetDate.toISOString();

    try {
      await rescheduleMutation.mutateAsync({
        bookingId: booking.id,
        businessId,
        newStartsAt: newStartsAtIso,
      });

      closeForm();
      onSuccess?.();
      return true;
    } catch (error: unknown) {
      const errorMessageText =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : STRING.EMPTY;

      if (errorMessageText.includes(SCHEDULE_BOOKING_ERROR_CODE.SLOT_TAKEN)) {
        setErrorMessage(t("schedule.bookings.slotTakenError"));
      } else if (
        errorMessageText.includes(
          SCHEDULE_BOOKING_ERROR_CODE.CANNOT_RESCHEDULE_PAST,
        ) ||
        errorMessageText.includes(SCHEDULE_BOOKING_ERROR_CODE.SLOT_IN_PAST)
      ) {
        setErrorMessage(t("schedule.bookings.cannotReschedulePastError"));
      } else if (
        errorMessageText.includes(
          SCHEDULE_BOOKING_ERROR_CODE.CANNOT_RESCHEDULE,
        ) ||
        errorMessageText.includes(
          SCHEDULE_BOOKING_ERROR_CODE.INVALID_TRANSITION,
        )
      ) {
        setErrorMessage(t("schedule.bookings.cannotRescheduleError"));
      } else {
        setErrorMessage(t("common:errors.network"));
      }
      return false;
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void submitForm();
  };

  const handleDateChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setDate(event.target.value);
  };

  const handleTimeChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setTime(event.target.value);
  };

  return {
    closeForm,
    date,
    errorMessage,
    handleDateChange,
    handleSubmit,
    handleTimeChange,
    isModalOpen: isOpen && Boolean(booking),
    isRescheduling: rescheduleMutation.isPending,
    serviceName: booking?.serviceSnapshot.name ?? STRING.EMPTY,
    submitForm,
    time,
    updateDate: setDate,
    updateTime: setTime,
  };
};
