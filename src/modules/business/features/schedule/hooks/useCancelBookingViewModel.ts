import { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/constants";
import type { Booking } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import { useCancelBookingMutation } from "../api";
import { SCHEDULE_CONSTANTS } from "../constants";

export interface CancelBookingViewModelResult {
  readonly closeForm: () => void;
  readonly errorMessage: Nullable<string>;
  readonly isCancelling: boolean;
  readonly isPenalized: boolean;
  readonly note: string;
  readonly submitForm: () => Promise<boolean>;
  readonly togglePenalized: (penalized: boolean) => void;
  readonly updateNote: (newNote: string) => void;
}

interface UseCancelBookingViewModelOptions {
  readonly booking: Nullable<Booking>;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

export const useCancelBookingViewModel = ({
  booking,
  onClose,
  onSuccess,
}: UseCancelBookingViewModelOptions): CancelBookingViewModelResult => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    "validation",
    I18N_NAMESPACE.COMMON,
  ]);
  const { businessId } = useCurrentBusiness();
  const cancelMutation = useCancelBookingMutation();

  const [note, setNote] = useState<string>("");
  const [isPenalized, setIsPenalized] = useState<boolean>(false);
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

    if (!note.trim()) {
      setErrorMessage(
        t("validation:required", { defaultValue: "Campo requerido" }),
      );
      return false;
    }

    if (note.length > SCHEDULE_CONSTANTS.CANCELLATION_NOTE_MAX_LENGTH) {
      setErrorMessage(
        t("validation:tooLong", { defaultValue: "Texto demasiado largo" }),
      );
      return false;
    }

    try {
      await cancelMutation.mutateAsync({
        bookingId: booking.id,
        businessId,
        cancelledBy: "business",
        isPenalized,
        note: note.trim(),
      });

      closeForm();
      if (onSuccess) {
        onSuccess();
      }
      return true;
    } catch {
      setErrorMessage(
        t("errors.common.network", { defaultValue: "Error de red" }),
      );
      return false;
    }
  };

  return {
    closeForm,
    errorMessage,
    isCancelling: cancelMutation.isPending,
    isPenalized,
    note,
    submitForm,
    togglePenalized: setIsPenalized,
    updateNote: setNote,
  };
};
