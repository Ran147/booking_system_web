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

const getTodayIso = (): string => new Date().toISOString().split("T")[0] ?? "";

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

  const [date, setDate] = useState<string>(getTodayIso());
  const [time, setTime] = useState<string>("11:00");
  const [errorMessage, setErrorMessage] = useState<Nullable<string>>(null);

  const closeForm = (): void => {
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

    const newStartsAtIso = `${date}T${time}:00`;

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
      if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        String(error.message).includes("slot_taken")
      ) {
        setErrorMessage(t("schedule.bookings.slotTakenError"));
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
