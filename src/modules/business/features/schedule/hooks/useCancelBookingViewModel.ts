import { useState, type ChangeEvent, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE, STRING } from "@/constants";
import { CANCELLATION_ACTOR, type Booking } from "@/domain";
import { useCurrentBusiness } from "@/modules/auth";
import type { Nullable } from "@/types";
import { useCancelBookingMutation } from "../api";
import { SCHEDULE_CONSTANTS } from "../constants";

export interface CancelBookingViewModelResult {
  readonly closeForm: () => void;
  readonly errorMessage: Nullable<string>;
  readonly handleNoteChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  readonly handlePenalizedChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
  readonly handleSubmit: (event: FormEvent<HTMLFormElement>) => void;
  readonly isCancelling: boolean;
  readonly isModalOpen: boolean;
  readonly isPenalized: boolean;
  readonly note: string;
  readonly serviceName: string;
  readonly submitForm: () => Promise<boolean>;
  readonly togglePenalized: (penalized: boolean) => void;
  readonly updateNote: (newNote: string) => void;
}

interface UseCancelBookingViewModelOptions {
  readonly booking: Nullable<Booking>;
  readonly isOpen?: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

export const useCancelBookingViewModel = ({
  booking,
  isOpen = false,
  onClose,
  onSuccess,
}: UseCancelBookingViewModelOptions): CancelBookingViewModelResult => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.VALIDATION,
    I18N_NAMESPACE.COMMON,
  ]);
  const { businessId } = useCurrentBusiness();
  const cancelMutation = useCancelBookingMutation();

  const [note, setNote] = useState<string>(STRING.EMPTY);
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
      setErrorMessage(t("validation:required"));
      return false;
    }

    if (note.length > SCHEDULE_CONSTANTS.CANCELLATION_NOTE_MAX_LENGTH) {
      setErrorMessage(t("validation:tooLong"));
      return false;
    }

    try {
      await cancelMutation.mutateAsync({
        bookingId: booking.id,
        businessId,
        cancelledBy: CANCELLATION_ACTOR.BUSINESS,
        isPenalized,
        note: note.trim(),
      });

      closeForm();
      onSuccess?.();
      return true;
    } catch {
      setErrorMessage(t("common:errors.network"));
      return false;
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void submitForm();
  };

  const handleNoteChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    setNote(event.target.value);
  };

  const handlePenalizedChange = (
    event: ChangeEvent<HTMLInputElement>,
  ): void => {
    setIsPenalized(event.target.checked);
  };

  return {
    closeForm,
    errorMessage,
    handleNoteChange,
    handlePenalizedChange,
    handleSubmit,
    isCancelling: cancelMutation.isPending,
    isModalOpen: isOpen && Boolean(booking),
    isPenalized,
    note,
    serviceName: booking?.serviceSnapshot.name ?? STRING.EMPTY,
    submitForm,
    togglePenalized: setIsPenalized,
    updateNote: setNote,
  };
};
