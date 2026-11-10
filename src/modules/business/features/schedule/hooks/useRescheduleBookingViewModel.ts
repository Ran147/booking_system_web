import { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import type { Booking } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import { useRescheduleBookingMutation } from "../api";

export interface RescheduleBookingViewModelResult {
  readonly closeForm: () => void;
  readonly date: string;
  readonly errorMessage: Nullable<string>;
  readonly isRescheduling: boolean;
  readonly submitForm: () => Promise<boolean>;
  readonly time: string;
  readonly updateDate: (newDate: string) => void;
  readonly updateTime: (newTime: string) => void;
}

interface UseRescheduleBookingViewModelOptions {
  readonly booking: Nullable<Booking>;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

const TWO_DIGIT_PAD = 2;
const DEFAULT_RESCHEDULE_HOUR = 10;

const formatLocalDate = (targetDate: Date): string => {
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(TWO_DIGIT_PAD, "0");
  const day = String(targetDate.getDate()).padStart(TWO_DIGIT_PAD, "0");
  return `${year}-${month}-${day}`;
};

const formatLocalTime = (targetDate: Date): string => {
  const hours = String(targetDate.getHours()).padStart(TWO_DIGIT_PAD, "0");
  const minutes = String(targetDate.getMinutes()).padStart(TWO_DIGIT_PAD, "0");
  return `${hours}:${minutes}`;
};

const getTomorrowAtTen = (): Date => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(DEFAULT_RESCHEDULE_HOUR, 0, 0, 0);
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

  const tomorrow = getTomorrowAtTen();
  return {
    date: formatLocalDate(tomorrow),
    time: formatLocalTime(tomorrow),
  };
};

export const useRescheduleBookingViewModel = ({
  booking,
  onClose,
  onSuccess,
}: UseRescheduleBookingViewModelOptions): RescheduleBookingViewModelResult => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    "validation",
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
      setErrorMessage(
        t("validation:required", { defaultValue: "Campo requerido" }),
      );
      return false;
    }

    const localTargetDate = new Date(`${date}T${time}:00`);
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
      if (onSuccess) {
        onSuccess();
      }
      return true;
    } catch (error: unknown) {
      const errorMessageText =
        error && typeof error === "object" && "message" in error
          ? String(error.message)
          : "";

      if (errorMessageText.includes("slot_taken")) {
        setErrorMessage(t("schedule.bookings.slotTakenError"));
      } else if (
        errorMessageText.includes("cannot_reschedule_past") ||
        errorMessageText.includes("slot_in_past")
      ) {
        setErrorMessage(t("schedule.bookings.cannotReschedulePastError"));
      } else if (
        errorMessageText.includes("cannot_reschedule") ||
        errorMessageText.includes("invalid_transition")
      ) {
        setErrorMessage(t("schedule.bookings.cannotRescheduleError"));
      } else {
        setErrorMessage(
          t("errors.common.network", { defaultValue: "Error de red" }),
        );
      }
      return false;
    }
  };

  return {
    closeForm,
    date,
    errorMessage,
    isRescheduling: rescheduleMutation.isPending,
    submitForm,
    time,
    updateDate: setDate,
    updateTime: setTime,
  };
};
