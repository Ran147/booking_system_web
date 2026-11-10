import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  ALERT_VARIANT,
  Button,
  BUTTON_VARIANT,
  CheckboxField,
  Modal,
  TextareaField,
} from "@/components/common";
import { I18N_NAMESPACE } from "@/constants";
import type { Booking } from "@/domain";
import {
  SCHEDULE_CONSTANTS,
  useCancelBookingViewModel,
} from "@/modules/business/features/schedule";
import type { Nullable } from "@/types";

interface CancelBookingDialogProps {
  readonly booking: Nullable<Booking>;
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSuccess?: () => void;
}

export const CancelBookingDialog = ({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: CancelBookingDialogProps): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const {
    closeForm,
    errorMessage,
    isCancelling,
    isPenalized,
    note,
    submitForm,
    togglePenalized,
    updateNote,
  } = useCancelBookingViewModel({ booking, onClose, onSuccess });

  return (
    <Modal
      isOpen={isOpen && Boolean(booking)}
      title={t("schedule.bookings.cancelTitle")}
      onClose={closeForm}
    >
      <form
        className="flex flex-col gap-4 mt-2"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submitForm();
        }}
      >
        {errorMessage && (
          <Alert variant={ALERT_VARIANT.DESTRUCTIVE}>{errorMessage}</Alert>
        )}

        <p className="text-sm text-muted-foreground">
          {t("schedule.bookings.service")}:{" "}
          <strong className="text-foreground">
            {booking?.serviceSnapshot.name}
          </strong>
        </p>

        <TextareaField
          label={t("schedule.bookings.noteLabel")}
          maxLength={SCHEDULE_CONSTANTS.CANCELLATION_NOTE_MAX_LENGTH}
          placeholder={t("schedule.bookings.notePlaceholder")}
          required
          rows={3}
          showCharacterCount
          value={note}
          onChange={(event) => updateNote(event.target.value)}
        />

        <div className="flex flex-col gap-1 p-3 rounded-lg border border-border bg-muted/30">
          <CheckboxField
            checked={isPenalized}
            label={t("schedule.bookings.penaltyLabel")}
            onChange={(event) => togglePenalized(event.target.checked)}
          />
          <span className="text-xs text-muted-foreground ml-6">
            {t("schedule.bookings.penaltyDescription")}
          </span>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-border">
          <Button variant={BUTTON_VARIANT.OUTLINE} onClick={closeForm}>
            {t("common:actions.cancel", { defaultValue: "Cancelar" })}
          </Button>
          <Button
            disabled={isCancelling}
            isLoading={isCancelling}
            type="submit"
            variant={BUTTON_VARIANT.DESTRUCTIVE}
          >
            {t("schedule.bookings.cancelAction")}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
